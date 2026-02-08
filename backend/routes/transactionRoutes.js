const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');

// @route   POST /api/transactions
// @desc    Add a new transaction
const { categorizeTransaction } = require('../gemini'); // Import the AI helper

router.post('/', async (req, res) => {
    try {
        const { title, amount, type, description } = req.body;

        // Call the AI to get a category based on the title
        const aiCategory = await categorizeTransaction(title);

        const newTransaction = new Transaction({
            title,
            amount,
            type,
            description,
            category: aiCategory // Use the AI generated category!
        });

        const savedTransaction = await newTransaction.save();
        res.status(201).json(savedTransaction);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// @route   GET /api/transactions
// @desc    Get all transactions
router.get('/', async (req, res) => {
    try {
        const transactions = await Transaction.find().sort({ date: -1 });
        res.json(transactions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;