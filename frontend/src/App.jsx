import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Auth from './Auth';
import { PlusCircle, Wallet, PieChart as PieIcon, LogOut, Calendar } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS = ['#60a5fa', '#34d399', '#f87171', '#fbbf24', '#a78bfa', '#f472b6'];

// Use environment variable for production, fallback to localhost for development
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const App = () => {
  const [user, setUser] = useState(localStorage.getItem('username'));
  const [transactions, setTransactions] = useState([]);
  const [form, setForm] = useState({ title: '', amount: '' });
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');

  const fetchTransactions = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await axios.get(`${API_URL}/api/transactions`, {
        headers: { Authorization: token }
      });
      setTransactions(res.data);
    } catch (err) { console.error("Fetch error:", err); }
  };

  useEffect(() => { if (user) fetchTransactions(); }, [user]);

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const token = localStorage.getItem('token');
    try {
      await axios.post(`${API_URL}/api/transactions`, form, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setForm({ title: '', amount: '' });
      fetchTransactions();
    } catch (err) { console.error("Submit error:", err); }
    setLoading(false);
  };

  const deleteTransaction = async (id) => {
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`${API_URL}/api/transactions/${id}`, {
        headers: { Authorization: token }
      });
      fetchTransactions();
    } catch (err) { console.error("Delete error:", err); }
  };

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
          <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 text-right shadow-lg">
            <p className="text-slate-400 text-[10px] uppercase tracking-wider">User: {user}</p>
            <p className="text-2xl font-mono text-white">
              Ksh {filteredTransactions.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}
            </p>
          </div>
          <button onClick={handleLogout} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-red-400">
            <LogOut size={24} />
          </button>
        </div>
      </header>

      <div className="grid lg:grid-cols-3 gap-8">
        <section className="bg-slate-900 p-6 rounded-2xl border border-slate-800 h-fit shadow-xl">
          <h2 className="flex items-center gap-2 mb-6 text-xl font-semibold text-white">
            <PlusCircle className="text-blue-400" /> Add Transaction
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              className="w-full bg-slate-950 border border-slate-800 p-3 rounded-lg outline-none focus:border-blue-500 transition-all text-white placeholder:text-slate-600"
              placeholder="Title (e.g. Cinema)"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
            <input
              type="number"
              className="w-full bg-slate-950 border border-slate-800 p-3 rounded-lg outline-none focus:border-blue-500 transition-all text-white placeholder:text-slate-600"
              placeholder="Amount"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              required
            />
            <button disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded-lg font-bold transition-all text-white disabled:opacity-50 shadow-lg shadow-blue-900/20">
              {loading ? 'AI Categorizing...' : 'Track with AI'}
            </button>
          </form>
        </section>

        <section className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
          <h2 className="flex items-center gap-2 mb-6 text-xl font-semibold text-white">
            <PieIcon className="text-purple-400" /> AI Insights
          </h2>
          <div className="h-64">
            {filteredTransactions.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 italic text-sm text-center">
                <PieIcon size={40} className="mb-2 opacity-20" />
                No data for this period
              </div>
            )}
          </div>
        </section>

        <section className="bg-slate-900 p-6 rounded-2xl border border-slate-800 max-h-[500px] overflow-y-auto shadow-xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="flex items-center gap-2 text-xl font-semibold text-white">
              <Wallet className="text-emerald-400" /> Activity
            </h2>
            <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
              {['all', 'week', 'month'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1 text-[10px] uppercase font-bold rounded transition-all ${filter === f ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {filteredTransactions.length > 0 ? filteredTransactions.map((t) => (
              <div key={t._id} className="flex justify-between items-center bg-slate-950 p-4 rounded-xl border border-slate-900 group hover:border-slate-700 transition-all">
                <div>
                  <p className="font-medium text-white">{t.title}</p>
                  <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-blue-300 uppercase font-bold tracking-tighter">
                    {t.category}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <p className="text-red-400 font-mono font-bold">-Ksh {Number(t.amount).toLocaleString()}</p>
                  <button onClick={() => deleteTransaction(t._id)} className="text-slate-700 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 text-xl font-bold">×</button>
                </div>
              </div>
            )) : (
              <p className="text-center text-slate-600 text-sm py-10">No transactions found.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default App;