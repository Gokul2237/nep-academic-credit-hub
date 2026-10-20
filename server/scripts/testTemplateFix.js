const http = require('http');
const xlsx = require('xlsx');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { generateToken } = require('../utils/tokenHelper');

function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          buffer,
          text: buffer.toString('utf8'),
        });
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

function buildMultipartFormData(fields, fileFieldName, fileName, fileBuffer) {
  const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
  const parts = [];

  for (const [key, val] of Object.entries(fields)) {
    parts.push(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="${key}"\r\n\r\n` +
      `${val}\r\n`
    );
  }

  parts.push(
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="${fileFieldName}"; filename="${fileName}"\r\n` +
    `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet\r\n\r\n`
  );

  const headerBuffer = Buffer.from(parts.join(''), 'utf-8');
  const footerBuffer = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf-8');
  const fullBuffer = Buffer.concat([headerBuffer, fileBuffer, footerBuffer]);

  return {
    buffer: fullBuffer,
    contentType: `multipart/form-data; boundary=${boundary}`,
  };
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/nep_academic_hub');

  const bitsathyUser = await mongoose.connection.db.collection('users').findOne({ email: 'bitsathy@gmail.com' });
  const token = generateToken(bitsathyUser);
  console.log('✅ Generated valid JWT token for bitsathy@gmail.com');

  // 1. Download template
  const templateRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/institution/results/template',
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });

  console.log(`Downloaded template: ${templateRes.buffer.length} bytes`);

  // 2. Upload template to POST /api/institution/results/preview
  const multipart = buildMultipartFormData(
    { academicYear: '2024-25', semester: '1' },
    'file',
    'NEP_Semester_Results_Import_Template.xlsx',
    templateRes.buffer
  );

  const previewRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/institution/results/preview',
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': multipart.contentType,
        'Content-Length': multipart.buffer.length,
      },
    },
    multipart.buffer
  );

  console.log('\n--- Preview Response from Uploading Template ---');
  console.log('Preview status code:', previewRes.statusCode);
  const previewJson = JSON.parse(previewRes.text);
  console.log('Preview success:', previewJson.success);
  console.log('Preview total rows:', previewJson.data?.counts?.totalRows);
  console.log('Preview valid rows:', previewJson.data?.counts?.validRows);
  console.log('Preview invalid rows:', previewJson.data?.counts?.invalidRows);
  console.log('Preview total eligible credits:', previewJson.data?.counts?.totalEligibleCredits);

  if (previewJson.data?.counts?.validRows > 0) {
    console.log(`✅ SUCCESS: Downloaded template was uploaded and verified: ${previewJson.data?.counts?.validRows}/${previewJson.data?.counts?.totalRows} valid rows, ${previewJson.data?.counts?.totalEligibleCredits} eligible credits!`);
  } else {
    console.error('❌ FAILURE: Preview had no valid rows:', previewJson);
    process.exit(1);
  }

  // 3. Clean up any temporary batch created during this preview test so no leftovers remain
  if (previewJson.data?.batchId) {
    await mongoose.connection.db.collection('resultimportbatches').deleteOne({ batchId: previewJson.data.batchId });
    console.log(`Cleaned up preview test batch: ${previewJson.data.batchId}`);
  }

  await mongoose.disconnect();
  console.log('\n🎉 ALL END-TO-END TEMPLATE DOWNLOAD & PREVIEW TESTS PASSED SUCCESSFULLY!');
  process.exit(0);
}

run().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
