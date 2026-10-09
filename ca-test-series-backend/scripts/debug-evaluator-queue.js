require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Submission = require('../src/models/Submission');
const TestSeries = require('../src/models/TestSeries');
const User = require('../src/models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cahero', {
  autoIndex: true
});

async function debugEvaluatorQueue() {
  try {
    console.log('=== DEBUGGING EVALUATOR QUEUE ===\n');
    
    // Find all evaluators
    const evaluators = await User.find({ role: 'EVALUATOR' }).select('fullName email specializations');
    console.log('Available Evaluators:');
    evaluators.forEach(evaluator => {
      console.log(`- ${evaluator.fullName} (${evaluator.email})`);
      console.log(`  Specializations: ${evaluator.specializations.join(', ')}`);
    });
    console.log('');
    
    // Find all subjective submissions
    const allSubmissions = await Submission.find({
      status: { $in: ['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'LOCKED'] }
    }).populate('testSeriesId', 'title');
    
    console.log('All Active Submissions:');
    for (const submission of allSubmissions) {
      // Get test info
      let testType = 'UNKNOWN';
      let testName = 'Unknown';
      if (submission.testSeriesId && submission.testId) {
        try {
          const testSeries = await TestSeries.findById(submission.testSeriesId).select('tests');
          if (testSeries) {
            const test = testSeries.tests.id(submission.testId);
            if (test) {
              testType = test.testType;
              testName = test.title;
            }
          }
        } catch (error) {
          console.error('Error fetching test info:', error.message);
        }
      }
      
      console.log(`- ${submission._id}`);
      console.log(`  Test: ${testName} (${testType})`);
      console.log(`  Subject: ${submission.subject}`);
      console.log(`  Status: ${submission.status}`);
      console.log(`  Auto-evaluated: ${submission.meta?.isAutoEvaluated || false}`);
      console.log('');
    }
    
    // Check specific subjective submissions mentioned in the issue
    const specificIds = [
      '68a1cf6e945f95980fd1d135',
      '68a1c496c486c7615412198a'
    ];
    
    console.log('Checking specific submissions:');
    for (const id of specificIds) {
      try {
        const submission = await Submission.findById(id);
        if (submission) {
          console.log(`\n=== ${id} ===`);
          console.log(`Subject: ${submission.subject}`);
          console.log(`Status: ${submission.status}`);
          console.log(`Meta: ${JSON.stringify(submission.meta, null, 2)}`);
          
          // Check if any evaluator has this specialization
          const matchingEvaluators = evaluators.filter(ev => 
            ev.specializations.includes(submission.subject)
          );
          console.log(`Matching evaluators: ${matchingEvaluators.length}`);
          matchingEvaluators.forEach(ev => {
            console.log(`  - ${ev.fullName} (${ev.email})`);
          });
          
        } else {
          console.log(`Submission ${id} not found`);
        }
      } catch (error) {
        console.error(`Error checking ${id}:`, error.message);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the debug
debugEvaluatorQueue();
