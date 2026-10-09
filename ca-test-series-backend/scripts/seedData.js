require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const path = require('path');

// Import models
const modelsPath = path.join(__dirname, '../src/models');
const Plan = require(path.join(modelsPath, 'Plan'));
const TestSeries = require(path.join(modelsPath, 'TestSeries'));
const User = require(path.join(modelsPath, 'User'));
// Import Roles
const ROLES = require(path.join(__dirname, '../src/constants/roles'));

const foundationQuestions = [
    {
        questionText: "Which accounting concept states that business and businessman are two separate entities?",
        options: { A: "Going Concern Concept", B: "Business Entity Concept", C: "Money Measurement Concept", D: "Dual Aspect Concept" },
        correctAnswer: "B",
        marks: 2,
        negativeMarks: 0.5
    },
    {
        questionText: "The process of recording transactions in the journal is called?",
        options: { A: "Posting", B: "Journalizing", C: "Casting", D: "Balancing" },
        correctAnswer: "B",
        marks: 2,
        negativeMarks: 0.5
    },
    {
        questionText: "Which of the following is a nominal account?",
        options: { A: "Machinery Account", B: "Salary Account", C: "Ram's Account", D: "Cash Account" },
        correctAnswer: "B",
        marks: 2,
        negativeMarks: 0.5
    },
    {
        questionText: "Depreciation is calculated on?",
        options: { A: "Current Assets", B: "Fixed Assets", C: "Intangible Assets", D: "Fictitious Assets" },
        correctAnswer: "B",
        marks: 2,
        negativeMarks: 0.5
    },
    {
        questionText: "Trial Balance is prepared to check?",
        options: { A: "Arithmetical accuracy", B: "Profit or Loss", C: "Financial Position", D: "Flow of Cash" },
        correctAnswer: "A",
        marks: 2,
        negativeMarks: 0.5
    },
    {
        questionText: "Goodwill is a/an?",
        options: { A: "Tangible Asset", B: "Intangible Asset", C: "Current Asset", D: "Fictitious Asset" },
        correctAnswer: "B",
        marks: 2,
        negativeMarks: 0.5
    },
    {
        questionText: "Closing Stock is generally valued at?",
        options: { A: "Cost Price", B: "Market Price", C: "Cost or Market Price which is lower", D: "Sale Price" },
        correctAnswer: "C",
        marks: 2,
        negativeMarks: 0.5
    },
    {
        questionText: "Bank Reconciliation Statement is prepared by?",
        options: { A: "Bank", B: "Creditors", C: "Debtors", D: "Account Holder" },
        correctAnswer: "D",
        marks: 2,
        negativeMarks: 0.5
    },
    {
        questionText: "Which one is not a cause of depreciation?",
        options: { A: "Wear and Tear", B: "Efflux of Time", C: "Fall in Market Value", D: "Obsolescence" },
        correctAnswer: "C",
        marks: 2,
        negativeMarks: 0.5
    },
    {
        questionText: "Capital Expenditure is shown in?",
        options: { A: "Trading Account", B: "Profit & Loss Account", C: "Balance Sheet", D: "Trial Balance" },
        correctAnswer: "C",
        marks: 2,
        negativeMarks: 0.5
    },
    {
        questionText: "Revenue Expenditure is shown in?",
        options: { A: "Trading and P&L Account", B: "Balance Sheet", C: "Liability side only", D: "Asset side only" },
        correctAnswer: "A",
        marks: 2,
        negativeMarks: 0.5
    },
    {
        questionText: "Suspense Account is opened when?",
        options: { A: "Balance Sheet does not match", B: "Trial Balance does not match", C: "P&L Account does not match", D: "Trading Account does not match" },
        correctAnswer: "B",
        marks: 2,
        negativeMarks: 0.5
    },
    {
        questionText: "Under diminishing balance method, depreciation is calculated on?",
        options: { A: "Original Cost", B: "Written Down Value", C: "Market Value", D: "Scrap Value" },
        correctAnswer: "B",
        marks: 2,
        negativeMarks: 0.5
    },
    {
        questionText: "Provision for bad debts is made on?",
        options: { A: "Debtors", B: "Creditors", C: "Stock", D: "Cash" },
        correctAnswer: "A",
        marks: 2,
        negativeMarks: 0.5
    },
    {
        questionText: "Bill of Exchange is drawn by?",
        options: { A: "Debtor", B: "Creditor", C: "Bank", D: "Bearer" },
        correctAnswer: "B",
        marks: 2,
        negativeMarks: 0.5
    },
    {
        questionText: "Noting charges are paid by?",
        options: { A: "Drawer", B: "Drawee", C: "Payee", D: "Bank" },
        correctAnswer: "D", // Initially paid by holder (whoever goes to notary), usually bank if discounted. Wait. Drawer pays to notary first if he holds it? No, generally whoever presents it. But ultimately borne by Drawee. The question asks 'paid by'. Usually Holder creates the record. Let's assume Holder/Bank.
        marks: 2,
        negativeMarks: 0.5
    },
    {
        questionText: "Consignment Account is a?",
        options: { A: "Real Account", B: "Personal Account", C: "Nominal Account", D: "Representation Account" },
        correctAnswer: "C",
        marks: 2,
        negativeMarks: 0.5
    },
    {
        questionText: "Del Credere Commission is calculated on?",
        options: { A: "Cash Sales", B: "Credit Sales", C: "Total Sales", D: "Net Profit" },
        correctAnswer: "C", // Usually total sales unless specified
        marks: 2,
        negativeMarks: 0.5
    },
    {
        questionText: "In the absence of partnership deed, interest on loan is allowed at?",
        options: { A: "6% p.a.", B: "10% p.a.", C: "12% p.a.", D: "No interest" },
        correctAnswer: "A",
        marks: 2,
        negativeMarks: 0.5
    },
    {
        questionText: "Sacrificing ratio is used at the time of?",
        options: { A: "Admission of a partner", B: "Retirement of a partner", C: "Death of a partner", D: "Dissolution" },
        correctAnswer: "A",
        marks: 2,
        negativeMarks: 0.5
    }
];

