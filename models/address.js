const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    fullname: { 
        type: String,
        required: true 
    },
    address: {
        type: String,
        required: true
    },
    postalCode: { 
        type: Number, 
        required: true 
    },
    country: { 
        type: String, 
        required: true 
    },
    phoneNumber: { 
        type: String, 
        required: true 
    },
});


const Address = mongoose.model('Address', addressSchema);

module.exports = Address;