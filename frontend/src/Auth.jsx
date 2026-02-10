import React, { useState } from 'react';
import axios from 'axios';

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
            const res = await axios.post(`${API_URL}${endpoint}`, form);

            if (isLogin) {
                // CRITICAL: Save the raw token and username
                localStorage.setItem('token', res.data.token);
                localStorage.setItem('username', res.data.username);
                setUser(res.data.username);
            } else {
                alert("Registration successful! Please login.");
                setIsLogin(true);
            }
        } catch (err) {
            setError(err.response?.data?.message || "Authentication failed");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
            <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 w-full max-w-md shadow-2xl">
                <h2 className="text-3xl font-bold text-white mb-6 text-center">
                    {isLogin ? 'Welcome Back' : 'Create Account'}
                </h2>

                {error && <p className="bg-red-900/50 border border-red-500 text-red-200 p-3 rounded-lg mb-4 text-sm">{error}</p>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {!isLogin && (
                        <input
                            className="w-full bg-slate-950 border border-slate-800 p-3 rounded-lg text-white outline-none focus:border-blue-500"
                            placeholder="Username"
                            onChange={(e) => setForm({ ...form, username: e.target.value })}
                            required
                        />
                    )}
                    <input
                        type="email"
                        className="w-full bg-slate-950 border border-slate-800 p-3 rounded-lg text-white outline-none focus:border-blue-500"
                        placeholder="Email Address"
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        required
                    />
                    <input
                        type="password"
                        className="w-full bg-slate-950 border border-slate-800 p-3 rounded-lg text-white outline-none focus:border-blue-500"
                        placeholder="Password"
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        required
                    />
                    <button className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-lg font-bold transition-all shadow-lg shadow-blue-900/20">
                        {isLogin ? 'Sign In' : 'Register'}
                    </button>
                </form>

                <button
                    onClick={() => setIsLogin(!isLogin)}
                    className="w-full mt-6 text-slate-400 hover:text-white text-sm transition-colors"
                >
                    {isLogin ? "Don't have an account? Register" : "Already have an account? Login"}
                </button>
            </div>
        </div>
    );
};

export default Auth;