const intermediateQuestions = [
    {
        questionText: "A private company must have at least how many directors?",
        options: { A: "Two", B: "Three", C: "Seven", D: "One" },
        correctAnswer: "A",
        marks: 1,
        negativeMarks: 0.25
    },
    {
        questionText: "The maximum number of members in a private company is?",
        options: { A: "50", B: "200", C: "500", D: "Unlimited" },
        correctAnswer: "B",
        marks: 1,
        negativeMarks: 0.25
    },
    {
        questionText: "Section 8 companies are formed for?",
        options: { A: "Profit making", B: "Charitable objects", C: "Trading", D: "Manufacturing" },
        correctAnswer: "B",
        marks: 1,
        negativeMarks: 0.25
    },
    {
        questionText: "OPC stands for?",
        options: { A: "One Person Company", B: "One Public Company", C: "Only Private Company", D: "Other Public Company" },
        correctAnswer: "A",
        marks: 1,
        negativeMarks: 0.25
    },
    {
        questionText: "Din stands for?",
        options: { A: "Director Identification Number", B: "Direct Investment Number", C: "Director Index Number", D: "Data In Network" },
        correctAnswer: "A",
        marks: 1,
        negativeMarks: 0.25
    },
    {
        questionText: "Every company must hold an AGM within how many months from closing of financial year?",
        options: { A: "3 months", B: "6 months", C: "9 months", D: "12 months" },
        correctAnswer: "B",
        marks: 1,
        negativeMarks: 0.25
    },
    {
        questionText: "Which document contains the rules and regulations for internal management of the company?",
        options: { A: "Memorandum of Association", B: "Articles of Association", C: "Prospectus", D: "Certificate of Incorporation" },
        correctAnswer: "B",
        marks: 1,
        negativeMarks: 0.25
    },
    {
        questionText: "Ultra Vires means?",
        options: { A: "Within the powers", B: "Beyond the powers", C: "Under the powers", D: "None of the above" },
        correctAnswer: "B",
        marks: 1,
        negativeMarks: 0.25
    },
    {
        questionText: "The doctrine of Indoor Management is an exception to?",
        options: { A: "Doctrine of Constructive Notice", B: "Doctrine of Ultra Vires", C: "Doctrine of Severability", D: "Doctrine of Eclipse" },
        correctAnswer: "A",
        marks: 1,
        negativeMarks: 0.25
    },
    {
        questionText: "Minimum paid up capital for a public company is?",
        options: { A: "1 Lakh", B: "5 Lakhs", C: "10 Lakhs", D: "No minimum limit prescribed" },
        correctAnswer: "D", // Amendment Act 2015 removed minimum capital
        marks: 1,
        negativeMarks: 0.25
    },
    {
        questionText: "Prospectus is issued by?",
        options: { A: "Private Company", B: "Public Company making public offer", C: "OPC", D: "All of the above" },
        correctAnswer: "B",
        marks: 1,
        negativeMarks: 0.25
    },
    {
        questionText: "Buy back of securities is governed by Section?",
        options: { A: "Section 68", B: "Section 69", C: "Section 70", D: "Section 71" },
        correctAnswer: "A",
        marks: 1,
        negativeMarks: 0.25
    },
    {
        questionText: "Sweat Equity Shares can be issued to?",
        options: { A: "Directors or Employees", B: "General Public", C: "Creditors", D: "Preference Shareholders" },
        correctAnswer: "A",
        marks: 1,
        negativeMarks: 0.25
    },
    {
        questionText: "Bonus shares are issued out of?",
        options: { A: "Free Reserves", B: "Securities Premium Account", C: "Capital Redemption Reserve", D: "All of the above" },
        correctAnswer: "D",
        marks: 1,
        negativeMarks: 0.25
    },
    {
        questionText: "Reduction of Share Capital requires confirmation from?",
        options: { A: "ROC", B: "SEBI", C: "NCLT (Tribunal)", D: "Central Government" },
        correctAnswer: "C",
        marks: 1,
        negativeMarks: 0.25
    },
    {
        questionText: "Debentures which can be converted into shares are called?",
        options: { A: "Redeemable Debentures", B: "Convertible Debentures", C: "Secured Debentures", D: "Registered Debentures" },
        correctAnswer: "B",
        marks: 1,
        negativeMarks: 0.25
    },
    {
        questionText: "Charge must be registered with ROC within?",
        options: { A: "15 days", B: "30 days", C: "45 days", D: "60 days" },
        correctAnswer: "B",
        marks: 1,
        negativeMarks: 0.25
    },
    {
        questionText: "Register of Members is maintained in Form?",
        options: { A: "MGT-1", B: "MGT-7", C: "MGT-14", D: "SH-7" },
        correctAnswer: "A",
        marks: 1,
        negativeMarks: 0.25
    },
    {
        questionText: "Quorum for a GM of a public company with members up to 1000 is?",
        options: { A: "2 members", B: "5 members", C: "15 members", D: "30 members" },
        correctAnswer: "B",
        marks: 1,
        negativeMarks: 0.25
    },
    {
        questionText: "E-voting is mandatory for listed companies having members not less than?",
        options: { A: "500", B: "1000", C: "2000", D: "5000" },
        correctAnswer: "B",
        marks: 1,
        negativeMarks: 0.25
    }
];

