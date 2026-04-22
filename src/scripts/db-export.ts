import { loadEnvFiles } from '../config/env.config';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

loadEnvFiles();

async function exportDatabase() {
  const environment = process.env.ENVIRONMENT || process.env.NODE_ENV || 'local';
  const backupDir = path.resolve(process.cwd(), 'backups');

  const host = process.env.DATABASE_HOST || 'localhost';
  const port = process.env.DATABASE_PORT || '5432';
  const user = process.env.DATABASE_USER || 'postgres';
  const password = process.env.DATABASE_PASSWORD || 'postgres';
  const database = process.env.DATABASE_NAME || 'scrum_store';

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `${environment}_${database}_${timestamp}.sql`;
  const filepath = path.join(backupDir, filename);

  console.log('📦 Exporting database...');
  console.log(`   Environment: ${environment}`);
  console.log(`   Host: ${host}`);
  console.log(`   Database: ${database}`);
  console.log(`   Output: ${filepath}`);
  console.log('');

  try {
    const pgDumpCmd = `PGPASSWORD='${password}' pg_dump -h ${host} -p ${port} -U ${user} -d ${database} --no-owner --no-acl -F p`;
    
    execSync(`${pgDumpCmd} > "${filepath}"`, {
      stdio: 'inherit',
      shell: '/bin/bash',
    });

    execSync(`gzip "${filepath}"`, { stdio: 'inherit' });

    const gzFilepath = `${filepath}.gz`;
    const stats = fs.statSync(gzFilepath);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);

    console.log('');
    console.log('✅ Export completed successfully!');
    console.log(`   File: ${gzFilepath}`);
    console.log(`   Size: ${sizeMB} MB`);
  } catch (error) {
    console.error('❌ Export failed:', error);
    process.exit(1);
  }
}

exportDatabase();
