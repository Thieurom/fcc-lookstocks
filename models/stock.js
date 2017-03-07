const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const stockSchema = new Schema({
    company: String,
    symbol: String
});


module.exports = mongoose.model('Stock', stockSchema);