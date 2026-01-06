import { AppDataSource } from '../data-source';

/**
 * Script per sincronitzar l'esquema de la base de dades amb les entitats.
 * ÚTIL PER DESENVOLUPAMENT: Genera una migració basada en les diferències.
 */
async function syncSchema() {
  try {
    console.log('🔌 Connectant a la base de dades...');
    await AppDataSource.initialize();
    console.log('✅ Connectat correctament');

    const queryRunner = AppDataSource.createQueryRunner();
    
    // Obtenir metadades de les entitats
    const entityMetadatas = AppDataSource.entityMetadatas;
    console.log(`\n📦 Entitats definides: ${entityMetadatas.length}`);
    entityMetadatas.forEach((metadata) => {
      console.log(`  - ${metadata.name} (${metadata.tableName})`);
    });

    // Obtenir taules de la DB
    const dbTables = await queryRunner.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    console.log(`\n🗄️  Taules a la base de dades: ${dbTables.length}`);
    dbTables.forEach((table: { table_name: string }) => {
      console.log(`  - ${table.table_name}`);
    });

    // Comparar
    const entityTableNames = entityMetadatas.map((m) => m.tableName);
    const dbTableNames = dbTables.map((t: { table_name: string }) => t.table_name);

    const missingInDb = entityTableNames.filter((t) => !dbTableNames.includes(t));
    const extraInDb = dbTableNames.filter((t) => !entityTableNames.includes(t));

    if (missingInDb.length > 0) {
      console.log(`\n⚠️  Taules definides a entitats però no a la DB:`);
      missingInDb.forEach((t) => console.log(`  - ${t}`));
    }

    if (extraInDb.length > 0) {
      console.log(`\n⚠️  Taules a la DB però no definides a entitats:`);
      extraInDb.forEach((t) => console.log(`  - ${t}`));
    }

    if (missingInDb.length === 0 && extraInDb.length === 0) {
      console.log('\n✅ Totes les taules estan sincronitzades');
    } else {
      console.log('\n💡 Executa "npm run migration:generate" per generar una migració');
    }

    await queryRunner.release();
    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Error sincronitzant esquema:', error);
    process.exit(1);
  }
}

syncSchema();

