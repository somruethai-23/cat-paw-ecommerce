const express = require('express');
const router = express.Router();
const { isLogin, isAdmin } = require('./function');
const admin = require('firebase-admin');
require('dotenv').config();
// storage (Using firebase)
const multer = require('multer');
const serviceAccountPath = require('./pawsshop-4c3c9-firebase-adminsdk-7f3ow-906a565b74.json')

const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.STORAGE_BUCKET,
});

// Firebase Admin SDK 
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.STORAGE_BUCKET,
});

const bucket = admin.storage().bucket();

// import models
const Cart = require('../models/cart');
const Product = require('../models/product'); 
const Address = require('../models/address');
const Order = require('../models/order');
const PaymentSlip = require('../models/paymentSlip'); 


// payment page after shopping cart page
router.get('/payment', isLogin, async (req, res) => {
  try {
    const cart = req.session.cart || [];
    const shippingMethod = req.query.shippingMethod;
    const address = await Address.findOne({ user: req.user._id }).exec();
    const totalAmount = calculateTotal(cart);

    // user must already input address inorder to make an order
    if (!address) {
      req.flash('error', 'Please fill in your address first.')
      return res.redirect('/user/profile');
    }

    res.render('carts/payment', { cart, req: req, address, totalAmount, shippingMethod });
  } catch (error) {
    console.error('Error in /payment route:', error);
    req.flash('error', 'Error processing payment.');
    res.redirect('/');
  }
});

  
router.post('/payment', isLogin, async (req, res) => {
  try {
    const shippingMethod = req.body.shippingMethod;
    const address = await Address.findOne({ user: req.user._id }).exec();
    const cart = req.session.cart || [];

    // use calculateTotal function to get totalAmount
    let totalAmount = calculateTotal(cart);

    // create an array to store order items
    const orderItems = cart.map(item => {
      return {
        product: item.product._id,
        quantity: item.buyQuantity,
      };
    });

    // create a new order to save in database
    const newOrder = new Order({
      products: orderItems,
      user: req.user,
      totalAmount: totalAmount,
      status: 'pending',
      shippingAddress: address._id,
      shippingMethod: shippingMethod, 
    });

    // update stock quantities for each product in the order
    for (const item of cart) {
      const product = await Product.findById(item.product._id).exec();
      if (product) {
        product.quantity -= item.buyQuantity;
        await product.save();
      }
    }

    // save to database
    const savedOrder = await newOrder.save();

    req.user.orders.push(savedOrder);
    await req.user.save();

    // clear the cart session after finish saving
    req.session.cart = [];

    // get the updated list of orders for the user
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate('products.product');

    // calculate estimated delivery date for each order after status "shipped" (function is below)
    const estimatedDates = orders.map(order => EstimatedDeliveryDate(order));

    req.flash('success', 'Order placed successfully.');
    res.render('users/ordertrack', { req: req, orders, estimatedDates });
  } catch (error) {
    console.error('Error saving order:', error);
    req.flash('error', 'Error placing the order.');
    res.redirect('/');
  }
});
  
  
  // + product
  router.post('/plus/:productId', async (req, res) => {
    try {
      const productId = req.params.productId;
  
      const product = await Product.findById(productId).lean();
  
      if (!product) {
        console.error('Product not found');
        return res.redirect('/');
      }
  
      const cart = req.session.cart || [];
      
      // check if the product is already in the cart
      const existingCartItem = cart.find(item => item.product._id === productId);
      
      if(existingCartItem) {
        if (existingCartItem.buyQuantity < product.quantity ) {
          // If the product is already in the cart, + the buyQuantity
          existingCartItem.buyQuantity += 1;
        } else {
          req.flash('error', 'you reach the product quantity limit.');
        }
      }
  
      req.session.cart = cart;
      res.render('carts/shoppingcart', { req: req, cart });
    } catch (err) {
      req.flash('error', err);
      res.redirect('/');
    }
  });
  
  // - product
  router.post('/subtract/:productId', async (req, res) => {
    try {
      const productId = req.params.productId;
  
      const product = await Product.findById(productId).lean();
  
      if (!product) {
        console.error('Product not found');
        return res.redirect('/');
      }
  
      const cart = req.session.cart || [];
      
      // check if the product is already in the cart
      const existingCartItem = cart.find(item => item.product._id === productId);
  
      if (existingCartItem) {
        // if the product is already in the cart, - the buyQuantity by 1
        if (existingCartItem.buyQuantity > 1) {
          existingCartItem.buyQuantity -= 1;
        } else {
          // if buyQuantity is 1, remove the item from the cart
          const itemIndex = cart.indexOf(existingCartItem);
          if (itemIndex !== -1) {
            cart.splice(itemIndex, 1);
          }
        }
      }
  
      req.session.cart = cart;
      res.render('carts/shoppingcart', { req: req, cart });
    } catch (err) {
      req.flash('error', err);
      res.redirect('/');
    }
  });
  

