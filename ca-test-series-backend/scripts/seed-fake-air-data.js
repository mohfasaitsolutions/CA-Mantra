require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const { connectDB } = require('../src/config');
const User = require('../src/models/User');
const Submission = require('../src/models/Submission');
const TestSeries = require('../src/models/TestSeries');
const ROLES = require('../src/constants/roles');
const SUBJECTS = require('../src/constants/subjects');

// Fake data generators
const firstNames = [
  'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Arnav', 'Ayaan', 'Krishna', 'Ishaan',
  'Shaurya', 'Atharv', 'Advik', 'Pranav', 'Reyansh', 'Aaradhya', 'Ananya', 'Pari', 'Anika', 'Diya',
  'Saanvi', 'Navya', 'Angel', 'Kavya', 'Kiara', 'Sara', 'Myra', 'Aadhya', 'Shanaya', 'Prisha',
  'Riya', 'Anvi', 'Avni', 'Siya', 'Mira', 'Aditi', 'Ishita', 'Tara', 'Khushi', 'Ira',
  'Aryan', 'Rohan', 'Kabir', 'Karan', 'Siddharth', 'Varun', 'Nikhil', 'Rahul', 'Ankush', 'Harsh'
];

const lastNames = [
  'Sharma', 'Verma', 'Patel', 'Gupta', 'Kumar', 'Singh', 'Reddy', 'Joshi', 'Agarwal', 'Mehta',
  'Rao', 'Nair', 'Iyer', 'Pillai', 'Desai', 'Shah', 'Jain', 'Bose', 'Das', 'Ghosh',
  'Saxena', 'Malhotra', 'Chopra', 'Kapoor', 'Arora', 'Bansal', 'Sinha', 'Mishra', 'Pandey', 'Trivedi',
  'Kulkarni', 'Deshpande', 'Patil', 'Pawar', 'Naik', 'Bhat', 'Hegde', 'Shetty', 'Kamath', 'Menon'
];

const indianCities = [
  { city: 'Mumbai', state: 'Maharashtra' },
  { city: 'Delhi', state: 'Delhi' },
  { city: 'Bangalore', state: 'Karnataka' },
  { city: 'Hyderabad', state: 'Telangana' },
  { city: 'Chennai', state: 'Tamil Nadu' },
  { city: 'Kolkata', state: 'West Bengal' },
  { city: 'Pune', state: 'Maharashtra' },
  { city: 'Ahmedabad', state: 'Gujarat' },
  { city: 'Jaipur', state: 'Rajasthan' },
  { city: 'Lucknow', state: 'Uttar Pradesh' },
  { city: 'Indore', state: 'Madhya Pradesh' },
  { city: 'Bhopal', state: 'Madhya Pradesh' },
  { city: 'Chandigarh', state: 'Chandigarh' },
  { city: 'Kochi', state: 'Kerala' },
  { city: 'Coimbatore', state: 'Tamil Nadu' },
  { city: 'Nagpur', state: 'Maharashtra' },
  { city: 'Visakhapatnam', state: 'Andhra Pradesh' },
  { city: 'Vadodara', state: 'Gujarat' },
  { city: 'Patna', state: 'Bihar' },
  { city: 'Ludhiana', state: 'Punjab' }
];

const caLevels = ['FOUNDATION', 'INTERMEDIATE', 'FINAL'];

