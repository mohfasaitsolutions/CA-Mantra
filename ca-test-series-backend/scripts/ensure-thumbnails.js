const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

/**
 * This script ensures ALL test series have thumbnails.
 * It adds default thumbnails to any series missing them and validates existing ones.
 * Safe to run multiple times - it's idempotent.
 */

const ensureThumbnails = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ca-test-series');
    console.log('✓ Connected to MongoDB');

    const TestSeries = mongoose.model('TestSeries', new mongoose.Schema({}, { strict: false }), 'testseries');
    
    // Default placeholder thumbnail URL
    const defaultThumbnail = 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=600&fit=crop';
    
    // Subject-specific thumbnails
    const subjectThumbnails = {
      'Accounting': 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&h=600&fit=crop',
      'Taxation': 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&h=600&fit=crop',
      'Audit': 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&h=600&fit=crop',
      'Law': 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&h=600&fit=crop',
      'Finance': 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop',
      'Cost': 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?w=800&h=600&fit=crop',
      'Economics': 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=600&fit=crop',
      'Management': 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=600&fit=crop'
    };

    // Get total count
    const totalSeries = await TestSeries.countDocuments();
    console.log(`\nTotal test series in database: ${totalSeries}`);

    // Find all test series with missing or empty thumbnails
    const seriesToFix = await TestSeries.find({
      $or: [
        { thumbnailUrl: { $exists: false } },
        { thumbnailUrl: '' },
        { thumbnailUrl: null }
      ]
    });

    console.log(`Found ${seriesToFix.length} test series needing thumbnails`);

    if (seriesToFix.length === 0) {
      console.log('\n✅ All test series already have valid thumbnails!');
    } else {
      console.log('\n🔧 Fixing thumbnails...\n');
      
      let updatedCount = 0;
      
      for (const series of seriesToFix) {
        // Try to match subject in title or use tests to determine subject
        let thumbnail = defaultThumbnail;
        
        // Check tests array for subject
        if (series.tests && series.tests.length > 0) {
          const firstTestSubject = series.tests[0].subject;
          
          // Match subject to specific thumbnail
          for (const [key, url] of Object.entries(subjectThumbnails)) {
            if (firstTestSubject && firstTestSubject.toLowerCase().includes(key.toLowerCase())) {
              thumbnail = url;
              break;
            }
          }
        }

        // Update the series
        const result = await TestSeries.updateOne(
          { _id: series._id },
          { $set: { thumbnailUrl: thumbnail } }
        );

        if (result.modifiedCount > 0) {
          updatedCount++;
          console.log(`  ✓ "${series.title}" → ${thumbnail.includes('unsplash') ? 'subject-specific' : 'default'} thumbnail`);
        }
      }

      console.log(`\n✅ Successfully updated ${updatedCount} test series`);
    }

    // Final verification
    console.log('\n📊 Final Statistics:');
    const withValidThumbnails = await TestSeries.countDocuments({ 
      thumbnailUrl: { $exists: true, $ne: '', $ne: null }
    });
    console.log(`  • Test series with valid thumbnails: ${withValidThumbnails}/${totalSeries}`);
    
    const stillMissing = await TestSeries.countDocuments({ 
      $or: [
        { thumbnailUrl: { $exists: false } },
        { thumbnailUrl: '' },
        { thumbnailUrl: null }
      ]
    });
    
    if (stillMissing > 0) {
      console.log(`  ⚠️  Warning: ${stillMissing} test series still without thumbnails`);
    } else {
      console.log(`  ✅ All test series have valid thumbnails!`);
    }

    await mongoose.disconnect();
    console.log('\n✓ Disconnected from MongoDB');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

ensureThumbnails();
