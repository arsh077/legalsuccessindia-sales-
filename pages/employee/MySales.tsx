
import React, { useState, useMemo } from 'react';
import { db } from '../../services/db';
import { useAuth } from '../../contexts/AuthContext';
import { Card, Badge, Button, Input, Modal } from '../../components/UI';
import { Icons, PAYMENT_MODES } from '../../constants';

export const MySales: React.FC = () => {
  const { user, data, refreshAllData } = useAuth();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [form, setForm] = useState({
    customerName: '',
    amount: '',
    mode: 'UPI',
    notes: ''
  });

  if (!user) return null;

  // Fixed: Use data.sales from context
  const allSales = data.sales.filter(s => s.user_id === user.id);
  const today = new Date().toISOString().split('T')[0];
  
  const stats = useMemo(() => {
    const todaySales = allSales.filter(s => s.sale_date === today);
    const net = todaySales.reduce((sum, s) => s.type === 'add' ? sum + s.amount : sum - s.amount, 0);
    return {
      count: todaySales.filter(s => s.type === 'add').length,
      net: net
    };
  }, [allSales, today]);

  const handleSaveSale = async () => {
    // Fixed: Await database call and refresh context data
    await db.addSale({
      user_id: user.id,
      user_name: user.name,
      lead_name: form.customerName,
      amount: parseFloat(form.amount) || 0,
      type: 'add',
      payment_mode: form.mode,
      comments: form.notes
    });
    setIsAddModalOpen(false);
    setForm({ customerName: '', amount: '', mode: 'UPI', notes: '' });
    await refreshAllData();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-gray-900 font-poppins">My Sales Ledger</h1>
          <p className="text-gray-500 font-medium mt-1">Record and track your personal conversions.</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} variant="success" className="px-8 py-3 rounded-2xl shadow-xl shadow-emerald-100 font-black uppercase text-xs tracking-widest">
          + Record New Sale
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 border-l-4 border-l-emerald-500 bg-white">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Today's Net Sales</p>
          <p className="text-4xl font-black text-emerald-600">₹{stats.net.toLocaleString()}</p>
        </Card>
        <Card className="p-6 border-l-4 border-l-indigo-600 bg-white">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Conversions Today</p>
          <p className="text-4xl font-black text-gray-900">{stats.count}</p>
        </Card>
        <Card className="p-6 bg-indigo-900 text-white shadow-xl">
          <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-1">Current Session</p>
          <p className="text-xl font-bold mt-2">Active Tracker</p>
          <p className="text-[10px] text-white/30 uppercase mt-4">ID: {user.email}</p>
        </Card>
      </div>

      <Card className="bg-white rounded-[32px] overflow-hidden shadow-xl border-none">
        <div className="p-6 border-b border-gray-50 flex justify-between items-center">
          <h3 className="font-black text-xl">Recent Activity</h3>
          <Badge color="blue">Today</Badge>
        </div>
        <div className="divide-y divide-gray-50">
          {allSales.filter(s => s.sale_date === today).sort((a,b) => b.id - a.id).map(sale => (
            <div key={sale.id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl ${sale.type === 'add' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                  {sale.type === 'add' ? '+' : '-'}
                </div>
                <div>
                  <p className="font-black text-gray-900">{sale.lead_name || 'Direct Entry'}</p>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-tighter">
                    {sale.sale_time} • {sale.payment_mode}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-xl font-black ${sale.type === 'add' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  ₹{sale.amount.toLocaleString()}
                </p>
                <p className="text-[10px] text-gray-300 italic max-w-[200px] truncate">{sale.comments}</p>
              </div>
            </div>
          ))}
          {allSales.filter(s => s.sale_date === today).length === 0 && (
            <div className="p-20 text-center">
              <p className="text-gray-400 font-bold italic">No sales recorded for today yet.</p>
            </div>
          )}
        </div>
      </Card>

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Record Manual Sale">
        <div className="space-y-5">
          <Input label="Customer Name" placeholder="e.g. Ramesh Kumar" value={form.customerName} onChange={e => setForm({...form, customerName: e.target.value})} />
          <Input label="Amount (₹)" type="number" placeholder="0.00" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-black text-gray-700 uppercase">Payment Mode</label>
            <select className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm" value={form.mode} onChange={e => setForm({...form, mode: e.target.value})}>
              {PAYMENT_MODES.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-black text-gray-700 uppercase">Notes</label>
            <textarea className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm h-20 resize-none" placeholder="Details about the service..." value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
          </div>
          <Button onClick={handleSaveSale} variant="success" className="w-full py-4 text-lg font-black rounded-2xl">Confirm & Add Sale</Button>
        </div>
      </Modal>
    </div>
  );
};
