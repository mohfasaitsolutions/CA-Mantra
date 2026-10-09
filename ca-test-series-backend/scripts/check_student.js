const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const User = require('../src/models/User');
const Enrollment = require('../src/models/Enrollment');
const TestSeries = require('../src/models/TestSeries');

async function checkStudent() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const user = await User.findOne({ mobile: '9770377868' });
    if (!user) {
      console.log('Student not found');
      return;
    }
    console.log('Student:', user.fullName, user.email, user._id);
    
    const enrollments = await Enrollment.find({ studentId: user._id, isActive: true });
    console.log('Enrollments:', enrollments.length);
    
    let totalTests = 0;
    for (const e of enrollments) {
      const series = await TestSeries.findById(e.testSeriesId).select('title tests');
      if (series && series.tests) {
        totalTests += series.tests.length;
        console.log('Series:', series.title, 'Tests:', series.tests.length);
      }
    }
    console.log('Total Tests Purchased:', totalTests);
  } catch (err) {
    console.error(err);
  } finally {
    mongoose.disconnect();
  }
}
checkStudent();