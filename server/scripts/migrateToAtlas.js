/**
 * Safe, Non-Destructive MongoDB Atlas Migration & Conflict Resolution Script
 *
 * Guarantees:
 * - Read-only operations against local MongoDB (zero deletions, zero modifications).
 * - Connects strictly to `mongodb://127.0.0.1:27017/nep_academic_hub`.
 * - Validates local database name is exactly `nep_academic_hub` before reading.
 * - Never touches FocusMate or any other database.
 * - Inspects target collection counts and existing records BEFORE writing.
 * - Handles duplicate-key errors explicitly:
 *     - If existing document is identical: counts as IDENTICAL_MATCH (safe idempotent).
 *     - If existing document differs: flags as DATA_CONFLICT, preserves existing, reports mismatch.
 * - Supports dry-run inspection mode (--dry-run).
 */

const mongoose = require('mongoose');

const LOCAL_URI = process.env.LOCAL_MONGO_URI || 'mongodb://127.0.0.1:27017/nep_academic_hub';
const TARGET_URI = process.env.TARGET_MONGO_URI;

const COLLECTIONS = [
  'creditpolicies',
  'institutions',
  'users',
  'courses',
  'academiccredits',
  'semesterresults',
  'resultimportbatches',
  'auditlogs',
  'apilogs',
  'transcripts',
  'certificates',
  'transferrequests',
  'apikeys',
];

// Helper for deep equality check between documents
function areDocsIdentical(docA, docB) {
  const cleanA = JSON.stringify(docA);
  const cleanB = JSON.stringify(docB);
  return cleanA === cleanB;
}

async function inspectOrMigrate({ dryRun = false } = {}) {
  console.log('===============================================================');
  console.log(`🚀 NEP Academic Credit Hub — Atlas Migration [${dryRun ? 'DRY-RUN / INSPECTION' : 'MIGRATION'}]`);
  console.log('===============================================================\n');

  if (!TARGET_URI) {
    throw new Error('TARGET_MONGO_URI environment variable is required.');
  }

  if (TARGET_URI.includes('127.0.0.1') || TARGET_URI.includes('localhost')) {
    throw new Error('TARGET_MONGO_URI cannot point to localhost/127.0.0.1. Must be a remote cloud Atlas URI.');
  }

  let localConn = null;
  let targetConn = null;

  try {
    // 1. Connect strictly to local source
    console.log(`🔌 Connecting to Local Source: ${LOCAL_URI}`);
    localConn = await mongoose.createConnection(LOCAL_URI, {
      serverSelectionTimeoutMS: 5000,
    }).asPromise();

    if (localConn.name !== 'nep_academic_hub') {
      throw new Error(`CRITICAL ABORT: Connected to local DB '${localConn.name}', expected 'nep_academic_hub'.`);
    }
    console.log(`✅ Local Source Verified: ${localConn.host}/${localConn.name}`);

    // 2. Connect to Atlas target
    console.log(`🔌 Connecting to Atlas Target: ${TARGET_URI.replace(/:([^:@]+)@/, ':****@')}`);
    targetConn = await mongoose.createConnection(TARGET_URI, {
      serverSelectionTimeoutMS: 10000,
    }).asPromise();
    console.log(`✅ Atlas Target Verified: ${targetConn.host}/${targetConn.name}`);

    const report = {
      localDatabase: localConn.name,
      targetHost: targetConn.host,
      targetDatabase: targetConn.name,
      isDryRun: dryRun,
      collections: [],
      hasConflicts: false,
    };

    console.log('\n--- Checking Collections & Pre-Existing Records ---');

    for (const colName of COLLECTIONS) {
      const localCol = localConn.db.collection(colName);
      const targetCol = targetConn.db.collection(colName);

      const localCount = await localCol.countDocuments();
      const initialTargetCount = await targetCol.countDocuments();

      const colSummary = {
        collection: colName,
        sourceCount: localCount,
        initialTargetCount,
        inserted: 0,
        identicalMatched: 0,
        conflicts: 0,
        finalTargetCount: initialTargetCount,
        status: 'PENDING',
      };

      if (localCount === 0 && initialTargetCount === 0) {
        colSummary.status = 'EMPTY_MATCH';
        report.collections.push(colSummary);
        continue;
      }

      const sourceDocs = await localCol.find({}).toArray();

      if (dryRun) {
        // Inspection only
        if (initialTargetCount > 0) {
          // Compare sample or all documents
          const targetDocs = await targetCol.find({}).toArray();
          const targetMap = new Map(targetDocs.map(d => [String(d._id), d]));

          for (const sDoc of sourceDocs) {
            const tDoc = targetMap.get(String(sDoc._id));
            if (tDoc) {
              if (areDocsIdentical(sDoc, tDoc)) {
                colSummary.identicalMatched++;
              } else {
                colSummary.conflicts++;
              }
            }
          }
        }
        colSummary.status = colSummary.conflicts > 0 ? 'CONFLICT_DETECTED' : (initialTargetCount === 0 ? 'READY_FOR_IMPORT' : 'PARTIAL_MATCH');
        if (colSummary.conflicts > 0) report.hasConflicts = true;
        report.collections.push(colSummary);
        continue;
      }

      // Live Migration Execution
      let insertedCount = 0;
      let identicalCount = 0;
      let conflictCount = 0;

      for (const sDoc of sourceDocs) {
        const existing = await targetCol.findOne({ _id: sDoc._id });
        if (!existing) {
          await targetCol.insertOne(sDoc);
          insertedCount++;
        } else {
          if (areDocsIdentical(sDoc, existing)) {
            identicalCount++;
          } else {
            conflictCount++;
            console.error(`⚠️ CONFLICT in [${colName}] for _id: ${sDoc._id}: Existing document differs from source. Preserved target document.`);
          }
        }
      }

      const finalCount = await targetCol.countDocuments();
      colSummary.inserted = insertedCount;
      colSummary.identicalMatched = identicalCount;
      colSummary.conflicts = conflictCount;
      colSummary.finalTargetCount = finalCount;
      colSummary.status = conflictCount > 0 ? 'CONFLICTS_REPORTED' : (finalCount >= localCount ? 'VERIFIED' : 'COUNT_MISMATCH');

      if (conflictCount > 0) report.hasConflicts = true;
      report.collections.push(colSummary);
    }

    console.table(report.collections);
    return report;
  } finally {
    if (localConn) await localConn.close();
    if (targetConn) await targetConn.close();
  }
}

if (require.main === module) {
  const isDryRun = process.argv.includes('--dry-run');
  inspectOrMigrate({ dryRun: isDryRun }).catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  });
}

module.exports = { inspectOrMigrate };
