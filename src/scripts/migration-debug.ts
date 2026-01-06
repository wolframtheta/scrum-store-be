import { AppDataSource } from '../data-source';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Script de debug per diagnosticar problemes amb migracions.
 */
async function debugMigrations() {
  try {
    console.log('🔌 Connectant a la base de dades...');
    await AppDataSource.initialize();
    console.log('✅ Connectat correctament\n');

    const queryRunner = AppDataSource.createQueryRunner();

    // 1. Verificar taula migrations
    console.log('1️⃣ Verificant taula migrations...');
    const tableExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'migrations'
      );
    `);
    console.log(`   Taula migrations existeix: ${tableExists[0]?.exists}\n`);

    if (tableExists[0]?.exists) {
      const executedMigrations = await queryRunner.query(`
        SELECT id, timestamp, name 
        FROM migrations 
        ORDER BY timestamp;
      `);
      console.log(`   Migracions a la DB: ${executedMigrations.length}`);
      executedMigrations.forEach((m: { id: number; timestamp: number; name: string }) => {
        console.log(`     - ${m.timestamp} | ${m.name}`);
      });
      console.log('');
    }

    // 2. Llegir migracions del directori
    console.log('2️⃣ Llegint migracions del directori...');
    const migrationsDir = path.join(__dirname, '../../migrations');
    console.log(`   Directori: ${migrationsDir}`);
    
    if (!fs.existsSync(migrationsDir)) {
      console.log('   ❌ El directori migrations no existeix!\n');
      await queryRunner.release();
      await AppDataSource.destroy();
      return;
    }

    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.ts') && !file.endsWith('.d.ts'));
    
    console.log(`   Fitxers trobats: ${migrationFiles.length}`);
    migrationFiles.forEach(file => {
      console.log(`     - ${file}`);
    });
    console.log('');

    // 3. Verificar configuració de TypeORM
    console.log('3️⃣ Verificant configuració de TypeORM...');
    const migrationsPath = path.join(__dirname, '../../migrations', '*.{.ts,.js}');
    console.log(`   Ruta configurada: ${migrationsPath}`);
    console.log(`   Ruta absoluta: ${path.resolve(__dirname, '../../migrations')}`);
    console.log('');

    // 4. Intentar carregar les migracions
    console.log('4️⃣ Intentant carregar migracions amb TypeORM...');
    try {
      const hasMigrations = await AppDataSource.showMigrations();
      console.log(`   TypeORM detecta migracions pendents: ${hasMigrations}`);
      
      if (hasMigrations) {
        // Obtenir les migracions pendents manualment
        const pendingMigrations = await AppDataSource.migrations.filter(async (migration) => {
          const executed = await queryRunner.query(`
            SELECT COUNT(*) as count 
            FROM migrations 
            WHERE name = $1
          `, [migration.name]);
          return executed[0].count === '0';
        });
        
        console.log(`   Migracions pendents detectades: ${pendingMigrations.length}`);
        for (const migration of AppDataSource.migrations) {
          const executed = await queryRunner.query(`
            SELECT COUNT(*) as count 
            FROM migrations 
            WHERE name = $1
          `, [migration.name]);
          
          if (executed[0].count === '0') {
            console.log(`     - ${migration.name} (pendent)`);
          }
        }
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error}`);
    }
    console.log('');

    // 5. Verificar format del nom de la migració
    console.log('5️⃣ Verificant format de les migracions...');
    migrationFiles.forEach(file => {
      const match = file.match(/^(\d+)-(.+)\.ts$/);
      if (match) {
        const timestamp = parseInt(match[1], 10);
        const name = match[2];
        console.log(`   ✅ ${file}`);
        console.log(`      Timestamp: ${timestamp}`);
        console.log(`      Nom: ${name}`);
        
        // Llegir el fitxer i verificar el nom de la classe
        const filePath = path.join(migrationsDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const classNameMatch = content.match(/export class (\w+)/);
        if (classNameMatch) {
          const className = classNameMatch[1];
          console.log(`      Classe: ${className}`);
          
          // Verificar si el nom coincideix
          const expectedName = name.replace(/-/g, '');
          if (className !== expectedName && className !== `InitialSchema${timestamp}`) {
            console.log(`      ⚠️  El nom de la classe no coincideix amb el format esperat`);
          }
        }
      } else {
        console.log(`   ❌ Format incorrecte: ${file}`);
      }
    });

    await queryRunner.release();
    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

debugMigrations();

