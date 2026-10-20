const mongoose = require('mongoose');

async function findUsers() {
  await mongoose.connect('mongodb://127.0.0.1:27017/nep_academic_hub');
  const db = mongoose.connection.db;

  const users = await db.collection('users').find({
    $or: [
      { name: { $regex: /aarav|bhavya|chetan/i } },
      { email: { $regex: /aarav|bhavya|chetan/i } },
      { studentId: { $regex: /aarav|bhavya|chetan/i } }
    ]
  }).toArray();

  console.log('--- USERS MATCHING AARAV / BHAVYA / CHETAN ---');
  console.log(`Found: ${users.length}`);
  for (const u of users) {
    console.log(JSON.stringify({
      _id: u._id,
      name: u.name,
      email: u.email,
      studentId: u.studentId,
      role: u.role,
      institutionId: u.institutionId,
      currentSemester: u.currentSemester,
      createdAt: u.createdAt
    }, null, 2));
  }

  console.log('\n--- ALL USERS CREATED ON OR AFTER 2026-10-18 ---');
  const recentUsers = await db.collection('users').find({
    createdAt: { $gte: new Date('2026-10-18T00:00:00Z') }
  }).toArray();
  console.log(`Found: ${recentUsers.length}`);
  for (const u of recentUsers) {
    console.log(JSON.stringify({
      _id: u._id,
      name: u.name,
      email: u.email,
      studentId: u.studentId,
      role: u.role,
      createdAt: u.createdAt
    }, null, 2));
  }

  await mongoose.disconnect();
}

findUsers().catch(console.error);
