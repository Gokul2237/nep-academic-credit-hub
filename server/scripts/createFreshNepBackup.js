/**
 * Fresh Timestamped Backup for NEP Academic Credit Hub
 *
 * Guarantees:
 * - Read-only operation against local MongoDB (zero writes, zero deletes).
 * - Connects strictly to `mongodb://127.0.0.1:27017/nep_academic_hub`.
 * - Validates database name is exactly `nep_academic_hub` before reading.
 * - Never accesses FocusMate or any other database.
 * - Verifies that each written backup file can be read and parsed.
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const SOURCE_URI = 'mongodb://127.0.0.1:27017/nep_academic_hub';

async function runBackup() {
  console.log('===============================================================');
  console.log('🛡️  Creating Fresh Timestamped Backup of nep_academic_hub');
  console.log('===============================================================\n');

  console.log(`🔌 Connecting to source URI: ${SOURCE_URI}`);
  const conn = await mongoose.createConnection(SOURCE_URI, {
    serverSelectionTimeoutMS: 5000,
  }).asPromise();

  // Strict verification of database name
  if (conn.name !== 'nep_academic_hub') {
    throw new Error(`CRITICAL ABORT: Connected to database '${conn.name}', expected 'nep_academic_hub'. Aborting immediately.`);
  }

  console.log(`✅ Verified Source Database: ${conn.host}/${conn.name}`);

  const backupRoot = path.join(__dirname, '..', '..', 'backups');
  if (!fs.existsSync(backupRoot)) {
    fs.mkdirSync(backupRoot, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(backupRoot, `nep_backup_${timestamp}`);
  fs.mkdirSync(backupDir, { recursive: true });

  const collections = await conn.db.listCollections().toArray();
  const collectionNames = collections
    .map(c => c.name)
    .filter(name => !name.startsWith('system.'));

  console.log(`\nFound ${collectionNames.length} collection(s) in nep_academic_hub:`);
  console.log(collectionNames.join(', '));
  console.log('\n--- Exporting Collections (Read-Only) ---');

  const manifest = {
    createdAt: new Date().toISOString(),
    sourceURI: SOURCE_URI,
    database: conn.name,
    collections: {},
    totalDocuments: 0,
    verified: false,
  };

  let totalDocs = 0;

  for (const colName of collectionNames) {
    const col = conn.db.collection(colName);
    const docs = await col.find({}).toArray();
    const filePath = path.join(backupDir, `${colName}.json`);

    fs.writeFileSync(filePath, JSON.stringify(docs, null, 2), 'utf8');
    const sizeBytes = fs.statSync(filePath).size;

    // Immediate read-back verification
    const readBack = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (!Array.isArray(readBack) || readBack.length !== docs.length) {
      throw new Error(`Verification failed for backup file: ${filePath}`);
    }

    manifest.collections[colName] = {
      count: docs.length,
      file: `${colName}.json`,
      sizeBytes,
      readVerified: true,
    };

    totalDocs += docs.length;
    console.log(`✓ Backed up [${colName}]: ${docs.length} document(s) (${sizeBytes} bytes) - Verified`);
  }

  manifest.totalDocuments = totalDocs;
  manifest.verified = true;

  const manifestPath = path.join(backupDir, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');

  console.log('\n===============================================================');
  console.log('✅ FRESH BACKUP COMPLETED & READ-VERIFIED');
  console.log('===============================================================');
  console.log(`📁 Location: ${backupDir}`);
  console.log(`📊 Total Documents Backed Up: ${totalDocs}`);
  console.log(`📜 Manifest: ${manifestPath}\n`);

  await conn.close();
  return { backupDir, manifest };
}

if (require.main === module) {
  runBackup().catch(err => {
    console.error('❌ Backup Error:', err.message);
    process.exit(1);
  });
}

module.exports = { runBackup };
