const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  items: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
      },
      buyQuantity: {
        type: Number,
        default: 1,
      },
    },
  ],
  shippingMethod: {
    type: String,
    enum: ['standard', 'EMS'],
    default: 'standard', 
  },
});


cartSchema.methods.getProductIds = function () {
  return this.items.map(item => item.product._id);
};



const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;
