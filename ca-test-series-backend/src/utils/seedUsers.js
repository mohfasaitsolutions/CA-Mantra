const User = require('../models/User');
const ROLES = require('../constants/roles');
const SUBJECTS = require('../constants/subjects');

/**
 * Seeds default users (admin, evaluator, student) if they don't exist
 */
async function seedDefaultUsers() {
  try {
    console.log('🌱 Checking and seeding default users...');
    
    // Default Admin User
    const adminEmail = 'admin@camantraa.com';
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (!existingAdmin) {
      await User.create({
        fullName: 'Super Admin',
        email: adminEmail,
        password: 'admin123456',
        caLevel: 'FOUNDATION',
        role: ROLES.ADMIN,
        emailVerified: true,
        mobile: '+91-9876543210',
        mobileVerified: true,
        phone: '+91-9876543210',
        address: 'CA Mantraa Headquarters, Delhi, India',
        dob: new Date('1990-01-01'),
        bio: 'System Administrator for CA Mantraa Platform',
        isActive: true,
        meta: {
          createdBy: 'system',
          isDefaultUser: true
        }
      });
      console.log('✅ Default admin user created: admin@camantraa.com');
    } else {
      console.log('ℹ️  Admin user already exists');
    }

    // Default Evaluator User
    const evaluatorEmail = 'evaluator@camantraa.com';
    const existingEvaluator = await User.findOne({ email: evaluatorEmail });
    if (!existingEvaluator) {
      await User.create({
        fullName: 'Dr. Priya Sharma',
        email: evaluatorEmail,
        password: 'evaluator123456',
        caLevel: 'FINAL',
        role: ROLES.EVALUATOR,
        specializations: [
          'Accounting',
          'Advanced Accounting',
          'Auditing and Ethics',
          'Taxation',
          'Financial Management and Strategic Management'
        ],
        emailVerified: true,
        mobile: '+91-9876543211',
        mobileVerified: true,
        phone: '+91-9876543211',
        address: 'Mumbai, Maharashtra, India',
        dob: new Date('1985-03-15'),
        experience: '10+ years in CA practice and education',
        bio: 'Experienced Chartered Accountant specializing in Accounting, Auditing, and Taxation. Expert evaluator with deep knowledge in multiple CA subjects.',
        isActive: true,
        meta: {
          createdBy: 'system',
          isDefaultUser: true,
          qualifications: ['CA', 'M.Com'],
          instituteRegistrationNumber: 'EVL001'
        }
      });
      console.log('✅ Default evaluator user created: evaluator@camantraa.com');
    } else {
      console.log('ℹ️  Evaluator user already exists');
    }

    // Default Student User
    const studentEmail = 'student@camantraa.com';
    const existingStudent = await User.findOne({ email: studentEmail });
    if (!existingStudent) {
      await User.create({
        fullName: 'Rahul Kumar',
        email: studentEmail,
        password: 'student123456',
        caLevel: 'INTERMEDIATE',
        role: ROLES.STUDENTS,
        emailVerified: true,
        mobile: '+91-9876543212',
        mobileVerified: true,
        phone: '+91-9876543212',
        address: 'Bangalore, Karnataka, India',
        dob: new Date('2000-06-20'),
        bio: 'CA Intermediate student preparing for final exams',
        isActive: true,
        meta: {
          createdBy: 'system',
          isDefaultUser: true,
          enrollmentYear: 2023,
          targetExamDate: '2024-05-01'
        }
      });
      console.log('✅ Default student user created: student@camantraa.com');
    } else {
      console.log('ℹ️  Student user already exists');
    }

    console.log('🎉 Default users seeding completed successfully!\n');
    
    // Log summary of default users
    console.log('📋 Default User Credentials:');
    console.log('👨‍💼 Admin: admin@camantraa.com / admin123456');
    console.log('👩‍🏫 Evaluator: evaluator@camantraa.com / evaluator123456');
    console.log('👨‍🎓 Student: student@camantraa.com / student123456');
    console.log('');
    
  } catch (error) {
    console.error('❌ Error seeding default users:', error);
    throw error;
  }
}

module.exports = { seedDefaultUsers };