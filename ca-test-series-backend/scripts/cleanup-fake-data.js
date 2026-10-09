require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const { connectDB } = require('../src/config');
const User = require('../src/models/User');
const Submission = require('../src/models/Submission');

async function cleanupFakeData() {
  try {
    await connectDB();
    console.log('Connected to MongoDB');
    console.log('');
    console.log('Cleaning up fake AIR data...');
    console.log('');

    // Delete fake submissions
    const submissionsResult = await Submission.deleteMany({ 'meta.fakeData': true });
    console.log(`✓ Deleted ${submissionsResult.deletedCount} fake submissions`);

    // Delete fake users
    const usersResult = await User.deleteMany({ 'meta.fakeData': true });
    console.log(`✓ Deleted ${usersResult.deletedCount} fake users`);

    console.log('');
    console.log('========================================');
    console.log('✓ Cleanup completed successfully!');
    console.log('========================================');
    console.log('');

  } catch (error) {
    console.error('Error cleaning up fake data:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the cleanup
cleanupFakeData();
