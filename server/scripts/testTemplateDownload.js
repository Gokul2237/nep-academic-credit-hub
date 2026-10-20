const http = require('http');
const fs = require('fs');
const xlsx = require('xlsx');

// We will test generating the template buffer directly to see its structure
const { User } = require('../models/User');
const { Course } = require('../models/Course');
const Institution = require('../models/Institution');
const mongoose = require('mongoose');

async function test() {
  await mongoose.connect('mongodb://127.0.0.1:27017/nep_academic_hub');

  const bit = await Institution.findOne({ code: 'BIT001' });
  console.log('BIT institution ID:', bit._id);

  const students = await User.find({ role: 'student', institutionId: bit._id, isActive: true }).limit(5).lean();
  const courses = await Course.find({ institutionId: bit._id, isActive: true }).limit(5).lean();

  console.log(`Loaded ${students.length} students and ${courses.length} courses for BIT.`);

  const templateRows = [];
  students.forEach((s, idx) => {
    const c1 = courses[0];
    const c2 = courses[1];
    templateRows.push({
      'ABC ID': s.studentId,
      'Student Name': s.name,
      'Course Code': c1.courseCode,
      'Course Name': c1.courseName,
      Marks: idx === 4 ? 32 : (80 + idx * 3),
      Grade: idx === 4 ? 'F' : (idx === 0 ? 'O' : 'A+'),
    });
    if (c2) {
      templateRows.push({
        'ABC ID': s.studentId,
        'Student Name': s.name,
        'Course Code': c2.courseCode,
        'Course Name': c2.courseName,
        Marks: 75 + idx * 2,
        Grade: 'A',
      });
    }
  });

  const wb = xlsx.utils.book_new();
  const ws = xlsx.utils.json_to_sheet(templateRows);
  xlsx.utils.book_append_sheet(wb, ws, 'Results Template');

  const buf = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
  console.log('Generated template buffer size:', buf.length, 'bytes');

  // Verify that xlsx can read it back cleanly
  const readWb = xlsx.read(buf, { type: 'buffer' });
  const readRows = xlsx.utils.sheet_to_json(readWb.Sheets[readWb.SheetNames[0]]);
  console.log(`Successfully read back ${readRows.length} rows:`);
  console.log(readRows.slice(0, 3));

  await mongoose.disconnect();
}

test().catch(console.error);
