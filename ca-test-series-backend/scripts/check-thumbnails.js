const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const checkThumbnails = async () => {
  try {
    // Connect to database
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ca-test-series';
    await mongoose.connect(mongoUri);
    console.log('✓ Connected to MongoDB');

    // Check TestSeries collection for thumbnailUrl
    const TestSeries = mongoose.model('TestSeries', new mongoose.Schema({}, { strict: false }), 'testseries');
    
    const totalSeries = await TestSeries.countDocuments();
    console.log(`\nTotal test series: ${totalSeries}`);
    
    const withThumbnails = await TestSeries.countDocuments({ thumbnailUrl: { $exists: true, $ne: '' } });
    console.log(`Test series with thumbnailUrl: ${withThumbnails}`);
    
    const withoutThumbnails = await TestSeries.countDocuments({ 
      $or: [
        { thumbnailUrl: { $exists: false } },
        { thumbnailUrl: '' },
        { thumbnailUrl: null }
      ]
    });
    console.log(`Test series without thumbnailUrl: ${withoutThumbnails}`);
    
    // Show sample data
    console.log('\n--- Sample test series with thumbnails ---');
    const samplesWithThumbnails = await TestSeries.find({ thumbnailUrl: { $exists: true, $ne: '' } })
      .select('title thumbnailUrl')
      .limit(5);
    samplesWithThumbnails.forEach(s => {
      console.log(`- ${s.title}: ${s.thumbnailUrl}`);
    });
    
    console.log('\n--- Sample test series without thumbnails ---');
    const samplesWithoutThumbnails = await TestSeries.find({ 
      $or: [
        { thumbnailUrl: { $exists: false } },
        { thumbnailUrl: '' },
        { thumbnailUrl: null }
      ]
    })
      .select('title thumbnailUrl')
      .limit(5);
    samplesWithoutThumbnails.forEach(s => {
      console.log(`- ${s.title}: ${s.thumbnailUrl || 'NO THUMBNAIL'}`);
    });

    await mongoose.disconnect();
    console.log('\n✓ Disconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

checkThumbnails();
