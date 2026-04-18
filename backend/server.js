const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const User = require('./models/User');
const Transaction = require('./models/Transaction');
const { categorizeTransaction } = require('./gemini');

const app = express();

// 🔑 THE FIX: Prioritize the Render Environment Variable
const SECRET_KEY = process.env.JWT_SECRET || 'salim_secret_123';

app.use(express.json());
app.use(cors());

// Database Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB Connected Successfully!"))
    .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// 🛡️ Middleware: Fixed Handshake Logic
const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;

    // Check if header exists and starts with 'Bearer '
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: "Session Expired" });
    }

    // Extract the token (removing the word 'Bearer ')
    const token = authHeader.split(' ')[1];

    if (!token || token === 'null' || token === 'undefined') {
        return res.status(401).json({ message: "Invalid Session" });
    }

    // Verify using the secret from Render
    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) {
            console.log("JWT Verify Error:", err.message); // This appears in Render Logs
            return res.status(401).json({ message: "Session Expired" });
        }
        req.user = decoded;
        next();
    });
};

// --- AUTH ROUTES ---

app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({ username, email, password: hashedPassword });
        res.json({ message: "Created", username: user.username });
    } catch (e) {
        res.status(400).json({ message: "Registration Error" });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user || !await bcrypt.compare(password, user.password)) {
            return res.status(400).json({ message: "Wrong credentials" });
        }

        // Generate Token with the same SECRET_KEY
        const token = jwt.sign({ userId: user._id }, SECRET_KEY, { expiresIn: '7d' });
        res.json({ token, username: user.username });
    } catch (e) {
        res.status(500).json({ message: "Login Error" });
    }
});

// --- TRANSACTION ROUTES ---

app.get('/api/transactions', authenticate, async (req, res) => {
    try {
        const list = await Transaction.find({ userId: req.user.userId }).sort({ date: -1 });
        res.json(list);
    } catch (e) {
        res.status(500).json({ message: "Fetch Error" });
    }
});

app.post('/api/transactions', authenticate, async (req, res) => {
    try {
        const category = await categorizeTransaction(req.body.title);
        const item = new Transaction({
            ...req.body,
            userId: req.user.userId,
            category: category || 'Other'
        });
        await item.save();
        res.json(item);
    } catch (e) {
        res.status(500).json({ message: "Create Transaction Error" });
    }
});

// Port Handling for Render
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🔐 Using Secret Key: ${SECRET_KEY === 'salim_secret_123' ? 'Fallback' : 'Environment'}`);
});