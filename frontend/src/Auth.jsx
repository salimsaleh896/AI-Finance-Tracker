import React, { useState } from 'react';
import axios from 'axios';
import { Lock, User, Mail, ArrowRight } from 'lucide-react';

// NEW: Use environment variable for production, fallback to localhost for development
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Auth = ({ setUser }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [form, setForm] = useState({ username: '', email: '', password: '' });
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';

        try {
            // UPDATED: Using the dynamic API_URL
            const res = await axios.post(`${API_URL}${endpoint}`, form);
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('username', res.data.username);
            setUser(res.data.username);
        } catch (err) {
            setError(err.response?.data?.message || 'Something went wrong');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
            <div className="w-full max-w-md bg-slate-900 rounded-3xl border border-slate-800 p-8 shadow-2xl">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-white mb-2">
                        {isLogin ? 'Welcome Back' : 'Create Account'}
                    </h2>
                    <p className="text-slate-400 text-sm">AI-Powered Finance Tracking</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {!isLogin && (
                        <div className="relative">
                            <User className="absolute left-3 top-3.5 text-slate-500" size={20} />
                            <input
                                type="text"
                                placeholder="Username"
                                className="w-full bg-slate-950 border border-slate-800 p-3 pl-11 rounded-xl text-white outline-none focus:border-blue-500 transition-all"
                                onChange={(e) => setForm({ ...form, username: e.target.value })}
                                required
                            />
                        </div>
                    )}
                    <div className="relative">
                        <Mail className="absolute left-3 top-3.5 text-slate-500" size={20} />
                        <input
                            type="email"
                            placeholder="Email Address"
                            className="w-full bg-slate-950 border border-slate-800 p-3 pl-11 rounded-xl text-white outline-none focus:border-blue-500 transition-all"
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            required
                        />
                    </div>
                    <div className="relative">
                        <Lock className="absolute left-3 top-3.5 text-slate-500" size={20} />
                        <input
                            type="password"
                            placeholder="Password"
                            className="w-full bg-slate-950 border border-slate-800 p-3 pl-11 rounded-xl text-white outline-none focus:border-blue-500 transition-all"
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                            required
                        />
                    </div>
                    <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 group">
                        {isLogin ? 'Sign In' : 'Get Started'}
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </form>

                <p className="mt-8 text-center text-slate-500 text-sm">
                    {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
                    <button
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-blue-400 font-semibold hover:underline"
                    >
                        {isLogin ? 'Sign Up' : 'Log In'}
                    </button>
                </p>
            </div>
        </div>
    );
};

export default Auth;