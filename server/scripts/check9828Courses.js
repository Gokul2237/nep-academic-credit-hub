const mongoose = require('mongoose');

async function check9828() {
  await mongoose.connect('mongodb://127.0.0.1:27017/nep_academic_hub');
  const db = mongoose.connection.db;

  const courses = await db.collection('courses').find({
    $or: [
      { code: { $regex: /9828/i } },
      { name: { $regex: /9828/i } }
    ]
  }).toArray();
  console.log(`Courses matching 9828: ${courses.length}`);
  courses.forEach(c => console.log(c._id, c.code, c.name));

  const testDeans = await db.collection('users').find({
    email: { $in: ['dean_inst_a_9828@bit.edu', 'dean_inst_a_8206@bit.edu'] }
  }).toArray();
  console.log(`Test deans: ${testDeans.length}`);
  testDeans.forEach(d => console.log(d._id, d.email));

  await mongoose.disconnect();
}

check9828().catch(console.error);
