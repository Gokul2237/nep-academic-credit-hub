const mongoose = require('mongoose');

async function testFilter() {
  await mongoose.connect('mongodb://127.0.0.1:27017/nep_academic_hub');
  const db = mongoose.connection.db;

  const allStudents = await db.collection('users').find({ role: 'student' }).toArray();
  console.log(`Total students in DB: ${allStudents.length}`);

  const testFilter = {
    role: 'student',
    $or: [
      { email: { $regex: /test/i } },
      { name: { $regex: /test|3071|2553|2729|5124|8792|8387|6513|4008|179233/i } },
      { studentId: { $regex: /test|P3|P4|FULL|179233/i } },
      { studentId: { $in: ['ABC-TEST1-9828', 'ABC-TEST2-9828', 'ABC-TEST3-9828'] } },
      { createdAt: { $gte: new Date('2026-10-18T00:00:00Z') } }
    ]
  };

  const toDelete = await db.collection('users').find(testFilter).toArray();
  console.log(`Test students matched for deletion: ${toDelete.length}`);
  toDelete.forEach(s => console.log(`  - DELETE: ${s.name} (${s.email}) [${s.studentId}]`));

  const toKeep = allStudents.filter(s => !toDelete.some(d => d._id.equals(s._id)));
  console.log(`\nGenuine students kept: ${toKeep.length}`);
  console.log(`First 3 kept:`, toKeep.slice(0, 3).map(s => `${s.name} (${s.email}) [${s.studentId}]`));
  console.log(`Last 3 kept:`, toKeep.slice(-3).map(s => `${s.name} (${s.email}) [${s.studentId}]`));

  // Check if any genuine student is accidentally caught
  const suspiciousInKept = toKeep.filter(s => s.email.includes('test') || (s.studentId && s.studentId.includes('test')));
  console.log(`Suspicious students in kept: ${suspiciousInKept.length}`);

  // Check institutions
  const testInstFilter = {
    $or: [
      { code: { $regex: /_3071|_2553|_2729|_5124|_8792|_8387|_6513|_4008|P5I/i } },
      { code: { $in: ['IIT_7414', 'IIT_8792', 'IIT_5124'] } },
      { createdAt: { $gte: new Date('2026-10-18T00:00:00Z') } }
    ]
  };
  const instsToDelete = await db.collection('institutions').find(testInstFilter).toArray();
  console.log(`\nTest institutions to delete: ${instsToDelete.length}`);
  instsToDelete.forEach(i => console.log(`  - DELETE INST: [${i.code}] ${i.name}`));

  const instsToKeep = await db.collection('institutions').find({ _id: { $nin: instsToDelete.map(i => i._id) } }).toArray();
  console.log(`Institutions kept (${instsToKeep.length}):`);
  instsToKeep.forEach(i => console.log(`  - KEEP INST: [${i.code}] ${i.name}`));

  // Check institution users
  const instUsersToDelete = await db.collection('users').find({
    role: 'institution',
    $or: [
      { email: { $regex: /dean_|phase5/i } },
      { createdAt: { $gte: new Date('2026-10-18T00:00:00Z') } }
    ]
  }).toArray();
  console.log(`\nTest institution user logins to delete: ${instUsersToDelete.length}`);
  instUsersToDelete.forEach(u => console.log(`  - DELETE USER: ${u.email} (${u.name})`));

  const instUsersToKeep = await db.collection('users').find({
    role: 'institution',
    _id: { $nin: instUsersToDelete.map(u => u._id) }
  }).toArray();
  console.log(`Institution user logins kept (${instUsersToKeep.length}):`);
  instUsersToKeep.forEach(u => console.log(`  - KEEP USER: ${u.email} (${u.name})`));

  await mongoose.disconnect();
}

testFilter().catch(console.error);
