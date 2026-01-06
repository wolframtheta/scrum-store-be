import { AppDataSource } from '../data-source';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Script per generar la primera migració basada en l'estat actual de la base de dades.
 * Aquest script crea una migració que reflecteix l'estat actual de la DB.
 * 
 * Ús: ts-node src/scripts/generate-from-db.ts
 */
async function generateFromDb() {
  try {
    console.log('🔌 Connectant a la base de dades...');
    await AppDataSource.initialize();
    console.log('✅ Connectat correctament\n');

    const queryRunner = AppDataSource.createQueryRunner();

    // Obtenir totes les taules
    const tables = await queryRunner.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    if (tables.length === 0) {
      console.log('⚠️  No hi ha taules a la base de dades.');
      console.log('💡 Executa "npm run migration:run" per crear les taules inicials.');
      await queryRunner.release();
      await AppDataSource.destroy();
      return;
    }

    console.log(`📊 Analitzant ${tables.length} taules...\n`);

    // Obtenir enums
    const enums = await queryRunner.query(`
      SELECT DISTINCT t.typname as enum_name
      FROM pg_type t 
      JOIN pg_enum e ON t.oid = e.enumtypid  
      WHERE t.typname NOT LIKE 'pg_%'
      ORDER BY t.typname;
    `);

    // Obtenir extensions
    const extensions = await queryRunner.query(`
      SELECT extname 
      FROM pg_extension 
      WHERE extname != 'plpgsql'
      ORDER BY extname;
    `);

    // Generar timestamp per la migració
    const timestamp = Date.now();
    const migrationName = `InitialSchema${timestamp}`;
    const className = `InitialSchema${timestamp}`;
    const migrationPath = path.join(__dirname, '../../migrations', `${timestamp}-InitialSchema.ts`);

    console.log(`📝 Generant migració: ${migrationName}\n`);

    // Generar contingut de la migració
    let migrationContent = `import { MigrationInterface, QueryRunner } from 'typeorm';

export class ${className} implements MigrationInterface {
  name = '${className}';

  public async up(queryRunner: QueryRunner): Promise<void> {
`;

    // Extensions
    if (extensions.length > 0) {
      migrationContent += '\n    // Extensions\n';
      for (const ext of extensions) {
        migrationContent += `    await queryRunner.query(\`CREATE EXTENSION IF NOT EXISTS "${ext.extname}"\`);\n`;
      }
    }

    // Enums
    if (enums.length > 0) {
      migrationContent += '\n    // Enum types\n';
      for (const enumType of enums) {
        const enumValues = await queryRunner.query(`
          SELECT e.enumlabel 
          FROM pg_type t 
          JOIN pg_enum e ON t.oid = e.enumtypid  
          WHERE t.typname = $1
          ORDER BY e.enumsortorder;
        `, [enumType.enum_name]);
        
        const values = enumValues.map((v: { enumlabel: string }) => `'${v.enumlabel}'`).join(', ');
        migrationContent += `    await queryRunner.query(\`
      CREATE TYPE "public"."${enumType.enum_name}" AS ENUM(${values});
    \`);\n`;
      }
    }

    // Taules
    migrationContent += '\n    // Tables\n';
    for (const table of tables) {
      const tableName = table.table_name;
      
      // Obtenir definició de la taula
      const columns = await queryRunner.query(`
        SELECT 
          column_name,
          data_type,
          character_maximum_length,
          is_nullable,
          column_default,
          udt_name
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position;
      `, [tableName]);

      // Obtenir constraints
      const constraints = await queryRunner.query(`
        SELECT 
          tc.constraint_name,
          tc.constraint_type,
          kcu.column_name
        FROM information_schema.table_constraints tc
        LEFT JOIN information_schema.key_column_usage kcu 
          ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_schema = 'public' AND tc.table_name = $1;
      `, [tableName]);

      // Obtenir índexs
      const indexes = await queryRunner.query(`
        SELECT 
          indexname,
          indexdef
        FROM pg_indexes
        WHERE schemaname = 'public' AND tablename = $1;
      `, [tableName]);

      // Obtenir foreign keys
      const foreignKeys = await queryRunner.query(`
        SELECT
          tc.constraint_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name,
          rc.delete_rule
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        JOIN information_schema.referential_constraints AS rc
          ON rc.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' 
          AND tc.table_schema = 'public'
          AND tc.table_name = $1;
      `, [tableName]);

      migrationContent += `\n    // Table: ${tableName}\n`;
      migrationContent += `    await queryRunner.query(\`
      CREATE TABLE "${tableName}" (\n`;

      const columnDefs: string[] = [];
      for (const col of columns) {
        let colDef = `        "${col.column_name}" `;
        
        // Tipus de dades
        if (col.udt_name === 'uuid') {
          colDef += 'uuid';
        } else if (col.udt_name === 'varchar') {
          colDef += `character varying(${col.character_maximum_length || 255})`;
        } else if (col.udt_name === 'text') {
          colDef += 'text';
        } else if (col.udt_name === 'bool') {
          colDef += 'boolean';
        } else if (col.udt_name === 'timestamp') {
          colDef += 'TIMESTAMP';
        } else if (col.udt_name === 'date') {
          colDef += 'date';
        } else if (col.udt_name === 'numeric') {
          // Obtenir precision i scale
          const numericInfo = await queryRunner.query(`
            SELECT numeric_precision, numeric_scale
            FROM information_schema.columns
            WHERE table_schema = 'public' 
              AND table_name = $1 
              AND column_name = $2;
          `, [tableName, col.column_name]);
          const precision = numericInfo[0]?.numeric_precision || 10;
          const scale = numericInfo[0]?.numeric_scale || 2;
          colDef += `numeric(${precision},${scale})`;
        } else if (col.udt_name.startsWith('_')) {
          // Array type
          const baseType = col.udt_name.substring(1);
          colDef += `"public"."${baseType}"[]`;
        } else {
          colDef += `"public"."${col.udt_name}"`;
        }

        if (col.is_nullable === 'NO') {
          colDef += ' NOT NULL';
        }

        if (col.column_default) {
          let defaultValue = col.column_default;
          // Netejar el default
          defaultValue = defaultValue.replace(/::.*$/, '');
          colDef += ` DEFAULT ${defaultValue}`;
        }

        columnDefs.push(colDef);
      }

      migrationContent += columnDefs.join(',\n');
      migrationContent += '\n      )\n    `);\n';

      // Constraints
      const primaryKeys = constraints.filter((c: { constraint_type: string }) => c.constraint_type === 'PRIMARY KEY');
      const uniqueConstraints = constraints.filter((c: { constraint_type: string }) => c.constraint_type === 'UNIQUE');

      for (const pk of primaryKeys) {
        migrationContent += `\n    await queryRunner.query(\`
      ALTER TABLE "${tableName}" 
      ADD CONSTRAINT "${pk.constraint_name}" PRIMARY KEY ("${pk.column_name}")
    \`);\n`;
      }

      for (const uq of uniqueConstraints) {
        migrationContent += `\n    await queryRunner.query(\`
      ALTER TABLE "${tableName}" 
      ADD CONSTRAINT "${uq.constraint_name}" UNIQUE ("${uq.column_name}")
    \`);\n`;
      }

      // Foreign keys
      for (const fk of foreignKeys) {
        migrationContent += `\n    await queryRunner.query(\`
      ALTER TABLE "${tableName}" 
      ADD CONSTRAINT "${fk.constraint_name}" 
      FOREIGN KEY ("${fk.column_name}") REFERENCES "${fk.foreign_table_name}"("${fk.foreign_column_name}") 
      ON DELETE ${fk.delete_rule}
    \`);\n`;
      }

      // Índexs (excloent primary keys i unique constraints)
      const regularIndexes = indexes.filter((idx: { indexname: string }) => {
        return !idx.indexname.includes('_pkey') && !idx.indexname.includes('_key');
      });

      for (const idx of regularIndexes) {
        const indexDef = idx.indexdef.replace(/CREATE (UNIQUE )?INDEX .+ ON /, '');
        migrationContent += `\n    await queryRunner.query(\`
      CREATE INDEX "${idx.indexname}" ON ${indexDef}
    \`);\n`;
      }
    }

    // Down migration
    migrationContent += `  }

  public async down(queryRunner: QueryRunner): Promise<void> {
`;

    // Eliminar en ordre invers
    for (let i = tables.length - 1; i >= 0; i--) {
      const tableName = tables[i].table_name;
      migrationContent += `    await queryRunner.query(\`DROP TABLE IF EXISTS "${tableName}" CASCADE\`);\n`;
    }

    // Eliminar enums
    if (enums.length > 0) {
      migrationContent += '\n    // Drop enum types\n';
      for (let i = enums.length - 1; i >= 0; i--) {
        migrationContent += `    await queryRunner.query(\`DROP TYPE IF EXISTS "public"."${enums[i].enum_name}"\`);\n`;
      }
    }

    migrationContent += `  }
}
`;

    // Escriure fitxer
    fs.writeFileSync(migrationPath, migrationContent, 'utf-8');
    console.log(`✅ Migració generada: ${migrationPath}\n`);

    console.log('💡 Per executar la migració:');
    console.log('   npm run migration:run\n');

    await queryRunner.release();
    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Error generant migració:', error);
    process.exit(1);
  }
}

generateFromDb();

