const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Models
const User = require('./models/User');
const Transaction = require('./models/Transaction');
const { categorizeTransaction } = require('./gemini');

const app = express();
const SECRET_KEY = process.env.JWT_SECRET || 'YOUR_SECRET_KEY';

// Middleware
app.use(express.json());
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// --- Database Connection ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB Connected Successfully!"))
    .catch(err => console.log("❌ MongoDB Connection Error:", err));

// --- Auth Middleware ---
const authenticate = (req, res, next) => {
    const token = req.headers.authorization;
    if (!token) return res.status(401).json({ error: "Access Denied" });
    try {
        const verified = jwt.verify(token, SECRET_KEY);
        req.user = verified;
        next();
    } catch (err) {
        res.status(400).json({ error: "Invalid Token" });
    }
};

// --- Auth Routes ---
app.post('/api/auth/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({ username, password: hashedPassword });
        res.json({ message: "User created!" });
    } catch (err) {
        res.status(400).json({ error: "Username already exists" });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(400).json({ error: "Invalid credentials" });
    }
    const token = jwt.sign({ userId: user._id }, SECRET_KEY, { expiresIn: '7d' });
    res.json({ token, username });
});


// 1. Get ONLY the logged-in user's transactions
app.get('/api/transactions', authenticate, async (req, res) => {
    try {
        const transactions = await Transaction.find({ userId: req.user.userId }).sort({ date: -1 });
        res.json(transactions);
    } catch (err) { res.status(500).json(err); }
});

// 2. Add a transaction linked to the user
app.post('/api/transactions', authenticate, async (req, res) => {
    const { title, amount } = req.body;
    try {
        const category = await categorizeTransaction(title);
        const newTransaction = new Transaction({
            userId: req.user.userId,
            title,
            amount: Number(amount),
            category
        });
        await newTransaction.save();
        res.json(newTransaction);
    } catch (err) { res.status(500).json(err); }
});

// 3. Delete a transaction (Checks ownership)
app.delete('/api/transactions/:id', authenticate, async (req, res) => {
    try {
        const deleted = await Transaction.findOneAndDelete({
            _id: req.params.id,
            userId: req.user.userId
        });
        if (!deleted) return res.status(404).json({ error: "Not found or unauthorized" });
        res.json({ message: "Deleted successfully" });
    } catch (err) { res.status(500).json(err); }
});

// --- Start Server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));