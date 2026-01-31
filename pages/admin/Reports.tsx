
import React, { useState, useMemo } from 'react';
import { db } from '../../services/db';
import { Card, Badge, Button } from '../../components/UI';
import { Icons } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';

export const Reports: React.FC = () => {
  const { data } = useAuth();
  const [filterEmp, setFilterEmp] = useState('all');
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().substring(0, 7)); // YYYY-MM
  
  // Fixed: Use synced data from AuthContext to avoid async calls in component body
  const employees = data.users.filter(u => u.role === 'employee');
  const allSales = data.sales;

  const filteredSales = useMemo(() => {
    return allSales
      .filter(s => (filterEmp === 'all' || s.user_id === parseInt(filterEmp)) && s.sale_date.startsWith(filterMonth))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [allSales, filterEmp, filterMonth]);

  const stats = useMemo(() => {
    const totalAdded = filteredSales.filter(s => s.type === 'add').reduce((sum, s) => sum + s.amount, 0);
    const totalSubtracted = filteredSales.filter(s => s.type === 'subtract').reduce((sum, s) => sum + s.amount, 0);
    return {
      added: totalAdded,
      removed: totalSubtracted,
      net: totalAdded - totalSubtracted,
      conversions: filteredSales.filter(s => s.type === 'add').length
    };
  }, [filteredSales]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 font-poppins tracking-tight">Sales & Reports</h1>
          <p className="text-gray-500 font-medium mt-1">Full month-end reconciliation and financial ledger.</p>
        </div>
        
        <div className="flex flex-wrap gap-4 bg-white p-4 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black text-indigo-600 uppercase ml-2 tracking-widest">Employee</label>
            <select className="bg-gray-50 border-none rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-indigo-500" value={filterEmp} onChange={(e) => setFilterEmp(e.target.value)}>
              <option value="all">All Team Members</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black text-indigo-600 uppercase ml-2 tracking-widest">Month</label>
            <input type="month" className="bg-gray-50 border-none rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-indigo-500" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} />
          </div>
          <Button variant="secondary" onClick={() => window.print()} className="h-10 mt-auto">Export Ledger</Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 bg-emerald-600 text-white shadow-lg">
          <p className="text-[10px] font-black text-emerald-200 uppercase tracking-widest mb-1">Total Sales (Added)</p>
          <p className="text-3xl font-black">₹{stats.added.toLocaleString()}</p>
        </Card>
        <Card className="p-6 bg-rose-600 text-white shadow-lg">
          <p className="text-[10px] font-black text-rose-200 uppercase tracking-widest mb-1">Total Adjusted (Removed)</p>
          <p className="text-3xl font-black">₹{stats.removed.toLocaleString()}</p>
        </Card>
        <Card className="p-6 bg-indigo-900 text-white shadow-xl">
          <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1">Net Monthly Revenue</p>
          <p className="text-4xl font-black">₹{stats.net.toLocaleString()}</p>
        </Card>
        <Card className="p-6 bg-white border border-gray-100 shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Conversions</p>
          <p className="text-3xl font-black text-gray-900">{stats.conversions}</p>
        </Card>
      </div>

      {/* Ledger Table */}
      <Card className="overflow-hidden border-none shadow-xl bg-white rounded-3xl">
        <div className="p-6 border-b border-gray-50 flex justify-between items-center">
          <h3 className="font-black text-xl text-gray-900">Transaction Ledger</h3>
          <Badge color="blue">{filteredSales.length} Entries Found</Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Date & Time</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Employee</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Type</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Mode</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredSales.map(sale => (
                <tr key={sale.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-gray-900 text-sm">{sale.sale_date}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">{sale.sale_time}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-indigo-50 rounded-lg flex items-center justify-center text-[10px] font-black text-indigo-600 border border-indigo-100">{sale.user_name.charAt(0)}</div>
                      <span className="font-bold text-gray-700">{sale.user_name}</span>
                    </div>
                  </td>
                  <td className={`px-6 py-4 font-black text-sm ${sale.type === 'subtract' ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {sale.type === 'subtract' ? '-' : '+'} ₹{sale.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <Badge color={sale.type === 'subtract' ? 'red' : 'green'}>{sale.type.toUpperCase()}</Badge>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">{sale.payment_mode}</span>
                  </td>
                  <td className="px-6 py-4 max-w-xs">
                    <p className="text-xs text-gray-500 italic line-clamp-2">{sale.comments || '-'}</p>
                  </td>
                </tr>
              ))}
              {filteredSales.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                      <Icons.Sales className="w-8 h-8"/>
                    </div>
                    <p className="font-bold text-gray-400">No transactions recorded for this period.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
