const mongoose = require('mongoose');

async function inspectAaravSharma() {
  await mongoose.connect('mongodb://127.0.0.1:27017/nep_academic_hub');
  const db = mongoose.connection.db;

  const aarav = await db.collection('users').findOne({ studentId: 'ABC-P3-6513' });
  console.log('Aarav Sharma User:', aarav);

  const credits = await db.collection('academiccredits').find({ studentId: aarav._id }).toArray();
  console.log('Aarav Sharma Credits:', credits);

  const transfers = await db.collection('credittransfers').find({
    $or: [{ studentId: aarav._id }, { studentAbcId: 'ABC-P3-6513' }]
  }).toArray();
  console.log('Aarav Sharma Transfers:', transfers);

  await mongoose.disconnect();
}

inspectAaravSharma().catch(console.error);
