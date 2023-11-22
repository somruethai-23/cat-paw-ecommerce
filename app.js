const express = require('express');
const app = express();
const session = require('express-session');
const path = require('path');
require('dotenv').config();
const mongoose = require('mongoose');
const ejs = require('ejs');
const expressLayouts = require('express-ejs-layouts');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const flash = require('connect-flash');
const MongoStore = require('connect-mongo')(session);


// routes
const productRoutes = require('./routes/Product');
const userRoutes = require('./routes/User');
const cartRoutes = require('./routes/Cart');
const orderRoutes = require('./routes/Order');
const adminRoutes = require('./routes/Admin');

// model
const Product = require('./models/product');
const User = require('./models/user');
const Cart = require('./models/cart');
const Order = require('./models/order');
const PaymentSlip = require('./models/paymentSlip');

// for safety
const port = process.env.PORT_NUM;
const mongoDB = process.env.MONGO_URL;

// connect to mongoDB for store all of data 
mongoose.connect(mongoDB, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  connectTimeoutMS: 30000,
})
.then(() => {
    console.log('Connected to MongoDB');
})
.catch((err) => {
    console.error('Connection to MongoDB failed:', err);
});


app.use(express.static(__dirname + '/public'));
app.use(express.static('public'));
app.use(expressLayouts);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  res.locals.layout = false;
  next();
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout extractScripts', true);
app.set('layout', 'layout/layout');

// setting up passport used for user
passport.use(new LocalStrategy(
    async (username, password, done) => {
        try {
          const user = await User.findOne({ username: username });
          if (!user) {
            return done(null, false, { message: 'Incorrect username.' });
          }
          if (!user.validPassword(password)) {
            return done(null, false, { message: 'Incorrect password.' });
          }
          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    ));
    
passport.serializeUser((user, done) => {
    done(null, user.id);
});
  
passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  });

app.use(session({
    secret: process.env.SEC_KEY,
    resave: false,
    saveUninitialized: true,
    store: new MongoStore({ mongooseConnection: mongoose.connection }),
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// can access in any template
app.use((req,res,next)=>{
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next();
})


app.use(express.static('uploads'));


// use routes
app.use('/product', productRoutes);
app.use('/user', userRoutes);
app.use('/cart', cartRoutes);
app.use('/order', orderRoutes);
app.use('/admin', adminRoutes)


// index page
app.get('/', async (req, res) => {

  const sortBy = req.query.sort || 'createdAt-asc'; 
  const categoryFilter = req.query.categoryFilter || 'categories';
  const searchQuery = req.query.search;

  let query = Product.find();
  if (sortBy === 'createdAt-asc') {
      query = query.sort({ createdAt: -1 });
  } else if (sortBy === 'createdAt-desc') {
      query = query.sort({ createdAt: 1 });
  } else if (sortBy === 'price-asc') {
      query = query.sort({ price: 1 });
  } else if (sortBy === 'price-desc') {
      query = query.sort({ price: -1 });
  }
    

    if (categoryFilter !== 'categories') {
        query = query.where({ category: categoryFilter});
    }

    if (searchQuery !== undefined) {
      query = query.where({ name: new RegExp(searchQuery, 'i') });
  }
    try {
        const products = await query.exec();
        res.render('index', { products, sortBy, categoryFilter, search: searchQuery, req:req, user: req.user});
    } catch (err) {
        console.error(err);
        req.flash('error', 'Something went wrong.');
        res.redirect('/');
    }
});

app.get('/aboutus', (req,res)=> {
  res.render('aboutus', { req:req});
})

app.get('/contact', (req,res)=> {
  res.render('contact', {req:req});
})

app.listen(port, () => {
    console.log(`app listening on port ${port}`)
});