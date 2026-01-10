import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migración para corregir el tipo de dato de user_email en la tabla sales.
 * Si la columna es uuid, la convierte a varchar(255) para que coincida con users.email
 */
export class FixSalesUserEmailType1736300000000 implements MigrationInterface {
  name = 'FixSalesUserEmailType1736300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar si la tabla sales existe y el tipo de dato de user_email
    const tableExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'sales'
      );
    `);

    if (!tableExists[0]?.exists) {
      console.log('⚠️  Table "sales" does not exist, skipping type fix');
      return;
    }

    // Verificar el tipo de dato actual de user_email
    const columnInfo = await queryRunner.query(`
      SELECT data_type, character_maximum_length
      FROM information_schema.columns
      WHERE table_schema = 'public' 
      AND table_name = 'sales' 
      AND column_name = 'user_email';
    `);

    if (columnInfo.length === 0) {
      console.log('⚠️  Column "user_email" does not exist in table "sales", skipping type fix');
      return;
    }

    const currentType = columnInfo[0].data_type;
    const maxLength = columnInfo[0].character_maximum_length;

    // Si el tipo es uuid, necesitamos convertirlo a varchar
    if (currentType === 'uuid') {
      console.log('🔄 Converting user_email from uuid to varchar(255) in table sales...');

      // Verificar si hay datos en la tabla
      const rowCount = await queryRunner.query(`
        SELECT COUNT(*) as count FROM "sales";
      `);
      const hasData = parseInt(rowCount[0].count) > 0;

      if (hasData) {
        console.log('⚠️  Table "sales" contains data. Migrating UUIDs to emails...');
        
        // Eliminar TODAS las foreign keys que referencian user_email
        // Pueden tener nombres diferentes (generados automáticamente por TypeORM)
        const foreignKeys = await queryRunner.query(`
          SELECT tc.constraint_name
          FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
            AND tc.table_name = kcu.table_name
          WHERE tc.table_schema = 'public'
            AND tc.table_name = 'sales'
            AND tc.constraint_type = 'FOREIGN KEY'
            AND kcu.column_name = 'user_email';
        `);

        for (const fk of foreignKeys) {
          try {
            await queryRunner.query(`
              ALTER TABLE "sales" 
              DROP CONSTRAINT IF EXISTS "${fk.constraint_name}" CASCADE;
            `);
            console.log(`  ✓ Dropped foreign key: ${fk.constraint_name}`);
          } catch (error) {
            console.warn(`  ⚠ Could not drop foreign key ${fk.constraint_name}:`, error);
          }
        }

        // Añadir una columna temporal para almacenar el email
        await queryRunner.query(`
          ALTER TABLE "sales" 
          ADD COLUMN IF NOT EXISTS "user_email_temp" character varying(255);
        `);

        // Migrar los datos: convertir UUID a email usando la tabla users
        await queryRunner.query(`
          UPDATE "sales" s
          SET "user_email_temp" = u.email
          FROM "users" u
          WHERE s."user_email"::text = u.id::text;
        `);

        // Verificar si hay filas que no se pudieron migrar
        const unmigratedCount = await queryRunner.query(`
          SELECT COUNT(*) as count 
          FROM "sales" 
          WHERE "user_email_temp" IS NULL;
        `);

        if (parseInt(unmigratedCount[0].count) > 0) {
          throw new Error(
            `Cannot migrate ${unmigratedCount[0].count} rows: UUIDs in user_email do not match any user.id. ` +
            `Please fix these rows manually before running this migration.`
          );
        }

        // Eliminar la columna antigua y renombrar la nueva
        await queryRunner.query(`
          ALTER TABLE "sales" 
          DROP COLUMN "user_email";
        `);

        await queryRunner.query(`
          ALTER TABLE "sales" 
          RENAME COLUMN "user_email_temp" TO "user_email";
        `);

        await queryRunner.query(`
          ALTER TABLE "sales" 
          ALTER COLUMN "user_email" SET NOT NULL;
        `);

        console.log('✅ Successfully migrated user_email from uuid to varchar(255)');
      } else {
        // Si no hay datos, simplemente cambiar el tipo
        // Primero eliminar TODAS las foreign keys que referencian user_email
        const foreignKeys = await queryRunner.query(`
          SELECT tc.constraint_name
          FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
            AND tc.table_name = kcu.table_name
          WHERE tc.table_schema = 'public'
            AND tc.table_name = 'sales'
            AND tc.constraint_type = 'FOREIGN KEY'
            AND kcu.column_name = 'user_email';
        `);

        for (const fk of foreignKeys) {
          try {
            await queryRunner.query(`
              ALTER TABLE "sales" 
              DROP CONSTRAINT IF EXISTS "${fk.constraint_name}" CASCADE;
            `);
            console.log(`  ✓ Dropped foreign key: ${fk.constraint_name}`);
          } catch (error) {
            console.warn(`  ⚠ Could not drop foreign key ${fk.constraint_name}:`, error);
          }
        }

        // Ahora cambiar el tipo de la columna
        await queryRunner.query(`
          ALTER TABLE "sales" 
          ALTER COLUMN "user_email" TYPE character varying(255) 
          USING user_email::text;
        `);

        console.log('✅ Successfully converted user_email to varchar(255)');
      }
    } else if (currentType === 'character varying' && maxLength === 255) {
      console.log('✅ Column user_email already has correct type (varchar(255))');
    } else {
      console.log(`⚠️  Column user_email has unexpected type: ${currentType} (max_length: ${maxLength})`);
      console.log('⚠️  Manual intervention may be required');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revertir el cambio: convertir de varchar a uuid
    // NOTA: Esto puede fallar si hay valores que no son UUIDs válidos
    console.warn('⚠️  Reverting user_email type change may cause data loss if values are not valid UUIDs');
    
    try {
      await queryRunner.query(`
        ALTER TABLE "sales" 
        DROP CONSTRAINT IF EXISTS "FK_sales_user_email";
      `);

      await queryRunner.query(`
        ALTER TABLE "sales" 
        ALTER COLUMN "user_email" TYPE uuid 
        USING user_email::uuid;
      `);
    } catch (error) {
      console.error('❌ Error reverting user_email type:', error);
      throw error;
    }
  }
}

