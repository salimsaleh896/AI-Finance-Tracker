const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Models - Ensure these files exist in your /models folder
const User = require('./models/User');
const Transaction = require('./models/Transaction');
const { categorizeTransaction } = require('./gemini');

const app = express();
const SECRET_KEY = 'salim_secret_123'; // Hardcoded for 100% sync

// Middleware
app.use(express.json());
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Database Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB Connected Successfully!"))
    .catch(err => console.log("❌ MongoDB Connection Error:", err));

// Simplified Auth Middleware
const authenticate = (req, res, next) => {
    const token = req.headers.authorization; // Grab the raw string

    if (!token || token === 'null' || token === 'undefined' || token.length < 10) {
        return res.status(401).json({ message: "No Valid Token Provided" });
    }

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) {
            console.error("JWT Verify Error:", err.message);
            return res.status(401).json({ message: "Invalid Token" });
        }
        req.user = decoded; // Contains the userId
        next();
    });
};

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        if (!username || !email || !password) return res.status(400).json({ message: "All fields required" });
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({ username, email, password: hashedPassword });
        res.json({ message: "User created!", username: user.username });
    } catch (err) {
        res.status(400).json({ message: "User or Email already exists" });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({ message: "Invalid email or password" });
        }
        const token = jwt.sign({ userId: user._id }, SECRET_KEY, { expiresIn: '7d' });
        res.json({ token, username: user.username });
    } catch (err) {
        res.status(500).json({ message: "Server Error during login" });
    }
});

// Transaction Routes
app.get('/api/transactions', authenticate, async (req, res) => {
    try {
        const transactions = await Transaction.find({ userId: req.user.userId }).sort({ date: -1 });
        res.json(transactions);
    } catch (err) {
        res.status(500).json({ message: "Error fetching transactions" });
    }
});

app.post('/api/transactions', authenticate, async (req, res) => {
    const { title, amount } = req.body;
    try {
        if (!title || !amount) return res.status(400).json({ message: "Data required" });
        const category = await categorizeTransaction(title);
        const newTransaction = new Transaction({
            userId: req.user.userId,
            title,
            amount: Number(amount),
            category: category || 'Other'
        });
        await newTransaction.save();
        res.json(newTransaction);
    } catch (err) {
        res.status(400).json({ message: "Transaction failed: " + err.message });
    }
});

app.delete('/api/transactions/:id', authenticate, async (req, res) => {
    try {
        await Transaction.findOneAndDelete({ _id: req.params.id, userId: req.user.userId });
        res.json({ message: "Deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: "Delete failed" });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));