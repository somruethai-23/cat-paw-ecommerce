const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    products: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Products',
            },
            quantity: {
                type: Number,
                required: true,
            },
        },
    ],
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    totalAmount: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        enum: ['pending', 'shipped', 'delivered', 'cancelled'],
        default: 'pending',
    },
    shippingAddress: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Addresses',
    },
    shipping: {
        type: {
            brand: {
                type: String,
                enum: ['Kerry', 'J&T', 'Flash'],
                required: true,
            },
            trackingNumber: {
                type: String,
            },
        },
    },
    shippingMethod: {
        type: String,
        enum: ['standard', 'EMS'],
        default: 'standard',
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    paymentSlips: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'PaymentSlip',
        },
    ],
    updatedAt: {
        type: Date,
        default: Date.now,
    },
    cancelReason: {
        type: String,
    }

}); 

orderSchema.pre('findOneAndUpdate', function (next) {
    this._update.updatedAt = new Date();
    next();
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
