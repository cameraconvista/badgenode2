#!/usr/bin/env node

import { createWriteStream, promises as fs, existsSync } from 'fs';
import { createGzip } from 'zlib';
import { pipeline } from 'stream/promises';
import { spawn } from 'child_process';
import path from 'path';

const BACKUP_DIR = 'BACKUP_AUTOMATICO';
const MAX_BACKUPS = 3;
const EXCLUDE_PATTERNS = [
  'node_modules/',
  'dist/',
  'build/',
  '.git/',
  'backups/',
  'BACKUP_AUTOMATICO/',
  'archivio_deprecati/',
  '.backups/',
  'coverage/',
  '.cache/',
  '.vite/',
  '*.log',
  '*.tmp',
  '.DS_Store',
  'Thumbs.db'
];

function getTimestamp() {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${day}_${month}_${year}_${hours}_${minutes}`;
}

async function createTarExcludeArgs() {
  const excludeArgs = [];
  for (const pattern of EXCLUDE_PATTERNS) {
    excludeArgs.push('--exclude', pattern);
  }
  return excludeArgs;
}

async function createBackup() {
  try {
    // Ensure backup directory exists
    if (!existsSync(BACKUP_DIR)) {
      await fs.mkdir(BACKUP_DIR, { recursive: true });
    }

    const timestamp = getTimestamp();
    const backupName = `backup_${timestamp}.tgz`;
    const backupPath = path.join(BACKUP_DIR, backupName);

    console.log(`Creating backup: ${backupName}`);

    // Create tar command with exclusions
    const excludeArgs = await createTarExcludeArgs();
    const tarArgs = [
      '-czf',
      backupPath,
      ...excludeArgs,
      '.'
    ];

    // Execute tar command
    const tarProcess = spawn('tar', tarArgs, {
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let stderr = '';
    tarProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    const exitCode = await new Promise((resolve) => {
      tarProcess.on('close', resolve);
    });

    if (exitCode !== 0) {
      throw new Error(`tar failed with code ${exitCode}: ${stderr}`);
    }

    console.log(`✅ Backup created: ${backupPath}`);
    return backupPath;

  } catch (error) {
    console.error(`❌ Backup failed: ${error.message}`);
    process.exit(1);
  }
}

async function rotateBackups() {
  try {
    const files = await fs.readdir(BACKUP_DIR);
    const backupFiles = files
      .filter(file => (file.startsWith('backup-') || file.startsWith('backup_')) && file.endsWith('.tgz'))
      .map(file => ({
        name: file,
        path: path.join(BACKUP_DIR, file),
        stat: null
      }));

    // Get file stats for sorting by creation time
    for (const backup of backupFiles) {
      backup.stat = await fs.stat(backup.path);
    }

    // Sort by creation time (newest first)
    backupFiles.sort((a, b) => b.stat.birthtime - a.stat.birthtime);

    // Remove excess backups
    if (backupFiles.length > MAX_BACKUPS) {
      const toDelete = backupFiles.slice(MAX_BACKUPS);
      console.log(`🗑️  Rotating backups: keeping ${MAX_BACKUPS} most recent`);
      
      for (const backup of toDelete) {
        await fs.unlink(backup.path);
        console.log(`   Deleted: ${backup.name}`);
      }
    }

    const remaining = backupFiles.slice(0, MAX_BACKUPS);
    console.log(`📦 Active backups: ${remaining.length}/${MAX_BACKUPS}`);
    remaining.forEach((backup, i) => {
      console.log(`   ${i + 1}. ${backup.name}`);
    });

  } catch (error) {
    console.error(`❌ Rotation failed: ${error.message}`);
    process.exit(1);
  }
}

async function main() {
  console.log('🔄 Starting backup process...');
  
  await createBackup();
  await rotateBackups();
  
  console.log('✅ Backup process completed');
  process.exit(0);
}

main().catch((error) => {
  console.error(`❌ Backup process failed: ${error.message}`);
  process.exit(1);
});
