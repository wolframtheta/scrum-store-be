import { loadEnvFiles } from '../config/env.config';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

loadEnvFiles();

async function askConfirmation(question: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes');
    });
  });
}

function listBackups(backupDir: string): void {
  console.log('📂 Available backups:\n');

  if (!fs.existsSync(backupDir)) {
    console.log('   No backups directory found.');
    return;
  }

  const files = fs.readdirSync(backupDir)
    .filter((f) => f.endsWith('.sql') || f.endsWith('.sql.gz'))
    .sort()
    .reverse();

  if (files.length === 0) {
    console.log('   No backups found.');
    return;
  }

  files.forEach((file) => {
    const stats = fs.statSync(path.join(backupDir, file));
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
    const date = stats.mtime.toISOString().slice(0, 19).replace('T', ' ');
    console.log(`   ${file} (${sizeMB} MB, ${date})`);
  });
}

async function importDatabase() {
  const environment = process.env.ENVIRONMENT || process.env.NODE_ENV || 'local';
  const backupDir = path.resolve(process.cwd(), 'backups');

  const host = process.env.DATABASE_HOST || 'localhost';
  const port = process.env.DATABASE_PORT || '5432';
  const user = process.env.DATABASE_USER || 'postgres';
  const password = process.env.DATABASE_PASSWORD || 'postgres';
  const database = process.env.DATABASE_NAME || 'scrum_store';

  const backupFile = process.argv[2];

  if (!backupFile) {
    listBackups(backupDir);
    console.log('\nUsage: npm run db:import:<env> <backup_file>');
    console.log('Example: npm run db:import:pre backups/pre_postgres_2026-04-21T12-00-00.sql.gz');
    process.exit(0);
  }

  let filepath = backupFile;
  if (!fs.existsSync(filepath)) {
    filepath = path.join(backupDir, backupFile);
    if (!fs.existsSync(filepath)) {
      console.error(`❌ Backup file not found: ${backupFile}`);
      process.exit(1);
    }
  }

  console.log('⚠️  WARNING: This will import data into the database!');
  console.log(`   Environment: ${environment}`);
  console.log(`   Host: ${host}`);
  console.log(`   Database: ${database}`);
  console.log(`   Backup: ${filepath}`);
  console.log('');

  const confirmed = await askConfirmation('Are you sure you want to continue? (yes/no): ');

  if (!confirmed) {
    console.log('❌ Import cancelled.');
    process.exit(0);
  }

  console.log('\n📥 Importing database...');

  try {
    let importCmd: string;

    if (filepath.endsWith('.gz')) {
      importCmd = `gunzip -c "${filepath}" | PGPASSWORD='${password}' psql -h ${host} -p ${port} -U ${user} -d ${database} --quiet`;
    } else {
      importCmd = `PGPASSWORD='${password}' psql -h ${host} -p ${port} -U ${user} -d ${database} --quiet < "${filepath}"`;
    }

    execSync(importCmd, {
      stdio: 'inherit',
      shell: '/bin/bash',
    });

    console.log('\n✅ Import completed successfully!');
  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  }
}

importDatabase();
