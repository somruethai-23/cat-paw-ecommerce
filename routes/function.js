const Order = require('../models/order');


// check if they are login or not
function isLogin(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    req.flash('error', 'Please login first');
    res.redirect('/user/login');
}

// check if Admin or not
function isAdmin(req, res, next) {
    if (req.user.isAdmin === true) {
        return next();
    }
    req.flash('error', 'You are not an admin.');
    res.redirect('/user/login');
}


// function to calculate monthly earnings
async function calculateMonthlyEarnings() {
    try {
        // get the current year and month
        const currentDate = new Date();
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        // set the start and end of the month
        const startOfMonth = new Date(year, month, 1);
        const endOfMonth = new Date(year, month + 1, 0);

        // query orders created in the current month
        const monthlyOrders = await Order.find({
            createdAt: {
                $gte: startOfMonth,
                $lte: endOfMonth,
            },
        });

        // calculate monthly earnings
        const monthlyEarnings = monthlyOrders.reduce((total, order) => total + order.totalAmount, 0);

        // return an array with a single element (the total earnings for the month)
        return [monthlyEarnings];
    } catch (error) {
        console.error('Something error in monthly earning:', error);
        throw error;
    }
};

// function to calculate annual earnings
async function calculateAnnualEarnings() {
    try {
        const currentYear = new Date().getFullYear();

        const startOfYear = new Date(currentYear, 0, 1);
        const endOfYear = new Date(currentYear, 12, 0);

        const annualOrders = await Order.find({
            createdAt: {
                $gte: startOfYear,
                $lte: endOfYear,
            },
        });

        // calculate annual earnings
        const annualEarnings = annualOrders.reduce((total, order) => total + order.totalAmount, 0);


        return annualEarnings;
    } catch (error) {
        console.error('Something error in annual earning:', error);
        throw error;
    }
};

// function to count pending orders
async function countPendingOrders() {
    try {
        const pendingOrderCount = await Order.countDocuments({ status: 'pending' });
        return pendingOrderCount;
    } catch (error) {
        console.error('Error counting pending orders:', error);
        throw error;
    }
};


async function getMostSellingProducts() {
    try {
        // aggregate products based on quantity sold
        const productData = await Order.aggregate([
            { $unwind: '$products' },
            {
                $group: {
                    _id: '$products.product',
                    totalQuantity: { $sum: '$products.quantity' },
                },
            },
            {
                $lookup: {
                    from: 'products',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'productData',
                },
            },
            {
                $unwind: '$productData',
            },
            {
                $project: {
                    productName: '$productData.name',
                    totalQuantity: 1,
                },
            },
        ]);

        // sort total quantity in descending order
        const sortedProductData = productData.sort((a, b) => b.totalQuantity - a.totalQuantity);

        // only want top 5 most selling products
        const topProducts = sortedProductData.slice(0, 5);

        // sum the total quantity of products
        const totalQuantity = sortedProductData.reduce((sum, product) => sum + product.totalQuantity, 0);

        // calculate the percentage for each product because the pie chart would look better as percentage
        const chartData = topProducts.map(product => ({
            label: product.productName,
            data: (product.totalQuantity / totalQuantity) * 100,
        }));

        // calculate the percentage for "Others" as only top 5 shown and the other item or product would be in this "Others" category
        const othersPercentage = 100 - chartData.reduce((sum, product) => sum + product.data, 0);
        chartData.push({ label: 'Others', data: othersPercentage });

        return chartData;
    } catch (error) {
        console.error('Error getting most selling products data:', error);
        return [];
    }
};



async function calculateMonthlyEarningsChart() {
    try {
        const currentYear = new Date().getFullYear();

        // array to store monthly earnings
        const monthlyEarningsChart = [];

        // loop through each month in the year
        for (let month = 0; month < 12; month++) {
            const startOfMonth = new Date(currentYear, month, 1);
            const endOfMonth = new Date(currentYear, month + 1, 0);

            const monthlyOrders = await Order.find({
                createdAt: {
                    $gte: startOfMonth,
                    $lte: endOfMonth,
                },
            });

            // calculate monthly earnings
            const monthlyEarnings = monthlyOrders.reduce((total, order) => total + order.totalAmount, 0);

            // push monthly earnings to the array
            monthlyEarningsChart.push(monthlyEarnings);
        }

        return monthlyEarningsChart;
    } catch (error) {
        console.error('Something error in monthly earnings for chart:', error);
        throw error; 
    }
}


module.exports = {
    isLogin,
    isAdmin,
    calculateMonthlyEarnings,
    calculateAnnualEarnings,
    countPendingOrders,
    getMostSellingProducts,
    calculateMonthlyEarningsChart
};

