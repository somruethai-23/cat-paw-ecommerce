const express = require('express');
const multer = require('multer');
const router = express.Router();
const path = require('path');
const passport = require('passport');
const bcrypt = require('bcrypt');
const LocalStrategy = require('passport-local').Strategy;
const countryjs = require('countryjs');
// import models
const User = require('../models/user');
const Address = require('../models/address');
const Order = require('../models/order');


router.get('/register', (req,res)=>{
    res.render('users/register', { req:req });
});

router.post('/register', async (req,res)=>{
    const { username, email, password, confirmpass } = req.body;

    const hashedPassword = bcrypt.hashSync(password, 10);

    try {
        // check if username or email already exist
        const existingUser = await User.findOne({ $or: [{username}, {email}] });

        if (existingUser) {
            req.flash('error', 'The username or email already existed.');
            return res.redirect('/user/register');
        }

        // check if password and confirmpass is matched
        if (password !== confirmpass) {
            req.flash('error', 'Password and confirm password do not match');
            return res.redirect('/user/register');
        }

        // create new user and save
        const user = new User({
            username: req.body.username,
            email: req.body.email,
            password: hashedPassword,
        });
        await user.save();
        req.flash('success', 'register successful!');
        res.redirect('/user/login');
    } catch (err) {
        console.error(err);
        req.flash('error', 'Something went wrong!');
        res.redirect('/user/register');
    }
});

router.get('/login', (req,res)=>{
    res.render('users/login', { req:req });
});


router.post('/login', passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/user/login', 
    failureFlash: true
}), (req, res) => {
    if (req.isAuthenticated()) {
        res.render('index', { req: req });
    } else {
        req.flash('error', 'Login failed. Please try again.');
        res.redirect('/user/login');
    }
});

// logout
router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/user/login');
});


// change password
router.get('/changepassword', async (req, res) => {
    try{
        if (!req.isAuthenticated()) {
            req.flash('error', 'Please login first');
            res.redirect('/user/login');
        } else {
            const user = await User.findOne({ _id: req.user._id });
            if (!user) {
                req.flash('error', 'User not found');
                return res.redirect('/user/login');
            }

            res.render('users/changepassword', {req:req, user: user});
        }
    } catch (err) {
        console.log(err);
        req.flash('error', 'Something went wrong. Please Try again.');
        res.redirect('/user/changepassword');
    }
});

router.post('/changepassword', async (req, res) => {
    try {
        const { usernamechange ,oldPassword, newPassword, confirmNewPassword } = req.body;

        if (!req.isAuthenticated()) {
            req.flash('error', 'Please login first.');
            return res.redirect('/user/login');
        }

        const user = await User.findOne({ _id: req.user._id });

        if (!user) {
            req.flash('error', 'User not found.');
            return res.redirect('/user/changepassword');
        }    

        const passwordMatch = await bcrypt.compare(oldPassword, user.password);

        if (!passwordMatch && newPassword !== confirmNewPassword) {
            req.flash('error', 'Old password is incorrect and new password does not match.')
            return res.render('users/changepassword', { req: req, user: user });
        } else if (!passwordMatch) {
            req.flash('error', 'Old password is incorrect.');
            return res.render('users/changepassword', { req: req, user: user });
        } else if (newPassword !== confirmNewPassword) {
            req.flash('error', 'The new password does not match. Please try again.');
            return res.render('users/changepassword', { req: req, user: user });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;

        await user.save();
        req.flash('success', 'Password successfully changed.');
        res.redirect('/user/profile');
    } catch (err) {
        console.error(err);
        req.flash('error', 'Something went wrong. Please try again.');
        res.redirect('/user/changepassword');
    }
});


router.get('/profile', async (req, res) => {
    if (!req.isAuthenticated()) {
        req.flash('error', 'Please login first');
        res.redirect('/user/login');
    } else {
        try {
            const address = await Address.findOne({ user: req.user._id });

            res.render('users/profile', { req: req, user: req.user, address: address});
        } catch (err) {
            console.log(err);
            req.flash('error', 'Error fetching address');
            res.redirect('/user/profile');
        }
    }
});

router.get('/profile-edit', async(req, res) => {
    if (!req.isAuthenticated()) {
        req.flash('error', 'Please login first');
        res.redirect('/user/login');
    } else {
        try {
            const countriesData = countryjs.all();
            const countries = countriesData.map(country => country.name);  
            const address = await Address.findOne({ user: req.user._id});

            res.render('users/profile-edit', { req: req, countries: countries, user: req.user, address: address  });
        } catch (err) {
            console.log(err);
            req.flash('error', 'Error fetching address');
            res.redirect('/user/profile-edit');
        }
    }
});

// save address for delivery
router.post('/profile', (req, res) => {
    if (!req.isAuthenticated()) {
        req.flash('error', 'Please login first');
        res.redirect('/user/login');
    } else {
        const {
            fullname,
            address,
            postalCode,
            country,
            phoneNumber
        } = req.body;

        const selectedCountryCode = req.body.country;
        const selectedCountry = country;

        if (!req.body.editMode) {

        const newAddress = new Address({
            user: req.user._id,
            fullname,
            address,
            postalCode,
            country: selectedCountry,
            phoneNumber
        });

        newAddress.save()
            .then(() => {
                req.flash('success', 'Address added successfully');
                res.redirect('/user/profile');
            })
            .catch(err => {
                console.log(err);
                req.flash('error', 'Error adding address');
                res.redirect('/user/profile');
            });
        }
    }
});


// profile update
router.post('/profile/update', async (req, res) => {
    if (!req.isAuthenticated()) {
        req.flash('error', 'Please login first');
        res.redirect('/user/login');
    } else {
        const {
            fullname,
            address,
            postalCode,
            country,
            phoneNumber
        } = req.body;

        const selectedCountryCode = req.body.country;
        const selectedCountry = country;

        if (!req.body.editMode) {
            try {
                let updatedAddress = await Address.findOneAndUpdate(
                    { user: req.user._id, fullname },
                    {
                        address,
                        postalCode,
                        country: selectedCountry,
                        phoneNumber
                    },
                    { upsert: true, new: true }
                );

                if (updatedAddress) {
                    req.flash('success', 'Address updated successfully');
                } else {
                    req.flash('success', 'Address added successfully');
                }
                res.redirect('/user/profile');
            } catch (err) {
                console.log(err);
                req.flash('error', 'Error updating address');
                res.redirect('/user/profile');
            }
        }
    }
});


module.exports = router;