import React, { useState } from 'react';
import axios from 'axios';

const Auth = ({ setUser }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [form, setForm] = useState({ username: '', password: '' });
    const [error, setError] = useState('');

    const handleAuth = async (e) => {
        e.preventDefault();
        setError('');
        const endpoint = isLogin ? 'login' : 'register';
        try {
            const res = await axios.post(`http://localhost:5000/api/auth/${endpoint}`, form);
            if (isLogin) {
                localStorage.setItem('token', res.data.token);
                localStorage.setItem('username', res.data.username);
                setUser(res.data.username);
            } else {
                alert("Registration successful! Please login.");
                setIsLogin(true);
            }
        } catch (err) {
            setError(err.response?.data?.error || "Authentication failed");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
            <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 w-full max-w-md shadow-2xl">
                <h2 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                    {isLogin ? 'Welcome Back' : 'Create Account'}
                </h2>
                {error && <p className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg mb-4 text-sm text-center">{error}</p>}
                <form onSubmit={handleAuth} className="space-y-4">
                    <input
                        className="w-full bg-slate-950 border border-slate-800 p-3 rounded-lg outline-none focus:border-blue-500 transition-all text-white"
                        placeholder="Username"
                        onChange={(e) => setForm({ ...form, username: e.target.value })}
                        required
                    />
                    <input
                        type="password"
                        className="w-full bg-slate-950 border border-slate-800 p-3 rounded-lg outline-none focus:border-blue-500 transition-all text-white"
                        placeholder="Password"
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        required
                    />
                    <button className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded-lg font-bold transition-all shadow-lg shadow-blue-900/20 text-white">
                        {isLogin ? 'Login' : 'Sign Up'}
                    </button>
                </form>
                <p className="mt-6 text-center text-slate-400 text-sm">
                    {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
                    <button onClick={() => setIsLogin(!isLogin)} className="text-blue-400 hover:underline">
                        {isLogin ? 'Sign Up' : 'Login'}
                    </button>
                </p>
            </div>
        </div>
    );
};

export default Auth;