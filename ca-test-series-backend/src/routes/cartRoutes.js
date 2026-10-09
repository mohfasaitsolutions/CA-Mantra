const express = require('express');
const router = express.Router();
const { auth, requireRoles, ROLES } = require('../middleware/auth');
const {
    getCart,
    addToCart,
    removeFromCart,
    clearCart,
    getCartCount
} = require('../controllers/cartController');

// All cart routes require authentication and student role
router.use(auth());
router.use(requireRoles(ROLES.STUDENTS));

// Get cart
router.get('/', getCart);

// Get cart count (for header badge)
router.get('/count', getCartCount);

// Add item to cart
router.post('/add', addToCart);

// Remove item from cart
router.delete('/:testSeriesId', removeFromCart);

// Clear entire cart
router.delete('/', clearCart);

module.exports = router;
