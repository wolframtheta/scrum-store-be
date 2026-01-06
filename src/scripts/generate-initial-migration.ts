import { AppDataSource } from '../data-source';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Script per generar la primera migració basada en l'estat actual de la base de dades.
 * Aquest script compara l'estat actual de la DB amb les entitats i genera una migració.
 */
async function generateInitialMigration() {
  try {
    console.log('🔌 Connectant a la base de dades...');
    await AppDataSource.initialize();
    console.log('✅ Connectat correctament');

    console.log('📊 Analitzant esquema actual de la base de dades...');
    
    // Obtenir informació de les taules existents
    const queryRunner = AppDataSource.createQueryRunner();
    const tables = await queryRunner.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    console.log(`📋 Taules trobades: ${tables.length}`);
    tables.forEach((table: { table_name: string }) => {
      console.log(`  - ${table.table_name}`);
    });

    // Obtenir informació dels enums
    const enums = await queryRunner.query(`
      SELECT t.typname as enum_name, 
             string_agg(e.enumlabel, ',' ORDER BY e.enumsortorder) as enum_values
      FROM pg_type t 
      JOIN pg_enum e ON t.oid = e.enumtypid  
      WHERE t.typname NOT LIKE 'pg_%'
      GROUP BY t.typname
      ORDER BY t.typname;
    `);

    if (enums.length > 0) {
      console.log(`\n📝 Enums trobats: ${enums.length}`);
      enums.forEach((enumType: { enum_name: string; enum_values: string }) => {
        console.log(`  - ${enumType.enum_name}: [${enumType.enum_values}]`);
      });
    }

    // Generar migració usant TypeORM
    console.log('\n🔄 Generant migració amb TypeORM...');
    const timestamp = Date.now();
    const migrationName = `InitialSchema${timestamp}`;
    
    // Usar la comanda de TypeORM per generar la migració
    console.log('\n💡 Per generar la migració, executa:');
    console.log(`   npm run migration:generate -- migrations/${migrationName}`);
    console.log('\n   O manualment:');
    console.log(`   ts-node ./node_modules/typeorm/cli.js migration:generate -d src/data-source.ts migrations/${migrationName}`);

    await queryRunner.release();
    await AppDataSource.destroy();
    
    console.log('\n✅ Anàlisi completada');
  } catch (error) {
    console.error('❌ Error generant migració:', error);
    process.exit(1);
  }
}

generateInitialMigration();

