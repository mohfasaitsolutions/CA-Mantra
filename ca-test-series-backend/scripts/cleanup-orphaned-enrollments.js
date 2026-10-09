/**
 * Cleanup Orphaned Enrollments
 * 
 * This script removes enrollments that reference test series which no longer exist.
 * Run this script to clean up your database.
 * 
 * Usage: node scripts/cleanup-orphaned-enrollments.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Enrollment = require('../src/models/Enrollment');
const TestSeries = require('../src/models/TestSeries');

async function cleanupOrphanedEnrollments() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all enrollments
    console.log('📊 Fetching all enrollments...');
    const enrollments = await Enrollment.find({});
    console.log(`Found ${enrollments.length} total enrollments\n`);

    // Get all test series IDs that exist
    console.log('📚 Fetching all test series...');
    const allTestSeries = await TestSeries.find({}).select('_id title');
    const existingSeriesIds = new Set(allTestSeries.map(ts => String(ts._id)));
    console.log(`Found ${allTestSeries.length} existing test series\n`);

    // Find orphaned enrollments
    const orphanedEnrollments = enrollments.filter(enrollment => {
      return !existingSeriesIds.has(String(enrollment.testSeriesId));
    });

    console.log(`Found ${orphanedEnrollments.length} orphaned enrollments\n`);

    if (orphanedEnrollments.length === 0) {
      console.log('✨ No orphaned enrollments found. Database is clean!');
      process.exit(0);
    }

    // Display orphaned enrollments
    console.log('📋 Orphaned Enrollments:');
    console.log('─'.repeat(80));
    orphanedEnrollments.forEach((enrollment, index) => {
      console.log(`${index + 1}. Enrollment ID: ${enrollment._id}`);
      console.log(`   Student ID: ${enrollment.studentId}`);
      console.log(`   Test Series ID: ${enrollment.testSeriesId} (MISSING)`);
      console.log(`   Created: ${enrollment.createdAt}`);
      console.log(`   Active: ${enrollment.isActive}`);
      console.log('─'.repeat(80));
    });

    // Ask for confirmation before deletion
    console.log(`\n⚠️  WARNING: About to delete ${orphanedEnrollments.length} orphaned enrollments`);
    console.log('This action cannot be undone!\n');

    // Delete orphaned enrollments
    const orphanedIds = orphanedEnrollments.map(e => e._id);
    const result = await Enrollment.deleteMany({ _id: { $in: orphanedIds } });

    console.log(`\n✅ Successfully deleted ${result.deletedCount} orphaned enrollments`);

    // Summary
    console.log('\n📊 Summary:');
    console.log(`   Total enrollments before: ${enrollments.length}`);
    console.log(`   Orphaned enrollments deleted: ${result.deletedCount}`);
    console.log(`   Remaining enrollments: ${enrollments.length - result.deletedCount}`);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the script
cleanupOrphanedEnrollments();
