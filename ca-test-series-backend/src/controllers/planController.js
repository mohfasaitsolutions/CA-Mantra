const Plan = require('../models/Plan');
const TestSeries = require('../models/TestSeries');
const { body, validationResult } = require('express-validator');

// Validation rules for creating a plan
const createPlanValidation = [
    body('name')
        .trim()
        .isLength({ min: 1, max: 200 })
        .withMessage('Plan name is required and must be between 1-200 characters'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Description must not exceed 1000 characters'),
    body('thumbnailUrl')
        .optional()
        .trim()
        .isURL()
        .withMessage('Thumbnail must be a valid URL'),
    body('displayOrder')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Display order must be a non-negative integer')
];

// Validation rules for updating a plan
const updatePlanValidation = [
    body('name')
        .optional()
        .trim()
        .isLength({ min: 1, max: 200 })
        .withMessage('Plan name must be between 1-200 characters'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Description must not exceed 1000 characters'),
    body('thumbnailUrl')
        .optional()
        .trim()
        .isURL()
        .withMessage('Thumbnail must be a valid URL'),
    body('displayOrder')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Display order must be a non-negative integer'),
    body('isActive')
        .optional()
        .isBoolean()
        .withMessage('isActive must be a boolean')
];

// Create a new plan (Admin only)
const createPlan = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, description, thumbnailUrl, displayOrder, testSeriesItems } = req.body;

        // Check if plan with same name exists
        const existingPlan = await Plan.findOne({ name: name.trim() });
        if (existingPlan) {
            return res.status(400).json({ error: 'A plan with this name already exists' });
        }

        // Validate testSeriesItems if provided
        const validatedItems = [];
        if (testSeriesItems && Array.isArray(testSeriesItems)) {
            for (const item of testSeriesItems) {
                if (!item.testSeriesId || item.price === undefined) continue;

                // Verify test series exists
                const ts = await TestSeries.findById(item.testSeriesId);
                if (ts) {
                    validatedItems.push({
                        testSeriesId: item.testSeriesId,
                        price: parseFloat(item.price),
                        addedAt: new Date()
                    });
                }
            }
        }

        const plan = new Plan({
            name: name.trim(),
            description: description?.trim(),
            thumbnailUrl: thumbnailUrl?.trim(),
            displayOrder: displayOrder || 0,
            testSeriesItems: validatedItems,
            createdBy: req.user.id
        });

        await plan.save();

        res.status(201).json({
            message: 'Plan created successfully',
            plan: { ...plan.toObject(), id: plan._id }
        });
    } catch (error) {
        console.error('Error creating plan:', error);
        res.status(500).json({ error: 'Failed to create plan' });
    }
};

// Get all plans (Public - for filtering)
const getPlans = async (req, res) => {
    try {
        const { includeInactive } = req.query;

        const filter = {};
        if (!includeInactive || includeInactive !== 'true') {
            filter.isActive = true;
        }

        const plans = await Plan.find(filter)
            .sort({ displayOrder: 1, name: 1 })
            .select('-createdBy -__v')
            .populate({
                path: 'testSeriesItems.testSeriesId',
                select: 'title price isActive thumbnailUrl caLevel status'
            });

        const plansWithCount = plans.map((plan) => {
            const planObj = plan.toObject();
            // Filter only active test series for count
            const activeItems = planObj.testSeriesItems?.filter(
                item => item.testSeriesId && item.testSeriesId.isActive &&
                    (!item.testSeriesId.status || item.testSeriesId.status === 'PUBLISHED')
            ) || [];
            return {
                ...planObj,
                id: plan._id,
                testSeriesCount: activeItems.length
            };
        });

        res.json({ plans: plansWithCount });
    } catch (error) {
        console.error('Error fetching plans:', error);
        res.status(500).json({ error: 'Failed to fetch plans' });
    }
};