// Utility functions
function randomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateEmail(firstName, lastName, index) {
  const normalized = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${index}`;
  return `${normalized}@test.com`;
}

// Generate a normal distribution for marks (bell curve)
function normalDistribution(mean, stdDev) {
  let u = 0, v = 0;
  while(u === 0) u = Math.random();
  while(v === 0) v = Math.random();
  const num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return Math.round(num * stdDev + mean);
}

async function seedFakeAIRData() {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    // Configuration
    const NUM_STUDENTS = parseInt(process.argv[2]) || 100; // Default 100 students, can pass as argument
    const SUBMISSIONS_PER_STUDENT = parseInt(process.argv[3]) || 5; // Default 5 submissions per student

    console.log(`\nGenerating fake AIR data...`);
    console.log(`Students to create: ${NUM_STUDENTS}`);
    console.log(`Submissions per student: ${SUBMISSIONS_PER_STUDENT}`);
    console.log('');

    // Step 1: Get or create a test series to use for submissions
    let testSeries = await TestSeries.findOne();
    
    if (!testSeries) {
      console.log('No test series found. Creating a sample test series...');
      testSeries = await TestSeries.create({
        title: 'CA Foundation Mock Test Series',
        description: 'Comprehensive mock test series for CA Foundation',
        caLevel: 'FOUNDATION',
        price: 999,
        isPaid: false,
        thumbnailUrl: 'https://example.com/thumbnail.jpg',
        tests: [
          {
            testId: new mongoose.Types.ObjectId(),
            subject: SUBJECTS[0],
            title: 'Test 1',
            totalMarks: 100,
            duration: 180,
            isPublished: true,
            scheduledAt: new Date()
          }
        ]
      });
      console.log(`Created test series: ${testSeries.title}`);
    }

    const testId = testSeries.tests[0]?.testId || new mongoose.Types.ObjectId();
    const testSeriesId = testSeries._id;

    console.log(`Using test series: ${testSeries.title} (${testSeriesId})`);
    console.log('');

    // Step 2: Create fake students
    console.log('Creating fake students...');
    const students = [];
    const existingEmails = new Set();

    for (let i = 0; i < NUM_STUDENTS; i++) {
      const firstName = randomElement(firstNames);
      const lastName = randomElement(lastNames);
      const email = generateEmail(firstName, lastName, i);
      const location = randomElement(indianCities);
      const caLevel = randomElement(caLevels);

      if (existingEmails.has(email)) continue;
      existingEmails.add(email);

      const student = {
        fullName: `${firstName} ${lastName}`,
        email: email,
        password: 'Test@12345', // Will be hashed by pre-save hook
        role: ROLES.STUDENTS,
        caLevel: caLevel,
        city: location.city,
        state: location.state,
        mobile: `${randomInt(6000000000, 9999999999)}`,
        isActive: true,
        emailVerified: true,
        address: `${randomInt(1, 999)}, ${location.city}, ${location.state}`,
        meta: {
          fakeData: true,
          generatedAt: new Date()
        }
      };

      students.push(student);
    }

    // Bulk insert students
    const createdStudents = await User.insertMany(students, { ordered: false });
    console.log(`✓ Created ${createdStudents.length} fake students`);
    console.log('');

    // Step 3: Create fake submissions with realistic score distribution
    console.log('Creating fake submissions...');
    const submissions = [];
    const subjects = SUBJECTS;

    for (const student of createdStudents) {
      for (let j = 0; j < SUBMISSIONS_PER_STUDENT; j++) {
        const subject = randomElement(subjects);
        const totalMarks = 100;
        
        // Use normal distribution centered at 55 with std deviation of 12
        // This creates realistic bell curve: most students score 30-80%
        let awardedMarks = normalDistribution(55, 12);
        
        // Clamp to range 30-80
        awardedMarks = Math.max(30, Math.min(80, awardedMarks));

        const submission = {
          testSeriesId: testSeriesId,
          testId: testId,
          studentId: student._id,
          subject: subject,
          status: 'COMPLETED',
          totalMarks: totalMarks,
          awardedMarks: awardedMarks,
          evaluatedAt: new Date(Date.now() - randomInt(0, 30) * 24 * 60 * 60 * 1000), // Random date in last 30 days
          remarks: 'Auto-generated evaluation',
          attachments: [],
          meta: {
            fakeData: true,
            generatedAt: new Date()
          }
        };

        submissions.push(submission);
      }
    }

    // Bulk insert submissions
    try {
      const createdSubmissions = await Submission.insertMany(submissions, { ordered: false });
      console.log(`✓ Created ${createdSubmissions.length} fake submissions`);
    } catch (error) {
      if (error.code === 11000) {
        console.log('⚠ Some submissions already exist (duplicate key), continuing...');
      } else {
        throw error;
      }
    }
    
    console.log('');
    console.log('========================================');
    console.log('✓ Fake AIR data seeding completed!');
    console.log('========================================');
    console.log('');
    console.log('Summary:');
    console.log(`- Students created: ${createdStudents.length}`);
    console.log(`- Submissions created: ~${submissions.length}`);
    console.log(`- Test Series used: ${testSeries.title}`);
    console.log('');
    console.log('The AIR rankings will be automatically calculated when you access the analytics endpoint.');
    console.log('Student credentials: email as shown above, password: Test@12345');
    console.log('');
    console.log('To clean up this fake data, run:');
    console.log('  db.users.deleteMany({ "meta.fakeData": true })');
    console.log('  db.submissions.deleteMany({ "meta.fakeData": true })');
    console.log('');

  } catch (error) {
    console.error('Error seeding fake AIR data:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the seeder
seedFakeAIRData();
