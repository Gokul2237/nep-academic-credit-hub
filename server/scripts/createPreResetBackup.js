const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

async function createBackup() {
  const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/nep_academic_hub';
  console.log(`Connecting to: ${mongoURI}`);
  await mongoose.connect(mongoURI);
  const db = mongoose.connection.db;

  const backupDir = path.join(__dirname, '..', '..', 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFolder = path.join(backupDir, `backup_clean_reset_${timestamp}`);
  fs.mkdirSync(backupFolder, { recursive: true });

  const collectionsToBackup = [
    'academiccredits',
    'semesterresults',
    'resultimportbatches',
    'transferrequests',
    'certificates',
    'auditlogs',
    'apilogs',
    'apikeys',
    'courses',
    'users',
    'institutions',
    'creditpolicies'
  ];

  const manifest = {
    createdAt: new Date().toISOString(),
    mongoURI,
    database: 'nep_academic_hub',
    collections: {}
  };

  for (const colName of collectionsToBackup) {
    const docs = await db.collection(colName).find({}).toArray();
    const filePath = path.join(backupFolder, `${colName}.json`);
    fs.writeFileSync(filePath, JSON.stringify(docs, null, 2), 'utf8');
    manifest.collections[colName] = {
      count: docs.length,
      file: `${colName}.json`,
      sizeBytes: fs.statSync(filePath).size
    };
    console.log(`✓ Backed up ${colName}: ${docs.length} documents (${manifest.collections[colName].sizeBytes} bytes)`);
  }

  const manifestPath = path.join(backupFolder, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');

  console.log(`\n✅ Full database backup created successfully in: ${backupFolder}`);
  await mongoose.disconnect();
}

createBackup().catch(err => {
  console.error('Backup error:', err);
  process.exit(1);
});