// Get single plan by ID
const getPlanById = async (req, res) => {
    try {
        const { planId } = req.params;

        const plan = await Plan.findById(planId)
            .select('-__v')
            .populate({
                path: 'testSeriesItems.testSeriesId',
                select: 'title description price isActive thumbnailUrl caLevel totalTests status'
            });

        if (!plan) {
            return res.status(404).json({ error: 'Plan not found' });
        }

        const planObj = plan.toObject();

        // Transform testSeriesItems to have testSeries object
        const transformedItems = (planObj.testSeriesItems || []).map(item => ({
            testSeriesId: item.testSeriesId?._id?.toString() || item.testSeriesId?.toString(),
            price: item.price,
            addedAt: item.addedAt,
            testSeries: item.testSeriesId ? {
                _id: item.testSeriesId._id?.toString() || item.testSeriesId.toString(),
                title: item.testSeriesId.title,
                description: item.testSeriesId.description,
                price: item.testSeriesId.price,
                isActive: item.testSeriesId.isActive,
                thumbnailUrl: item.testSeriesId.thumbnailUrl,
                caLevel: item.testSeriesId.caLevel,
                totalTests: item.testSeriesId.totalTests
            } : null
        })).filter(item => item.testSeries &&
            (!item.testSeries.status || item.testSeries.status === 'PUBLISHED'));

        const activeItems = transformedItems.filter(item =>
            item.testSeries?.isActive &&
            (!item.testSeries?.status || item.testSeries.status === 'PUBLISHED')
        );

        res.json({
            plan: {
                ...planObj,
                id: plan._id,
                testSeriesItems: transformedItems,
                testSeriesCount: activeItems.length
            }
        });
    } catch (error) {
        console.error('Error fetching plan:', error);
        res.status(500).json({ error: 'Failed to fetch plan' });
    }
};

// Update a plan (Admin only)
const updatePlan = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { planId } = req.params;
        const { name, description, thumbnailUrl, displayOrder, isActive } = req.body;

        const plan = await Plan.findById(planId);
        if (!plan) {
            return res.status(404).json({ error: 'Plan not found' });
        }

        // Check for duplicate name if name is being changed
        if (name && name.trim() !== plan.name) {
            const existingPlan = await Plan.findOne({
                name: name.trim(),
                _id: { $ne: planId }
            });
            if (existingPlan) {
                return res.status(400).json({ error: 'A plan with this name already exists' });
            }
            plan.name = name.trim();
        }

        if (description !== undefined) plan.description = description?.trim();
        if (thumbnailUrl !== undefined) plan.thumbnailUrl = thumbnailUrl?.trim();
        if (displayOrder !== undefined) plan.displayOrder = displayOrder;
        if (isActive !== undefined) plan.isActive = isActive;

        await plan.save();

        res.json({
            message: 'Plan updated successfully',
            plan: {
                ...plan.toObject(),
                id: plan._id
            }
        });
    } catch (error) {
        console.error('Error updating plan:', error);
        res.status(500).json({ error: 'Failed to update plan' });
    }
};

// Delete a plan (Admin only - soft delete)
const deletePlan = async (req, res) => {
    try {
        const { planId } = req.params;

        const plan = await Plan.findById(planId);
        if (!plan) {
            return res.status(404).json({ error: 'Plan not found' });
        }

        // Check if any test series are using this plan
        const testSeriesCount = await TestSeries.countDocuments({ planId: plan._id });
        if (testSeriesCount > 0) {
            // Remove plan reference from all test series
            await TestSeries.updateMany(
                { planId: plan._id },
                { $unset: { planId: 1 } }
            );
        }

        // Hard delete the plan
        await Plan.findByIdAndDelete(planId);

        res.json({
            message: 'Plan deleted successfully',
            testSeriesUpdated: testSeriesCount
        });
    } catch (error) {
        console.error('Error deleting plan:', error);
        res.status(500).json({ error: 'Failed to delete plan' });
    }
};

