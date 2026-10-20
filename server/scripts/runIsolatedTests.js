// Sets isolated test environment variables BEFORE any server modules are required
process.env.TEST_PORT = '5099';
process.env.MONGO_URI = 'mongodb://127.0.0.1:27017/nep_test_isolated';
process.env.NODE_ENV = 'test';

const mongoose = require('mongoose');

async function main() {
  console.log('🧪 Starting isolated test run...');
  console.log(`📡 Isolated Test Server Port: ${process.env.TEST_PORT}`);
  console.log(`💾 Isolated Database: ${process.env.MONGO_URI}`);

  // Require the test suite now that process.env is set
  const runTestSuite = require('../testSemesterResultsAndProgression');

  try {
    const result = await runTestSuite();
    console.log(`\nVerified outcome: ${result.passedTests}/${result.totalTests} tests passed.`);

    if (result.serverInstance) {
      await new Promise(resolve => result.serverInstance.close(resolve));
      console.log('Closed isolated test HTTP server.');
    }

    console.log('🧹 Cleaning up isolated test database (nep_test_isolated)...');
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.db.dropDatabase();
      console.log('✅ Isolated test database dropped successfully.');
      await mongoose.disconnect();
    }
    process.exit(0);
  } catch (err) {
    console.error('❌ Isolated test execution failed:', err);
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.db.dropDatabase().catch(() => {});
      await mongoose.disconnect().catch(() => {});
    }
    process.exit(1);
  }
}

main();
