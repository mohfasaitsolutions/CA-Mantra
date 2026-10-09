const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const addDefaultThumbnails = async () => {
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

    // Get all test series without thumbnails or with empty/null thumbnails
    const seriesToUpdate = await TestSeries.find({
      $or: [
        { thumbnailUrl: { $exists: false } },
        { thumbnailUrl: '' },
        { thumbnailUrl: null }
      ]
    });

    console.log(`\nFound ${seriesToUpdate.length} test series without thumbnails`);

    if (seriesToUpdate.length === 0) {
      console.log('✓ All test series already have thumbnails!');
      await mongoose.disconnect();
      console.log('✓ Disconnected from MongoDB');
      return;
    }

    for (const series of seriesToUpdate) {
      // Try to match subject in title or use tests to determine subject
      let thumbnail = defaultThumbnail;
      
      if (series.tests && series.tests.length > 0) {
        const firstTestSubject = series.tests[0].subject;
        // Check if subject matches any of our specific thumbnails
        for (const [key, url] of Object.entries(subjectThumbnails)) {
          if (firstTestSubject && firstTestSubject.toLowerCase().includes(key.toLowerCase())) {
            thumbnail = url;
            break;
          }
        }
      }

      // Update the series with $set to ensure the field is properly added
      await TestSeries.updateOne(
        { _id: series._id },
        { $set: { thumbnailUrl: thumbnail } }
      );
      
      console.log(`✓ Updated "${series.title}" with thumbnail`);
    }

    console.log(`\n✓ Successfully updated ${seriesToUpdate.length} test series with thumbnails`);
    
    // Verify the updates
    const verifyCount = await TestSeries.countDocuments({ 
      thumbnailUrl: { $exists: true, $ne: '', $ne: null }
    });
    console.log(`✓ Total test series with valid thumbnails: ${verifyCount}`);
    
    const stillMissing = await TestSeries.countDocuments({ 
      $or: [
        { thumbnailUrl: { $exists: false } },
        { thumbnailUrl: '' },
        { thumbnailUrl: null }
      ]
    });
    console.log(`Remaining test series without thumbnails: ${stillMissing}`);

    await mongoose.disconnect();
    console.log('✓ Disconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

addDefaultThumbnails();
