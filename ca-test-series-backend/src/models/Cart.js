const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
    testSeriesId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TestSeries',
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    addedAt: {
        type: Date,
        default: Date.now
    }
}, { _id: false });

const cartSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
        index: true
    },
    items: [cartItemSchema]
}, { timestamps: true });

// Virtual for total price
cartSchema.virtual('totalPrice').get(function () {
    return this.items.reduce((sum, item) => sum + item.price, 0);
});

// Virtual for item count
cartSchema.virtual('itemCount').get(function () {
    return this.items.length;
});

// Ensure virtuals are included in JSON
cartSchema.set('toJSON', { virtuals: true });
cartSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Cart', cartSchema);
