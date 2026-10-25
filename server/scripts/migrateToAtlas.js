/**
 * Safe, Non-Destructive MongoDB Atlas Migration Script
 *
 * Copies all collections from local `nep_academic_hub` to target MongoDB Atlas.
 *
 * Guarantees:
 * - Read-only operations against local MongoDB (zero deletions, zero modifications).
 * - Only accesses database `nep_academic_hub` (never touches FocusMate or other databases).
 * - Verifies collection counts before and after migration.
 *
 * Usage:
 *   $env:TARGET_MONGO_URI="mongodb+srv://<user>:<password>@<cluster>.mongodb.net/nep_academic_hub?retryWrites=true&w=majority"
 *   node server/scripts/migrateToAtlas.js
 */

const mongoose = require('mongoose');

const LOCAL_URI = process.env.LOCAL_MONGO_URI || 'mongodb://127.0.0.1:27017/nep_academic_hub';
const TARGET_URI = process.env.TARGET_MONGO_URI;

const COLLECTIONS = [
  'institutions',
  'users',
  'courses',
  'creditpolicies',
  'academiccredits',
  'semesterresults',
  'resultimportbatches',
  'transferrequests',
  'certificates',
  'transcripts',
  'apikeys',
  'apilogs',
  'auditlogs',
];

async function migrate() {
  console.log('===============================================================');
  console.log('🚀 NEP Academic Credit Hub — Safe Database Migration to Atlas');
  console.log('===============================================================\n');

  if (!TARGET_URI) {
    console.error('❌ ERROR: TARGET_MONGO_URI environment variable is required.');
    console.error('Please set TARGET_MONGO_URI to your MongoDB Atlas connection string:');
    console.error('  $env:TARGET_MONGO_URI="mongodb+srv://<user>:<password>@<cluster>.mongodb.net/nep_academic_hub?retryWrites=true&w=majority"');
    process.exit(1);
  }

  if (TARGET_URI.includes('127.0.0.1') || TARGET_URI.includes('localhost')) {
    console.error('❌ ERROR: TARGET_MONGO_URI cannot point to localhost/127.0.0.1.');
    console.error('It must be your remote cloud MongoDB Atlas connection string.');
    process.exit(1);
  }

  let localConn = null;
  let targetConn = null;

  try {
    // 1. Connect to Local MongoDB
    console.log(`🔌 Connecting to Local MongoDB: ${LOCAL_URI}`);
    localConn = await mongoose.createConnection(LOCAL_URI, {
      serverSelectionTimeoutMS: 5000,
    }).asPromise();
    console.log(`✅ Local MongoDB Connected: ${localConn.host}/${localConn.name}`);

    if (localConn.name !== 'nep_academic_hub') {
      throw new Error(`Safety guard triggered: Local database name is '${localConn.name}', expected 'nep_academic_hub'. Aborting.`);
    }

    // 2. Connect to Target Atlas MongoDB
    console.log(`🔌 Connecting to MongoDB Atlas Target...`);
    targetConn = await mongoose.createConnection(TARGET_URI, {
      serverSelectionTimeoutMS: 10000,
    }).asPromise();
    console.log(`✅ MongoDB Atlas Connected: ${targetConn.host}/${targetConn.name}`);

    console.log('\n---------------------------------------------------------------');
    console.log('📦 Starting Collection Copy & Verification');
    console.log('---------------------------------------------------------------\n');

    const summary = [];

    for (const colName of COLLECTIONS) {
      const localCol = localConn.db.collection(colName);
      const targetCol = targetConn.db.collection(colName);

      // Read-only count on local
      const localCount = await localCol.countDocuments();

      if (localCount === 0) {
        console.log(`ℹ️  [${colName}]: 0 local documents. Skipping.`);
        summary.push({ collection: colName, local: 0, target: 0, status: 'EMPTY' });
        continue;
      }

      console.log(`📥 [${colName}]: Reading ${localCount} documents from local...`);
      const docs = await localCol.find({}).toArray();

      // Check target count
      const existingTargetCount = await targetCol.countDocuments();
      if (existingTargetCount > 0) {
        console.warn(`⚠️  [${colName}]: Target Atlas collection already contains ${existingTargetCount} documents.`);
      }

      // Safe batch insert with ordered: false to preserve unique indexes
      let insertedCount = 0;
      if (docs.length > 0) {
        try {
          const insertResult = await targetCol.insertMany(docs, { ordered: false });
          insertedCount = insertResult.insertedCount;
        } catch (insertErr) {
          if (insertErr.code === 11000) {
            // Duplicate key error - some documents already exist
            insertedCount = insertErr.result?.nInserted || existingTargetCount;
            console.log(`ℹ️  [${colName}]: Some documents already exist in target. Current count preserved.`);
          } else {
            throw insertErr;
          }
        }
      }

      // Verify count in Atlas
      const targetCount = await targetCol.countDocuments();
      const match = targetCount >= localCount;
      console.log(`✅ [${colName}]: Local Count = ${localCount} | Atlas Count = ${targetCount} [${match ? 'VERIFIED' : 'MISMATCH'}]`);

      summary.push({
        collection: colName,
        local: localCount,
        target: targetCount,
        status: match ? 'VERIFIED' : 'MISMATCH',
      });
    }

    console.log('\n===============================================================');
    console.log('📊 MIGRATION SUMMARY & VERIFICATION MATRIX');
    console.log('===============================================================');
    console.table(summary);

    const allVerified = summary.every((s) => s.local === 0 || s.status === 'VERIFIED');
    if (allVerified) {
      console.log('\n🎉 ALL COLLECTIONS SUCCESSFULLY MIGRATED AND VERIFIED ON ATLAS!');
      console.log('You may now safely configure MONGO_URI in your Render Web Service.');
    } else {
      console.warn('\n⚠️ Some collections had count discrepancies. Please check the table above.');
    }

  } catch (err) {
    console.error('\n❌ Migration failed:', err.message);
  } finally {
    if (localConn) await localConn.close();
    if (targetConn) await targetConn.close();
    console.log('\n🔒 Connections closed. Local database remains unmodified.');
  }
}

if (require.main === module) {
  migrate();
}

module.exports = { migrate };
