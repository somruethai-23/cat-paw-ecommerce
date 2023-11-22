const express = require('express');
const router = express.Router();
const { isLogin, isAdmin} = require('./function');
const Product = require('../models/product');
const Cart = require('../models/cart');
const mongoose = require('mongoose');



// add prodcut
router.get('/add', isLogin, isAdmin, (req, res) => {
        res.render('products/addproduct', { req: req });
});

router.post('/insert', isLogin, isAdmin ,async (req,res)=>{
    let data = new Product({
        name: req.body.name,
        price: req.body.price,
        image: req.body.image,
        description: req.body.description,
        quantity: req.body.quantity,
        category: req.body.category,
    });

    try {
        await data.save();
        req.flash('success', 'Add product successful.');
        res.redirect('/product/manage');
    } catch (err) {
        req.flash('error', 'Something went wrong. The product did not saved.')
        res.redirect('/product/add')
    }
});

// edit
router.get('/edit/:id', isLogin, isAdmin, async (req,res)=>{

        try {
            const productId = req.params.id;
            const product = await Product.findById(productId).exec();
            const productStatusOptions = ['active', 'inactive', 'onhold'];
            
            if (!product) {
                req.flash('error', 'Product not found.')
            }

            req.flash('succeess', 'Successfully saved.')
            res.render('products/editproduct', { product, req:req, productStatusOptions});
        } catch (err) {
            req.flash('error', 'Something went wrong.')
            res.render('products/editproduct', { product, req:req, productStatusOptions});
        }
});

// Update a product
router.post('/update/:id', async (req, res) => {
    try {
        const productId = req.params.id;
        const updatedProductData = req.body; 
        
        const updatedProduct = await Product.findByIdAndUpdate(productId, updatedProductData, { new: true }).exec();

        if (!updatedProduct) {
            req.flash('error', 'Something went wrong in updated the product.')
            return res.redirect(`/product/manage`);
        }
        req.flash('success', 'Save successfully.')
        res.redirect('/product/manage');
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/manage', isLogin, isAdmin,  async (req, res) => {
        const sortBy = req.query.sort || 'createdAt-asc';
        const categoryFilter = req.query.categoryFilter || 'categories';;
        const searchNameQuery = req.query.searchName;
        const searchProductIdQuery = req.query.searchProductId;
        
        let query = Product.find();
    
        if (sortBy === 'createdAt-asc') {
            query = query.sort({ createdAt: -1 });
        } else if (sortBy === 'createdAt-desc') {
            query = query.sort({ createdAt: 1 });
        } else if (sortBy === 'price-asc') {
            query = query.sort({ price: 1 });
        } else if (sortBy === 'price-desc') {
            query = query.sort({ price: -1 });
        } else if (sortBy === 'quantity') {
            query = query.sort({ quantity: 1 });
        }
        
        if (categoryFilter !== 'categories') {
            query = query.where({ category: categoryFilter });
        }
        
        if (searchNameQuery) {
            query = query.or([
                { name: new RegExp(searchNameQuery, 'i') },
            ]);
        }
        if (searchProductIdQuery) {
            query = query.where({ _id: searchProductIdQuery });
        }

        if (searchProductIdQuery && !mongoose.Types.ObjectId.isValid(searchProductIdQuery)) {
            req.flash('error', 'Please put a valid product ID.');
            return res.redirect('/product/manage');
        }

        try {
            const products = await query.exec();

            res.render('products/manage', { products, sortBy, categoryFilter, searchProductId: searchProductIdQuery, searchName: searchNameQuery , req:req});
        } catch (err) {
            console.error('Something went wrong at manage product:', err);
        }
});



//  ---------------------------- SINGLE PAGE -------------------------------------
router.get('/:productId', isLogin,async (req, res) => {
    try {
        const product = await Product.findById(req.params.productId).lean();
        const allProducts = await Product.find();
        const recommendedProducts = getRandomProducts(allProducts, 3);
        res.render('products/singleproduct', { req: req, product: product, recommendedProducts});
    } catch (err) {
        console.error(err);
        req.flash('error', 'Something went wrong.');
        res.redirect('/');
    }
});

// add product into the shopping cart
router.post('/:productId/add-to-cart', async (req, res) => {
    const productId = req.params.productId;

    try {
        // ดึงข้อมูลสินค้าจากฐานข้อมูลโดยใช้ .lean()
        const product = await Product.findById(productId).lean();

        if (!product) {
            req.flash('error', 'Product not found');
            return res.redirect('/');
        }

        // ดึงข้อมูลตะกร้าจาก session
        const cart = req.session.cart || [];

        // ค้นหาสินค้าในตะกร้า
        const existingCartItem = cart.find(item => item.product._id.toString() === productId);

        if (existingCartItem) {
            // ตรวจสอบว่าจำนวนที่ลูกค้ากำลังจะซื้อมีค่าน้อยกว่าหรือเท่ากับจำนวนที่มีในสต็อกหรือไม่
            if (existingCartItem.buyQuantity < product.quantity) {
                // ถ้ามีสินค้าอยู่ในตะกร้าอยู่แล้ว ก็เพิ่ม buyQuantity 1
                existingCartItem.buyQuantity += 1;
            } else {
                req.flash('error', 'The product is out of stock.');
            }
        } else {
            // ตรวจสอบว่าจำนวนที่ลูกค้ากำลังจะซื้อมีค่าน้อยกว่าหรือเท่ากับจำนวนที่มีในสต็อกหรือไม่
            if (1 <= product.quantity) {
                // ถ้าไม่มีสินค้าอยู่ในตะกร้า ก็เพิ่มสินค้าลงในตะกร้า
                cart.push({ product: product, buyQuantity: 1 });
            } else {
                req.flash('error', 'The product is out of stock.');
            }
        }

        // บันทึกตะกร้าใน session
        req.session.cart = cart;

        res.redirect('/');
    } catch (error) {
        req.flash('error', 'Something went wrong.')
        res.redirect('/');
    }
});

// delete all products
router.get('/deleteallproduct', async (req, res) => {
    try {
        const deletedProducts = await Product.deleteMany({}).exec();

        if (deletedProducts.deletedCount > 0) {
            req.flash('success', 'All products have been deleted successfully.');
        } else {
            req.flash('error', 'No products found to delete.');
        }

        res.redirect('/product/manage');
    } catch (err) {
        console.error('Error deleting all products:', err);
        req.flash('error', 'Something went wrong.');
        res.redirect('/product/manage');
    }
});


function getRandomProducts(products, count) {
    const shuffledProducts = [...products].sort(() => 0.5 - Math.random());
    return shuffledProducts.slice(0, count);
}

module.exports = router;

