const mongoose = require('mongoose');

async function checkRelations() {
  await mongoose.connect('mongodb://127.0.0.1:27017/nep_academic_hub');
  const db = mongoose.connection.db;

  const targetIds = [
    new mongoose.Types.ObjectId('6ad4ecd8375fd4a0095a3edb'), // Aarav 9828
    new mongoose.Types.ObjectId('6ad4ecd8375fd4a0095a3edf'), // Bhavya 9828
    new mongoose.Types.ObjectId('6ad4ecd9375fd4a0095a3ee3'), // Chetan 9828
    new mongoose.Types.ObjectId('6ad4ecd7375fd4a0095a3ed7'), // Dean Inst A 9828
    new mongoose.Types.ObjectId('6ad4ed1c6acab901276dc0b8')  // Dean Inst A 8206
  ];

  console.log('--- CHECKING ACADEMIC CREDITS ---');
  const credits = await db.collection('academiccredits').find({ studentId: { $in: targetIds } }).toArray();
  console.log(`Credits for 9828 students: ${credits.length}`);

  console.log('--- CHECKING SEMESTER RESULTS ---');
  const results = await db.collection('semesterresults').find({ studentId: { $in: targetIds } }).toArray();
  console.log(`Semester results for 9828 students: ${results.length}`);

  console.log('--- CHECKING IMPORT BATCHES ---');
  const batches = await db.collection('resultimportbatches').find({ createdBy: { $in: targetIds } }).toArray();
  console.log(`Batches for 9828 dean: ${batches.length}`);

  // Also check if Aarav Sharma ABC-P3-6513 is part of anything
  const p3Aarav = new mongoose.Types.ObjectId('6ad4ed626acab901276dc123');
  const p3Credits = await db.collection('academiccredits').find({ studentId: p3Aarav }).toArray();
  console.log(`Credits for Aarav Sharma (P3-6513): ${p3Credits.length}`);

  await mongoose.disconnect();
}

checkRelations().catch(console.error);
