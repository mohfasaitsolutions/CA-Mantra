require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const path = require('path');

// Import models
const modelsPath = path.join(__dirname, '../src/models');
const Blog = require(path.join(modelsPath, 'Blog'));
const Cart = require(path.join(modelsPath, 'Cart'));
const Contact = require(path.join(modelsPath, 'Contact'));
const Enrollment = require(path.join(modelsPath, 'Enrollment'));
const Invoice = require(path.join(modelsPath, 'Invoice'));
const Payment = require(path.join(modelsPath, 'Payment'));
const Plan = require(path.join(modelsPath, 'Plan'));
const Purchase = require(path.join(modelsPath, 'Purchase'));
const Schedule = require(path.join(modelsPath, 'Schedule'));
const StudyMaterial = require(path.join(modelsPath, 'StudyMaterial'));
const Submission = require(path.join(modelsPath, 'Submission'));
const SupportTicket = require(path.join(modelsPath, 'SupportTicket'));
const TestSeries = require(path.join(modelsPath, 'TestSeries'));
const User = require(path.join(modelsPath, 'User'));

// Import Roles
const ROLES = require(path.join(__dirname, '../src/constants/roles'));

const flushData = async () => {
    try {
        console.log('Connecting to database...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to database.');

        // 1. Clear content collections
        console.log('Clearing content collections...');
        await Promise.all([
            Blog.deleteMany({}),
            Cart.deleteMany({}),
            Contact.deleteMany({}),
            Enrollment.deleteMany({}),
            Invoice.deleteMany({}),
            Payment.deleteMany({}),
            Plan.deleteMany({}),
            Purchase.deleteMany({}),
            Schedule.deleteMany({}),
            StudyMaterial.deleteMany({}),
            Submission.deleteMany({}),
            SupportTicket.deleteMany({}),
            TestSeries.deleteMany({})
        ]);
        console.log('Content collections cleared.');

        // 2. Filter Users
        console.log('Filtering users...');
        // Keep ADMIN, EVALUATOR, STUDENTS
        // Delete users who match NONE of these roles
        const rolesToKeep = [ROLES.ADMIN, ROLES.EVALUATOR, ROLES.STUDENTS];

        // Safety check: Ensure we have roles defined
        if (!ROLES.ADMIN || !ROLES.EVALUATOR || !ROLES.STUDENTS) {
            throw new Error('Roles are undefined! Aborting user deletion.');
        }

        const deleteResult = await User.deleteMany({
            role: { $nin: rolesToKeep }
        });

        console.log(`Deleted ${deleteResult.deletedCount} users who were not ADMIN, EVALUATOR, or STUDENT.`);
        console.log('User filtering complete.');

        console.log('Database flush complete.');
    } catch (error) {
        console.error('Error flushing database:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from database.');
        process.exit(0);
    }
};

flushData();