router.get('/pay/:orderId', isLogin, async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const order = await Order.findOne({ _id: orderId, user: req.user._id, status: 'pending' }).exec();

    if (!order) {
      req.flash('error', 'Order not found');
      return res.redirect('/');
    }

    const shippingMethod = order.shippingMethod;
    const totalAmount = order.totalAmount;

    res.render('carts/qrcode', { req: req, order, shippingMethod, totalAmount });
  } catch (err) {
    console.error('Error retrieving order for payment:', err);
    req.flash('error', 'Error retrieving order for payment.');
    res.redirect('/');
  }
});




// ------------------------------------------------------------------- QRCode Page ------------------------------------------

// UPLOAD SLIP
const upload = multer({ dest: 'temp/' });

router.post('/upload', isLogin, upload.single('slipImage'), async (req, res) => {
  const slipImage = req.file;

  if (!slipImage) {
    req.flash('error', 'You need to fill all requirements');
    return res.redirect(req.get('referer'));
  }

  try {
    const orderId = req.query.orderId;

    const order = await Order.findById(orderId);

    if (!order) {
      req.flash('error', 'Order not found');
      return res.redirect('/');
    }

    // setting firebase filename
    const fileName = `payment-slips/${order._id}/${slipImage.originalname}`;

    // upload to firebase storage
    await bucket.upload(slipImage.path, {
      destination: fileName,
      metadata: {
        contentType: slipImage.mimetype,
      },
    });

    // url of access to firebase storage that we store picture in it
    const url = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
    const newPaymentSlip = new PaymentSlip({
      slipImage: url,
      order: order,
    });

    await newPaymentSlip.save();
    order.paymentSlips.push(newPaymentSlip._id);
    await order.save();

    req.flash('success', 'Upload slip image successful, it will take time for admin to approve.');
    res.redirect('/');
  } catch (error) {
    console.error('Error uploading slip image:', error);
    req.flash('error', 'Something went wrong');
    res.redirect('/');
  }
});

router.get('/ordertrack', isLogin, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate('products.product');

    // use function estimatedDates I created below
    const estimatedDates = orders.map(order => EstimatedDeliveryDate(order));

    // Update stock quantities for each order
    for (const order of orders) {
      await updateStock(order);
    }

    res.render('users/ordertrack', { req: req, orders, estimatedDates });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Something went wrong while fetching order data.');
    res.redirect('/user/login');
  }
});



// --------------------------------------function needed for cart.js------------------------------------------------

// Calculate the total amount based on the cart items and shipping method
function calculateTotal(cart) {
  let total = 0;

  for (const item of cart) {
    total += item.buyQuantity * item.product.price;
  }

  return total; 
};


function EstimatedDeliveryDate(order) {
  const currentDate = new Date();

  // if the order is shipped
  if (order.status === 'shipped') {
      // use the date when the order status was changed to 'shipped' as started
      const shippedDate = new Date(order.updatedAt);

      if (order.shippingMethod === 'standard') {
          // if shippingMethod was standard it will take 5-8 day so add 5 
          const estimatedDeliveryDate = new Date(shippedDate);
          estimatedDeliveryDate.setDate(shippedDate.getDate() + 5);
          return estimatedDeliveryDate.toDateString();
      } else if (order.shippingMethod === 'EMS') {
        // if shippingMethod was EMS it will take at least 2 day so add 2 
          const estimatedDeliveryDate = new Date(shippedDate);
          estimatedDeliveryDate.setDate(shippedDate.getDate() + 2);
          return estimatedDeliveryDate.toDateString();
      }
  } else {
      // If the order is not shipped, return a message or handle accordingly
      return 'Order not shipped yet.';
  }
};

/// function to update stock 
async function updateStock(order) {
  // loop through each product in the order model and update the stock
  for (const orderItem of order.products) {
    const productId = orderItem.product._id;
    const quantitySold = orderItem.quantity;

    const product = await Product.findById(productId);

    // check if the product exists and has enough stock
    if (product && product.quantity >= quantitySold) {
      // subtract the sold quantity from the stock
      product.quantity -= quantitySold;

      // save to database
      await product.save();
    }
  }
};



module.exports = router;
