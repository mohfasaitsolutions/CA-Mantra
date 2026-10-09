/**
 * Database Health Check Script
 * 
 * Checks for common data integrity issues:
 * - Orphaned enrollments (enrollments for non-existent test series)
 * - Missing thumbnails in test series
 * - Orphaned submissions (submissions for deleted test series)
 * - Invalid references
 * 
 * Usage: node scripts/health-check.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Enrollment = require('../src/models/Enrollment');
const TestSeries = require('../src/models/TestSeries');
const Submission = require('../src/models/Submission');
const User = require('../src/models/User');

async function healthCheck() {
  try {
    console.log('🏥 Starting Database Health Check...\n');
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    let issuesFound = 0;
    const issues = [];

    // ============================================
    // 1. Check for Orphaned Enrollments
    // ============================================
    console.log('📊 Checking for orphaned enrollments...');
    const enrollments = await Enrollment.find({});
    const allTestSeriesIds = new Set(
      (await TestSeries.find({}).select('_id')).map(ts => String(ts._id))
    );
    
    const orphanedEnrollments = enrollments.filter(e => 
      !allTestSeriesIds.has(String(e.testSeriesId))
    );

    if (orphanedEnrollments.length > 0) {
      issuesFound++;
      issues.push({
        type: 'ORPHANED_ENROLLMENTS',
        severity: 'HIGH',
        count: orphanedEnrollments.length,
        description: `Found ${orphanedEnrollments.length} enrollments referencing deleted test series`,
        fix: 'Run: node scripts/cleanup-orphaned-enrollments.js'
      });
      console.log(`   ⚠️  Found ${orphanedEnrollments.length} orphaned enrollments`);
    } else {
      console.log('   ✅ No orphaned enrollments found');
    }

    // ============================================
    // 2. Check for Missing Thumbnails
    // ============================================
    console.log('\n🖼️  Checking for missing thumbnails...');
    const testSeries = await TestSeries.find({});
    const missingThumbnails = testSeries.filter(ts => 
      !ts.thumbnailUrl || ts.thumbnailUrl.trim() === ''
    );

    if (missingThumbnails.length > 0) {
      issuesFound++;
      issues.push({
        type: 'MISSING_THUMBNAILS',
        severity: 'MEDIUM',
        count: missingThumbnails.length,
        description: `Found ${missingThumbnails.length} test series without thumbnails`,
        fix: 'Run: node ensure-all-thumbnails.js',
        details: missingThumbnails.map(ts => ({
          id: String(ts._id),
          title: ts.title
        }))
      });
      console.log(`   ⚠️  Found ${missingThumbnails.length} test series without thumbnails`);
      missingThumbnails.slice(0, 5).forEach(ts => {
        console.log(`      - ${ts.title} (ID: ${ts._id})`);
      });
      if (missingThumbnails.length > 5) {
        console.log(`      ... and ${missingThumbnails.length - 5} more`);
      }
    } else {
      console.log('   ✅ All test series have thumbnails');
    }

    // ============================================
    // 3. Check for Orphaned Submissions
    // ============================================
    console.log('\n📝 Checking for orphaned submissions...');
    const submissions = await Submission.find({});
    const orphanedSubmissions = submissions.filter(s => 
      !allTestSeriesIds.has(String(s.testSeriesId))
    );

    if (orphanedSubmissions.length > 0) {
      issuesFound++;
      issues.push({
        type: 'ORPHANED_SUBMISSIONS',
        severity: 'HIGH',
        count: orphanedSubmissions.length,
        description: `Found ${orphanedSubmissions.length} submissions for deleted test series`,
        fix: 'Consider creating a cleanup script or archiving these submissions'
      });
      console.log(`   ⚠️  Found ${orphanedSubmissions.length} orphaned submissions`);
    } else {
      console.log('   ✅ No orphaned submissions found');
    }

    // ============================================
    // 4. Check for Invalid User References
    // ============================================
    console.log('\n👥 Checking for invalid user references in enrollments...');
    const allUserIds = new Set(
      (await User.find({}).select('_id')).map(u => String(u._id))
    );
    
    const invalidEnrollments = enrollments.filter(e => 
      !allUserIds.has(String(e.studentId))
    );

    if (invalidEnrollments.length > 0) {
      issuesFound++;
      issues.push({
        type: 'INVALID_USER_REFERENCES',
        severity: 'HIGH',
        count: invalidEnrollments.length,
        description: `Found ${invalidEnrollments.length} enrollments for deleted users`,
        fix: 'Consider creating a cleanup script for these enrollments'
      });
      console.log(`   ⚠️  Found ${invalidEnrollments.length} enrollments with invalid user references`);
    } else {
      console.log('   ✅ All enrollments have valid user references');
    }

    // ============================================
    // 5. Database Statistics
    // ============================================
    console.log('\n📈 Database Statistics:');
    console.log(`   Test Series: ${testSeries.length}`);
    console.log(`   Enrollments: ${enrollments.length}`);
    console.log(`   Submissions: ${submissions.length}`);
    console.log(`   Users: ${allUserIds.size}`);

    // ============================================
    // Summary Report
    // ============================================
    console.log('\n' + '═'.repeat(80));
    console.log('📋 HEALTH CHECK SUMMARY');
    console.log('═'.repeat(80));

    if (issuesFound === 0) {
      console.log('\n✅ Database is healthy! No issues found.\n');
    } else {
      console.log(`\n⚠️  Found ${issuesFound} types of issues:\n`);
      
      issues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue.type}`);
        console.log(`   Severity: ${issue.severity}`);
        console.log(`   Description: ${issue.description}`);
        console.log(`   Fix: ${issue.fix}`);
        console.log('');
      });

      console.log('Recommended Actions:');
      issues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue.fix}`);
      });
      console.log('');
    }

    console.log('═'.repeat(80));

    // Generate JSON report
    const report = {
      timestamp: new Date().toISOString(),
      status: issuesFound === 0 ? 'HEALTHY' : 'ISSUES_FOUND',
      issuesCount: issuesFound,
      issues: issues,
      statistics: {
        testSeries: testSeries.length,
        enrollments: enrollments.length,
        submissions: submissions.length,
        users: allUserIds.size
      }
    };

    // Save report to file
    const fs = require('fs');
    const reportPath = `./health-check-report-${Date.now()}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n💾 Report saved to: ${reportPath}`);

  } catch (error) {
    console.error('❌ Error during health check:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the health check
healthCheck();