// Toggle plan active status (Admin only)
const togglePlanStatus = async (req, res) => {
    try {
        const { planId } = req.params;

        const plan = await Plan.findById(planId);
        if (!plan) {
            return res.status(404).json({ error: 'Plan not found' });
        }

        plan.isActive = !plan.isActive;
        await plan.save();

        res.json({
            message: `Plan ${plan.isActive ? 'activated' : 'deactivated'} successfully`,
            plan: {
                ...plan.toObject(),
                id: plan._id
            }
        });
    } catch (error) {
        console.error('Error toggling plan status:', error);
        res.status(500).json({ error: 'Failed to toggle plan status' });
    }
};

// Add test series to plan (Admin only)
const addTestSeriesToPlan = async (req, res) => {
    try {
        const { planId } = req.params;
        const { testSeriesId, price } = req.body;

        if (!testSeriesId || price === undefined) {
            return res.status(400).json({ error: 'testSeriesId and price are required' });
        }

        if (price < 0) {
            return res.status(400).json({ error: 'Price must be non-negative' });
        }

        const plan = await Plan.findById(planId);
        if (!plan) {
            return res.status(404).json({ error: 'Plan not found' });
        }

        const testSeries = await TestSeries.findById(testSeriesId);
        if (!testSeries) {
            return res.status(404).json({ error: 'Test series not found' });
        }

        // Check if already in plan
        const exists = plan.testSeriesItems.some(
            item => item.testSeriesId.toString() === testSeriesId
        );
        if (exists) {
            return res.status(400).json({ error: 'Test series already in this plan' });
        }

        plan.testSeriesItems.push({
            testSeriesId,
            price: parseFloat(price),
            addedAt: new Date()
        });

        await plan.save();

        res.json({
            message: 'Test series added to plan',
            plan: { ...plan.toObject(), id: plan._id }
        });
    } catch (error) {
        console.error('Error adding test series to plan:', error);
        res.status(500).json({ error: 'Failed to add test series to plan' });
    }
};

// Remove test series from plan (Admin only)
const removeTestSeriesFromPlan = async (req, res) => {
    try {
        const { planId, testSeriesId } = req.params;

        const plan = await Plan.findById(planId);
        if (!plan) {
            return res.status(404).json({ error: 'Plan not found' });
        }

        const initialLength = plan.testSeriesItems.length;
        plan.testSeriesItems = plan.testSeriesItems.filter(
            item => item.testSeriesId.toString() !== testSeriesId
        );

        if (plan.testSeriesItems.length === initialLength) {
            return res.status(404).json({ error: 'Test series not found in this plan' });
        }

        await plan.save();

        res.json({
            message: 'Test series removed from plan',
            plan: { ...plan.toObject(), id: plan._id }
        });
    } catch (error) {
        console.error('Error removing test series from plan:', error);
        res.status(500).json({ error: 'Failed to remove test series from plan' });
    }
};

// Update test series price in plan (Admin only)
const updateTestSeriesPrice = async (req, res) => {
    try {
        const { planId, testSeriesId } = req.params;
        const { price } = req.body;

        if (price === undefined || price < 0) {
            return res.status(400).json({ error: 'Valid price is required' });
        }

        const plan = await Plan.findById(planId);
        if (!plan) {
            return res.status(404).json({ error: 'Plan not found' });
        }

        const item = plan.testSeriesItems.find(
            item => item.testSeriesId.toString() === testSeriesId
        );
        if (!item) {
            return res.status(404).json({ error: 'Test series not found in this plan' });
        }

        item.price = parseFloat(price);
        await plan.save();

        res.json({
            message: 'Price updated',
            plan: { ...plan.toObject(), id: plan._id }
        });
    } catch (error) {
        console.error('Error updating test series price:', error);
        res.status(500).json({ error: 'Failed to update price' });
    }
};

module.exports = {
    createPlan,
    getPlans,
    getPlanById,
    updatePlan,
    deletePlan,
    togglePlanStatus,
    addTestSeriesToPlan,
    removeTestSeriesFromPlan,
    updateTestSeriesPrice,
    createPlanValidation,
    updatePlanValidation
};
