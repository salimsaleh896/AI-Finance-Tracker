import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Auth from './Auth';
import { PlusCircle, Wallet, PieChart as PieIcon, LogOut } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS = ['#60a5fa', '#34d399', '#f87171', '#fbbf24', '#a78bfa', '#f472b6'];
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const App = () => {
  const [user, setUser] = useState(localStorage.getItem('username'));
  const [transactions, setTransactions] = useState([]);
  const [form, setForm] = useState({ title: '', amount: '' });
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');

  // --- SYNCED: Sends RAW token to match new Backend Middleware ---
  const fetchTransactions = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await axios.get(`${API_URL}/api/transactions`, {
        headers: { Authorization: token } // No "Bearer" prefix
      });
      setTransactions(res.data);
    } catch (err) {
      console.error("Fetch error:", err.response?.data?.message || err.message);
    }
  };

  useEffect(() => {
    if (user) fetchTransactions();
  }, [user]);

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.amount) return;

    setLoading(true);
    const token = localStorage.getItem('token');

    try {
      await axios.post(`${API_URL}/api/transactions`, form, {
        headers: { Authorization: token } // No "Bearer" prefix
      });
      setForm({ title: '', amount: '' });
      await fetchTransactions();
    } catch (err) {
      console.error("Submit error:", err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteTransaction = async (id) => {
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`${API_URL}/api/transactions/${id}`, {
        headers: { Authorization: token } // No "Bearer" prefix
      });
      fetchTransactions();
    } catch (err) {
      console.error("Delete error:", err.message);
    }
  };

  // Logic for Charts
  const filteredTransactions = transactions.filter(t => {
    if (filter === 'all') return true;
    const tDate = new Date(t.date);
    const now = new Date();
    if (filter === 'week') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(now.getDate() - 7);
      return tDate >= oneWeekAgo;
    }
    if (filter === 'month') {
      return tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear();
    }
    return true;
  });

  const chartData = filteredTransactions.reduce((acc, curr) => {
    const found = acc.find(item => item.name === curr.category);
    if (found) { found.value += Number(curr.amount); }
    else { acc.push({ name: curr.category, value: Number(curr.amount) }); }
    return acc;
  }, []);

  if (!user) return <Auth setUser={setUser} />;

  return (
    <div className="min-h-screen p-8 max-w-6xl mx-auto">
      <header className="flex justify-between items-center mb-12">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
          AI Finance Tracker
        </h1>
        <div className="flex items-center gap-6">
          <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 text-right">
            <p className="text-slate-400 text-[10px] uppercase">User: {user}</p>
            <p className="text-2xl font-mono text-white">
              Ksh {filteredTransactions.reduce((acc, curr) => acc + Number(curr.amount), 0).toLocaleString()}
            </p>
          </div>
          <button onClick={handleLogout} className="p-2 hover:bg-slate-800 rounded-full text-slate-400">
            <LogOut size={24} />
          </button>
        </div>
      </header>

      <div className="grid lg:grid-cols-3 gap-8">
        <section className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
          <h2 className="flex items-center gap-2 mb-6 text-xl font-semibold text-white">
            <PlusCircle className="text-blue-400" /> Add Transaction
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              className="w-full bg-slate-950 border border-slate-800 p-3 rounded-lg text-white"
              placeholder="Title (e.g. Cinema)"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
            <input
              type="number"
              className="w-full bg-slate-950 border border-slate-800 p-3 rounded-lg text-white"
              placeholder="Amount"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              required
            />
            <button disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded-lg font-bold text-white">
              {loading ? 'AI Categorizing...' : 'Track with AI'}
            </button>
          </form>
        </section>

        <section className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
          <h2 className="flex items-center gap-2 mb-6 text-xl font-semibold text-white">
            <PieIcon className="text-purple-400" /> AI Insights
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData} innerRadius={60} outerRadius={80} dataKey="value">
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="bg-slate-900 p-6 rounded-2xl border border-slate-800 max-h-[500px] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-white">Activity</h2>
            <div className="flex gap-1">
              {['all', 'week', 'month'].map((f) => (
                <button key={f} onClick={() => setFilter(f)} className={`px-2 py-1 text-[10px] rounded ${filter === f ? 'bg-blue-600' : 'bg-slate-800 text-slate-400'}`}>
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            {filteredTransactions.map((t) => (
              <div key={t._id} className="flex justify-between items-center bg-slate-950 p-4 rounded-xl">
                <div>
                  <p className="text-white">{t.title}</p>
                  <span className="text-[10px] text-blue-300 uppercase">{t.category}</span>
                </div>
                <div className="flex items-center gap-4">
                  <p className="text-red-400">-Ksh {Number(t.amount).toLocaleString()}</p>
                  <button onClick={() => deleteTransaction(t._id)} className="text-slate-700 hover:text-red-500">×</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default App;