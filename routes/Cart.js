const express = require('express');
const router = express.Router();
const Cart = require('../models/cart'); 
const Product = require('../models/product'); 
const Address = require('../models/address');
const Order = require('../models/order');
const { isLogin } = require('./function');


router.get('/shopping', isLogin, (req,res)=>{
  const cart = req.session.cart || [];
    res.render('carts/shoppingcart', { cart , req:req});
})


router.post('/add/:productId', async (req, res) => {
  const productId = req.params.productId;

  try {
      const product = await Product.findById(productId).lean();

      if (!product) {
          console.error('Product not found');
          return res.redirect('/');
      }

      if (product.quantity > 0) {
          const cart = req.session.cart || [];

          const existingCartItem = cart.find(item => item.product._id.toString() === productId);

          if (existingCartItem) {
              if (existingCartItem.buyQuantity < product.quantity) {
                  existingCartItem.buyQuantity += 1;
              } else {
                  req.flash('error', 'The product is out of stock.');
              }
          } else {
              cart.push({ product: product, buyQuantity: 1 });
          }

          req.session.cart = cart;

          req.flash('success', 'The product has been added to cart.')
      } else {
          req.flash('error', 'The product is out of stock.');
      }

      res.redirect('/');
  } catch (error) {
      req.flash('error', 'Something went wrong.')
      res.redirect('/');
  }
});


router.post('/remove/:productId', (req, res) => {
  const productId = req.params.productId;

  const cart = req.session.cart || [];

  const index = cart.findIndex(item => item.product._id == productId);

  if (index >= 0) {
    cart.splice(index, 1);
    req.session.cart = cart;
    res.redirect('/cart/shopping');
  } else {
    req.flash('error', 'The product not found.')
  }
});


module.exports = router;