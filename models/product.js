const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    image: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    quantity: {
        type: Number,
        default: 0,
        required: true,
    },
    category: {
        type: String,
        enum: ['toys', 'furniture', 'food', 'litter'],
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    productStatus: {
        type: String,
        enum: ['active', 'inactive', 'onhold' ],
        default: 'active',
        required: true,
    }
});

const Product = mongoose.model('Products', productSchema);

module.exports.saveProduct=function(model,data){
    model.save(data)
};

module.exports = Product;
