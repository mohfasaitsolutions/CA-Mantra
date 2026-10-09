const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

async function addUniqueIndex() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ca-test-series');
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('submissions');

    // Check for existing duplicate submissions
    console.log('Checking for duplicate submissions...');
    const duplicates = await collection.aggregate([
      {
        $group: {
          _id: {
            studentId: '$studentId',
            testSeriesId: '$testSeriesId',
            testId: '$testId'
          },
          count: { $sum: 1 },
          docs: { $push: '$_id' }
        }
      },
      {
        $match: { count: { $gt: 1 } }
      }
    ]).toArray();

    console.log(`Found ${duplicates.length} sets of duplicate submissions`);

    // Remove duplicate submissions (keep the latest one)
    for (const duplicate of duplicates) {
      const docIds = duplicate.docs;
      // Keep the first document, remove the rest
      const toRemove = docIds.slice(1);
      
      console.log(`Removing ${toRemove.length} duplicate submissions for student ${duplicate._id.studentId}, test ${duplicate._id.testId}`);
      
      await collection.deleteMany({
        _id: { $in: toRemove }
      });
    }

    // Add the unique index
    console.log('Adding unique index...');
    await collection.createIndex(
      { studentId: 1, testSeriesId: 1, testId: 1 }, 
      { unique: true, name: 'unique_submission_per_student_per_test' }
    );

    console.log('Migration completed successfully');
    console.log('✅ Unique index added to prevent duplicate submissions');
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the migration
addUniqueIndex().then(() => {
  console.log('Migration script completed');
  process.exit(0);
}).catch((error) => {
  console.error('Migration script failed:', error);
  process.exit(1);
});
