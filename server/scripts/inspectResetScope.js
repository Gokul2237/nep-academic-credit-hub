const mongoose = require('mongoose');

async function inspect() {
  await mongoose.connect('mongodb://127.0.0.1:27017/nep_academic_hub');
  const db = mongoose.connection.db;

  const before18 = await db.collection('users').countDocuments({
    role: 'student',
    createdAt: { $lt: new Date('2026-10-18T00:00:00Z') }
  });
  console.log('Students before Oct 18:', before18);

  const after18 = await db.collection('users').find({
    role: 'student',
    createdAt: { $gte: new Date('2026-10-18T00:00:00Z') }
  }).project({ name: 1, email: 1, studentId: 1, createdAt: 1 }).toArray();
  console.log(`Students after Oct 18 (${after18.length}):`);
  after18.forEach(s => console.log(`  - ${s.name} (${s.email}) [${s.studentId}] Created: ${s.createdAt}`));

  const allUsersAfter18 = await db.collection('users').find({
    role: { $ne: 'student' },
    createdAt: { $gte: new Date('2026-10-18T00:00:00Z') }
  }).project({ name: 1, email: 1, role: 1, createdAt: 1 }).toArray();
  console.log(`Non-student users after Oct 18 (${allUsersAfter18.length}):`);
  allUsersAfter18.forEach(u => console.log(`  - [${u.role}] ${u.name} (${u.email}) Created: ${u.createdAt}`));

  const instAfter18 = await db.collection('institutions').find({
    createdAt: { $gte: new Date('2026-10-18T00:00:00Z') }
  }).project({ code: 1, name: 1, createdAt: 1 }).toArray();
  console.log(`Institutions created after Oct 18 (${instAfter18.length}):`);
  instAfter18.forEach(i => console.log(`  - [${i.code}] ${i.name}`));

  await mongoose.disconnect();
}

inspect().catch(console.error);
