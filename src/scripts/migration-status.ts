import { AppDataSource } from '../data-source';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Script per mostrar una taula amb l'estat de totes les migracions.
 * Mostra quines migracions estan aplicades i quines estan pendents.
 */
async function showMigrationStatus() {
  try {
    console.log('🔌 Connectant a la base de dades...');
    await AppDataSource.initialize();
    console.log('✅ Connectat correctament\n');

    const queryRunner = AppDataSource.createQueryRunner();

    // Crear taula migrations si no existeix
    try {
      const tableExists = await queryRunner.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'migrations'
        );
      `);

      if (!tableExists[0]?.exists) {
        console.log('📋 Creant taula migrations...');
        await queryRunner.query(`
          CREATE TABLE IF NOT EXISTS migrations (
            id SERIAL PRIMARY KEY,
            timestamp BIGINT NOT NULL,
            name VARCHAR NOT NULL
          );
        `);
        console.log('✅ Taula migrations creada\n');
      }
    } catch (error) {
      console.warn('⚠️  Error creant/verificant taula migrations:', error);
    }

    // Obtenir migracions executades de la DB
    let executedMigrations: Array<{ id: number; timestamp: number; name: string }> = [];
    
    try {
      executedMigrations = await queryRunner.query(`
        SELECT id, timestamp, name 
        FROM migrations 
        ORDER BY timestamp;
      `);
    } catch (error) {
      console.warn('⚠️  Error llegint migracions de la DB:', error);
    }

    // Llegir migracions del directori
    const migrationsDir = path.join(__dirname, '../../migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.ts') && !file.endsWith('.d.ts'))
      .map(file => {
        const match = file.match(/^(\d+)-(.+)\.ts$/);
        if (match) {
          return {
            timestamp: Number(match[1]), // Usar Number para asegurar tipo numérico
            name: match[2],
            filename: file,
          };
        }
        return null;
      })
      .filter((m): m is { timestamp: number; name: string; filename: string } => m !== null)
      .sort((a, b) => a.timestamp - b.timestamp);

    if (migrationFiles.length === 0) {
      console.log('📋 No hi ha migracions al directori migrations/\n');
      await queryRunner.release();
      await AppDataSource.destroy();
      return;
    }

    // Crear mapa de migracions executades per timestamp (més fiable que per nom)
    const executedMap = new Map<number, { id: number; name: string }>();
    executedMigrations.forEach((migration) => {
      // Asegurar que timestamp sea número
      const ts = typeof migration.timestamp === 'string' 
        ? Number(migration.timestamp) 
        : migration.timestamp;
      executedMap.set(ts, {
        id: migration.id,
        name: migration.name,
      });
    });

    // Mostrar taula
    console.log('📊 ESTAT DE LES MIGRACIONS\n');
    console.log('═'.repeat(100));
    console.log(
      '│ ' +
      'TIMESTAMP'.padEnd(15) +
      '│ ' +
      'NOM'.padEnd(50) +
      '│ ' +
      'ESTAT'.padEnd(12) +
      '│'
    );
    console.log('═'.repeat(100));

    let appliedCount = 0;
    let pendingCount = 0;

    migrationFiles.forEach((migration) => {
      const isExecuted = executedMap.has(migration.timestamp);
      const status = isExecuted ? '✅ APLICADA' : '⏳ PENDENT';
      const timestamp = migration.timestamp.toString();

      // Truncar nom si és massa llarg
      const name = migration.name.length > 48 
        ? migration.name.substring(0, 45) + '...' 
        : migration.name;

      console.log(
        '│ ' +
        timestamp.padEnd(15) +
        '│ ' +
        name.padEnd(50) +
        '│ ' +
        status.padEnd(12) +
        '│'
      );

      if (isExecuted) {
        appliedCount++;
      } else {
        pendingCount++;
      }
    });

    console.log('═'.repeat(100));
    console.log(`\n📈 Resum:`);
    console.log(`   ✅ Aplicades: ${appliedCount}`);
    console.log(`   ⏳ Pendents: ${pendingCount}`);
    console.log(`   📦 Total: ${migrationFiles.length}\n`);

    if (pendingCount > 0) {
      console.log('💡 Per aplicar les migracions pendents, executa:');
      console.log('   npm run migration:run\n');
    }

    await queryRunner.release();
    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Error mostrant estat de migracions:', error);
    process.exit(1);
  }
}

showMigrationStatus();

