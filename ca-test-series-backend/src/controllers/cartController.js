const Cart = require('../models/Cart');
const TestSeries = require('../models/TestSeries');
const Enrollment = require('../models/Enrollment');
const User = require('../models/User');

// Get current user's cart
const getCart = async (req, res) => {
    try {
        let cart = await Cart.findOne({ studentId: req.user.id })
            .populate({
                path: 'items.testSeriesId',
                select: 'title description price thumbnailUrl caLevel isActive planId status'
            });

        if (!cart) {
            cart = { items: [], totalPrice: 0, itemCount: 0 };
        }

        // Filter out any items where test series no longer exists or is inactive
        const validItems = cart.items ? cart.items.filter(item =>
            item.testSeriesId && item.testSeriesId.isActive &&
            (!item.testSeriesId.status || item.testSeriesId.status === 'PUBLISHED')
        ) : [];

        res.json({
            cart: {
                items: validItems.map(item => ({
                    testSeriesId: item.testSeriesId._id,
                    testSeries: item.testSeriesId,
                    price: item.price,
                    addedAt: item.addedAt
                })),
                totalPrice: validItems.reduce((sum, item) => sum + item.price, 0),
                itemCount: validItems.length
            }
        });
    } catch (error) {
        console.error('Error fetching cart:', error);
        res.status(500).json({ error: 'Failed to fetch cart' });
    }
};

// Add item to cart
const addToCart = async (req, res) => {
    try {
        const { testSeriesId, planId } = req.body;

        if (!testSeriesId) {
            return res.status(400).json({ error: 'Test series ID is required' });
        }

        // Check if test series exists and is active
        const testSeries = await TestSeries.findOne({
            _id: testSeriesId,
            $or: [{ status: 'PUBLISHED' }, { status: { $exists: false } }]
        });
        if (!testSeries) {
            return res.status(404).json({ error: 'Test series not found' });
        }
        if (!testSeries.isActive) {
            return res.status(400).json({ error: 'Test series is not available' });
        }

        // Get student details to check CA level
        const student = await User.findById(req.user.id);
        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }

        // Validate CA Level match - students can only add test series for their level or 'ALL' level
        if (testSeries.caLevel !== 'ALL' && testSeries.caLevel !== student.caLevel) {
            return res.status(403).json({
                error: `You cannot add this test series to your cart. This is a ${testSeries.caLevel} level test series, but you are enrolled in ${student.caLevel} level.`,
                studentLevel: student.caLevel,
                testSeriesLevel: testSeries.caLevel
            });
        }

        // Check if already enrolled
        const existingEnrollment = await Enrollment.findOne({
            studentId: req.user.id,
            testSeriesId,
            isActive: true
        });
        if (existingEnrollment) {
            return res.status(400).json({ error: 'You are already enrolled in this test series' });
        }

        // Get or create cart
        let cart = await Cart.findOne({ studentId: req.user.id });
        if (!cart) {
            cart = new Cart({ studentId: req.user.id, items: [] });
        }

        // Check if already in cart
        const existingItem = cart.items.find(
            item => item.testSeriesId.toString() === testSeriesId
        );
        if (existingItem) {
            return res.status(400).json({ error: 'Item already in cart' });
        }

        // Determine price: use plan-specific price if planId provided, else original price
        let itemPrice = testSeries.price;
        if (planId) {
            const Plan = require('../models/Plan');
            const plan = await Plan.findById(planId);
            if (plan) {
                const planItem = plan.testSeriesItems.find(
                    item => item.testSeriesId.toString() === testSeriesId
                );
                if (planItem !== undefined) {
                    itemPrice = planItem.price;
                }
            }
        }

        // Add to cart
        cart.items.push({
            testSeriesId,
            price: itemPrice,
            addedAt: new Date()
        });

        await cart.save();

        res.json({
            message: 'Added to cart',
            cart: {
                itemCount: cart.items.length,
                totalPrice: cart.items.reduce((sum, item) => sum + item.price, 0)
            }
        });
    } catch (error) {
        console.error('Error adding to cart:', error);
        res.status(500).json({ error: 'Failed to add to cart' });
    }
};

// Remove item from cart
const removeFromCart = async (req, res) => {
    try {
        const { testSeriesId } = req.params;

        const cart = await Cart.findOne({ studentId: req.user.id });
        if (!cart) {
            return res.status(404).json({ error: 'Cart not found' });
        }

        const initialLength = cart.items.length;
        cart.items = cart.items.filter(
            item => item.testSeriesId.toString() !== testSeriesId
        );

        if (cart.items.length === initialLength) {
            return res.status(404).json({ error: 'Item not found in cart' });
        }

        await cart.save();

        res.json({
            message: 'Removed from cart',
            cart: {
                itemCount: cart.items.length,
                totalPrice: cart.items.reduce((sum, item) => sum + item.price, 0)
            }
        });
    } catch (error) {
        console.error('Error removing from cart:', error);
        res.status(500).json({ error: 'Failed to remove from cart' });
    }
};

// Clear entire cart
const clearCart = async (req, res) => {
    try {
        const cart = await Cart.findOne({ studentId: req.user.id });
        if (cart) {
            cart.items = [];
            await cart.save();
        }

        res.json({ message: 'Cart cleared' });
    } catch (error) {
        console.error('Error clearing cart:', error);
        res.status(500).json({ error: 'Failed to clear cart' });
    }
};

// Get cart count (lightweight endpoint for header badge)
const getCartCount = async (req, res) => {
    try {
        const cart = await Cart.findOne({ studentId: req.user.id });
        res.json({ count: cart ? cart.items.length : 0 });
    } catch (error) {
        console.error('Error fetching cart count:', error);
        res.status(500).json({ error: 'Failed to fetch cart count' });
    }
};

module.exports = {
    getCart,
    addToCart,
    removeFromCart,
    clearCart,
    getCartCount
};