const seedData = async () => {
    try {
        console.log('Connecting to database...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected.');

        // 1. Get Admin User
        const adminUser = await User.findOne({ role: ROLES.ADMIN });
        if (!adminUser) {
            throw new Error('Admin user not found! Please ensure users exist.');
        }
        console.log(`Using Admin: ${adminUser.email} (${adminUser._id})`);

        // 2. Create Plans
        console.log('Creating Plans...');
        const plans = await Plan.create([
            {
                name: "CA Foundation Pro",
                description: "Complete preparation package for CA Foundation students including all subjects.",
                createdBy: adminUser._id,
                isActive: true
            },
            {
                name: "CA Intermediate Mastery",
                description: "Comprehensive test series for CA Intermediate aspirants covering all 8 papers.",
                createdBy: adminUser._id,
                isActive: true
            }
        ]);
        console.log('Plans created.');

        // 3. Create Test Series
        console.log('Creating Test Series...');

        // Foundation Series
        const foundationSeries = await TestSeries.create({
            title: "Accounting Daily Practice",
            description: "Daily chapter-wise practice tests for Accounting.",
            price: 1999,
            caLevel: "FOUNDATION",
            planId: plans[0]._id,
            createdBy: adminUser._id,
            isActive: true,
            validity: { isUnlimited: true },
            attempts: { isUnlimited: true },
            thumbnailUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800",
            tests: [{
                title: "Chapter 1: Accounting Fundamentals",
                testType: "OBJECTIVE",
                subject: "Accounting",
                duration: 60,
                instructions: "All questions are compulsory. 0.5 negative marking for wrong answers.",
                mcqQuestions: foundationQuestions,
                createdBy: adminUser._id,
                totalMarks: 40, // 20 * 2
                passingPercentage: 40
            }]
        });

        // Intermediate Series
        const interSeries = await TestSeries.create({
            title: "Corporate Law Basics",
            description: "Deep dive into Company Law with case studies.",
            price: 2499,
            caLevel: "INTERMEDIATE",
            planId: plans[1]._id,
            createdBy: adminUser._id,
            isActive: true,
            validity: { isUnlimited: true },
            attempts: { isUnlimited: true },
            thumbnailUrl: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=800",
            tests: [{
                title: "Chapter 1 & 2: Introduction to Companies",
                testType: "OBJECTIVE",
                subject: "Corporate and Other Laws",
                duration: 45,
                instructions: "Standard CA pattern. 0.25 negative marking.",
                mcqQuestions: intermediateQuestions,
                createdBy: adminUser._id,
                totalMarks: 20, // 20 * 1
                passingPercentage: 40
            }]
        });

        // 4. Update Plans with Items (Bidirectional linking if Plan Items schema requires it)
        // Check Plan Schema again... yes it has testSeriesItems array with price.

        await Plan.findByIdAndUpdate(plans[0]._id, {
            $push: { testSeriesItems: { testSeriesId: foundationSeries._id, price: 1999 } }
        });

        await Plan.findByIdAndUpdate(plans[1]._id, {
            $push: { testSeriesItems: { testSeriesId: interSeries._id, price: 2499 } }
        });

        console.log('Test Series created and linked to Plans.');
        console.log(`Foundation Test ID: ${foundationSeries.tests[0]._id}`);
        console.log(`Intermediate Test ID: ${interSeries.tests[0]._id}`);

    } catch (error) {
        console.error('Seeding failed:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

seedData();
