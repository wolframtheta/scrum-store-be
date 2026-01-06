import { AppDataSource } from '../data-source';
import { seedUsers } from './users.seed';
import { seedConsumerGroups } from './consumer-groups.seed';

/**
 * Script principal per executar tots els seeds.
 * Els seeds s'executen en ordre per respectar les dependències.
 */
async function runSeeds() {
  try {
    console.log('🔌 Inicialitzant connexió a la base de dades...');
    await AppDataSource.initialize();
    console.log('✅ Connectat correctament');

    console.log('\n🌱 Executant seeds...\n');
    
    // Executar seeds en ordre (respectant dependències)
    await seedUsers(AppDataSource);
    await seedConsumerGroups(AppDataSource);

    console.log('\n✅ Seeds completats correctament!');
  } catch (error) {
    console.error('❌ Error executant seeds:', error);
    process.exit(1);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

// Executar si es crida directament
if (require.main === module) {
  runSeeds();
}

export { runSeeds };

