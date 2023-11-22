const mongoose = require('mongoose');

const paymentSlipSchema = new mongoose.Schema({
    slipImage: {
        type: String, // เปลี่ยนเป็น String สำหรับ URL ของ Firebase Storage
        required: true,
        },
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        },
    createdAt: {
        type: Date,
        default: Date.now,
        },
});

const PaymentSlip = mongoose.model('PaymentSlip', paymentSlipSchema);

module.exports = PaymentSlip;
