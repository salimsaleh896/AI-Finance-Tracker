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
//const SECRET_KEY = process.env.JWT_SECRET || 'YOUR_SECRET_KEY';
// TO THIS (Hardcode it for one minute just to test):
const SECRET_KEY = 'salim_secret_123';
// Middleware
app.use(express.json());
// CORS FIXED: Explicitly allows Vercel and local testing
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
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: "No Token Provided" });

    // This handles: "Bearer <token>" OR just "<token>"
    const token = authHeader.split(' ').pop();

    jwt.verify(token, 'salim_secret_123', (err, user) => {
        if (err) {
            console.error("JWT Verify Error:", err.message); // This shows in Render logs
            return res.status(401).json({ message: "Invalid Token" });
        }
        req.user = user;
        next();
    });
};

// --- Auth Routes ---
app.post('/api/auth/register', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        if (!username || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({ username, email, password: hashedPassword });
        res.json({ message: "User created!", username: user.username });
    } catch (err) {
        console.error("Register Error:", err.message);
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
        console.error("Login Error:", err.message);
        res.status(500).json({ message: "Server Error during login" });
    }
});

// --- Transaction Routes ---
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

    // Log for debugging in Render logs
    console.log(`Attempting to add: ${title} - ${amount} for UserID: ${req.user.userId}`);

    try {
        if (!title || !amount) {
            return res.status(400).json({ message: "Title and amount are required" });
        }

        // 1. Get AI Category
        const category = await categorizeTransaction(title);
        console.log("AI Categorized as:", category);

        // 2. Create Transaction object
        const newTransaction = new Transaction({
            userId: req.user.userId,
            title,
            amount: Number(amount),
            category: category || 'Other'
        });

        // 3. Save to DB
        await newTransaction.save();
        res.json(newTransaction);

    } catch (err) {
        console.error("Detailed Transaction Error:", err.message);
        res.status(400).json({ message: "Transaction failed: " + err.message });
    }
});

app.delete('/api/transactions/:id', authenticate, async (req, res) => {
    try {
        const deleted = await Transaction.findOneAndDelete({
            _id: req.params.id,
            userId: req.user.userId
        });
        if (!deleted) return res.status(404).json({ message: "Transaction not found" });
        res.json({ message: "Deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: "Delete failed" });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));