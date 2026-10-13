const fs = require('fs');
const path = require('path');
const mongoose = require('../server/node_modules/mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/nep_academic_hub';
const BACKUP_DIR = path.join(__dirname, 'pre_cleanup_20261013_184500');

async function restoreCollection(collectionName) {
  const filePath = path.join(BACKUP_DIR, `${collectionName}.json`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Backup file not found: ${filePath}`);
  }

  const raw = fs.readFileSync(filePath, 'utf-8');
  const docs = JSON.parse(raw);
  if (docs.length === 0) {
    console.log(`No documents to restore for ${collectionName}`);
    return;
  }

  // Convert $oid / string _id to ObjectId if necessary
  const formattedDocs = docs.map(doc => {
    if (doc._id && typeof doc._id === 'string' && mongoose.Types.ObjectId.isValid(doc._id)) {
      doc._id = new mongoose.Types.ObjectId(doc._id);
    }
    // Convert foreign key fields if string
    ['studentId', 'institutionId', 'courseId', 'academicCreditId', 'sourceInstitutionId', 'destinationInstitutionId', 'reviewedBy', 'verifiedBy', 'transferRequestId', 'transferredTo'].forEach(field => {
      if (doc[field] && typeof doc[field] === 'string' && mongoose.Types.ObjectId.isValid(doc[field])) {
        doc[field] = new mongoose.Types.ObjectId(doc[field]);
      }
    });
    if (Array.isArray(doc.creditIds)) {
      doc.creditIds = doc.creditIds.map(cid => typeof cid === 'string' && mongoose.Types.ObjectId.isValid(cid) ? new mongoose.Types.ObjectId(cid) : cid);
    }
    return doc;
  });

  const db = mongoose.connection.db;
  await db.collection(collectionName).deleteMany({});
  const result = await db.collection(collectionName).insertMany(formattedDocs);
  console.log(`✓ Restored ${collectionName}: ${result.insertedCount} documents`);
}

async function restoreAll() {
  console.log('Connecting to:', MONGO_URI);
  await mongoose.connect(MONGO_URI);

  const collections = ['transferrequests', 'academiccredits', 'certificates', 'transcripts'];
  for (const col of collections) {
    await restoreCollection(col);
  }

  await mongoose.disconnect();
  console.log('Restoration complete.');
}

if (require.main === module) {
  restoreAll().catch(err => {
    console.error('Restore error:', err);
    process.exit(1);
  });
}

module.exports = { restoreCollection, restoreAll };
