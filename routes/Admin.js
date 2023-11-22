const express = require('express');
const router = express.Router();
const { isLogin, isAdmin, calculateMonthlyEarnings, calculateAnnualEarnings, countPendingOrders, calculateMonthlyEarningsChart ,getMostSellingProducts } = require('./function');
const Product = require('../models/product'); 
const Address = require('../models/address');
const Order = require('../models/order');
const PaymentSlip = require('../models/paymentSlip'); 
const User = require('../models/user');


router.get('/dashboard', isLogin, isAdmin, async (req, res) => {
    try {
        // from function.js
        const monthlyEarnings = await calculateMonthlyEarnings();
        const annualEarnings = await calculateAnnualEarnings();
        const pendingOrderCount = await countPendingOrders();
        const mostSelling = await getMostSellingProducts();
        const monthlyEarningsChart = await calculateMonthlyEarningsChart();

        res.render('admins/dashboard', {
            req: req,
            monthlyEarningsChart,
            monthlyEarnings,
            annualEarnings,
            pendingOrderCount,
            mostSelling,
            layout: false,
        });
    } catch (error) {
        console.error('Error rendering dashboard:', error);
        res.redirect('/admin/dashboard');
    }
});


router.get('/ordermanagement', isLogin, isAdmin, async (req, res) => {
    try {
        const statusFilter = req.query.status;
        const searchQuery = req.query.search;

        let users = [];

        users = await User.find({}).populate('orders');

        if (statusFilter && statusFilter !== 'all') {
            users = users.map(user => {
                user.orders = user.orders.filter(order => order.status === statusFilter);
                return user;
            });
        }

        if (searchQuery) {
            const regex = new RegExp(searchQuery, 'i');
            users = users.filter(user =>
                user.orders.some(order => regex.test(order._id) || regex.test(user._id))
            );
        }

        users = users.map(user => {
            user.orders = user.orders.sort((a, b) => b.createdAt - a.createdAt);
            return user;
        });

        res.render('admins/ordermanage', { users , req:req});
    } catch (err) {
        console.error(err);
        req.flash('error', 'Something went wrong.');
        res.redirect('/user/login');
    }
});


router.get('/editorder/:orderId', isLogin, isAdmin, async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const order = await Order.findOne({ _id: orderId })
        .populate('user')
        .populate({
            path: 'products.product', 
            model: 'Products'
        })
        .populate('paymentSlips');

        if (!order) {
            req.flash('error', 'Order not found.');
            return res.redirect('/user/login');
        }

        res.render('admins/orderedit', { req: req, order });
    } catch (err) {
        console.error(err);
        req.flash('error', 'Something went wrong while fetching data.');
        res.redirect('/user/login');
    }
});

router.post('/editorder/:orderId', isLogin, isAdmin, async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const order = await Order.findOne({ _id: orderId }).populate('user').populate('paymentSlips');

        if (!order) {
            req.flash('error', 'Order not found.');
            return res.redirect('/user/login');
        }

        order.shipping = order.shipping || {};

        order.shipping.brand = req.body.shipping;
        order.shipping.trackingNumber = req.body.trackingNumber;
        order.status = req.body.orderStatus;

        if (req.body.orderStatus === 'cancelled') {
            order.cancelReason = req.body.cancellationReason;
        }

        await order.save();

        req.flash('success', 'Order updated successfully.');
        res.redirect('/admin/ordermanagement');
    } catch (err) {
        console.error(err);
        req.flash('error', 'Something went wrong while updating the order.');
        res.redirect('/user/login');
    }
});


module.exports = router;