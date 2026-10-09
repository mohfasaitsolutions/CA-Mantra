require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const path = require('path');
const crypto = require('crypto');

// Import models
const modelsPath = path.join(__dirname, '../src/models');
const User = require(path.join(modelsPath, 'User'));
const TestSeries = require(path.join(modelsPath, 'TestSeries'));
const Enrollment = require(path.join(modelsPath, 'Enrollment'));
const Payment = require(path.join(modelsPath, 'Payment'));
const ROLES = require(path.join(__dirname, '../src/constants/roles'));

const seedPurchase = async () => {
    try {
        console.log('Connecting to database...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected.');

        // 1. Find a Student
        console.log('Finding a student...');
        let student = await User.findOne({ role: ROLES.STUDENTS });

        if (!student) {
            console.log('No student found. Creating one...');
            const salt = await require('bcrypt').genSalt(10);
            const hashedPassword = await require('bcrypt').hash('password123', salt);
            student = await User.create({
                fullName: "Test Student",
                email: "student@test.com",
                password: hashedPassword,
                role: ROLES.STUDENTS,
                caLevel: "FOUNDATION"
            });
            console.log('Created student: student@test.com / password123');
        } else {
            console.log(`Found student: ${student.email}`);
        }

        // 2. Find a Test Series
        console.log('Finding a Test Series...');
        const testSeries = await TestSeries.findOne({ caLevel: "FOUNDATION" });
        if (!testSeries) {
            throw new Error('No Foundation Test Series found. Did you run seedData.js?');
        }
        console.log(`Found Test Series: ${testSeries.title}`);

        // 3. Create Payment Record (Simulating a successful payment)
        const razorpayOrderId = `order_${crypto.randomBytes(8).toString('hex')}`;
        const razorpayPaymentId = `pay_${crypto.randomBytes(8).toString('hex')}`;
        const razorpaySignature = crypto.randomBytes(16).toString('hex');

        console.log('Creating Payment...');
        const payment = await Payment.create({
            studentId: student._id,
            testSeriesId: testSeries._id,
            razorpayOrderId: razorpayOrderId,
            razorpayPaymentId: razorpayPaymentId,
            razorpaySignature: razorpaySignature,
            amount: testSeries.price,
            currency: "INR",
            status: "CAPTURED",
            paymentMethod: "card",
            isVerified: true,
            verifiedAt: new Date(),
            razorpayResponse: {
                id: razorpayPaymentId,
                entity: "payment",
                amount: testSeries.price * 100,
                currency: "INR",
                status: "captured",
                order_id: razorpayOrderId,
                method: "card"
            }
        });

        // 4. Create Enrollment Record
        console.log('Creating Enrollment...');
        const enrollment = await Enrollment.create({
            studentId: student._id,
            testSeriesId: testSeries._id,
            payment: {
                provider: "RAZORPAY",
                status: "SUCCESS",
                amount: testSeries.price,
                orderId: razorpayOrderId,
                paymentId: razorpayPaymentId,
                transactionId: razorpayPaymentId, // Generic usage
                method: "card",
                capturedAt: new Date()
            },
            isActive: true
        });

        // Link payment to enrollment
        payment.enrollmentId = enrollment._id;
        await payment.save();

        console.log('Purchase seeded successfully!');
        console.log('-----------------------------------');
        console.log(`Student: ${student.email}`);
        console.log(`Series: ${testSeries.title} (ID: ${testSeries._id})`);
        console.log(`Enrollment ID: ${enrollment._id}`);
        console.log('-----------------------------------');

    } catch (error) {
        console.error('Seeding purchase failed:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

seedPurchase();
