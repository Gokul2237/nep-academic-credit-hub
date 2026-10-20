const mongoose = require('mongoose');

async function checkAllReferences() {
  await mongoose.connect('mongodb://127.0.0.1:27017/nep_academic_hub');
  const db = mongoose.connection.db;

  const targetIds = [
    new mongoose.Types.ObjectId('6ad4ecd8375fd4a0095a3edb'), // Aarav 9828
    new mongoose.Types.ObjectId('6ad4ecd8375fd4a0095a3edf'), // Bhavya 9828
    new mongoose.Types.ObjectId('6ad4ecd9375fd4a0095a3ee3'), // Chetan 9828
    new mongoose.Types.ObjectId('6ad4ecd7375fd4a0095a3ed7'), // Dean 9828
    new mongoose.Types.ObjectId('6ad4ed1c6acab901276dc0b8')  // Dean 8206
  ];
  const targetAbcIds = ['ABC-TEST1-9828', 'ABC-TEST2-9828', 'ABC-TEST3-9828'];

  const collections = await db.listCollections().toArray();

  for (const collInfo of collections) {
    const collName = collInfo.name;
    const coll = db.collection(collName);

    const matchCount = await coll.countDocuments({
      $or: [
        { studentId: { $in: [...targetIds, ...targetAbcIds] } },
        { user: { $in: targetIds } },
        { userId: { $in: targetIds } },
        { createdBy: { $in: targetIds } },
        { studentAbcId: { $in: targetAbcIds } }
      ]
    });

    if (matchCount > 0) {
      console.log(`Collection ${collName} has ${matchCount} matches`);
    }
  }

  await mongoose.disconnect();
}

checkAllReferences().catch(console.error);
