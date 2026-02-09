const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
    // IMPORTANT: This must match what you send in server.js
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    amount: { type: Number, required: true },
    category: { type: String, default: 'Other' },
    date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Transaction', TransactionSchema);