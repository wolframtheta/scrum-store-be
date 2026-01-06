import { AppDataSource } from '../data-source';
import { runSeeds } from '../seeds/run';

/**
 * Script per esborrar dades de seed i tornar-les a crear.
 * ⚠️ ATENCIÓ: Aquest script esborra dades de desenvolupament.
 */
async function resetSeeds() {
  try {
    console.log('🔌 Connectant a la base de dades...');
    await AppDataSource.initialize();
    console.log('✅ Connectat correctament');

    const queryRunner = AppDataSource.createQueryRunner();

    console.log('\n🗑️  Esborrant dades de seed...');

    // Esborrar en ordre invers de dependències
    await queryRunner.query(`DELETE FROM "user_consumer_groups" WHERE "user_email" IN (SELECT "email" FROM "users" WHERE "email" LIKE '%@scrumstore.com')`);
    await queryRunner.query(`DELETE FROM "consumer_groups" WHERE "email" LIKE '%@scrumstore.com'`);
    await queryRunner.query(`DELETE FROM "users" WHERE "email" LIKE '%@scrumstore.com'`);

    console.log('✅ Dades de seed esborrades');

    await queryRunner.release();
    await AppDataSource.destroy();

    console.log('\n🌱 Executant seeds...\n');
    await runSeeds();
  } catch (error) {
    console.error('❌ Error resetejant seeds:', error);
    process.exit(1);
  }
}

resetSeeds();

