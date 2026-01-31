
import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../services/db';
import { Card, Badge, Button, Input, Modal } from '../../components/UI';
import { Icons, PROCESS_TYPES } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';

export const EmployeeProfile: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, refreshAllData } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  const empId = parseInt(id || '0');
  // Fixed: Use synced context data to find employee and sales
  const employee = data.users.find(u => u.id === empId);
  const [editForm, setEditForm] = useState(employee ? { ...employee } : null);

  // Keep edit form in sync with data updates
  useEffect(() => {
    if (employee) setEditForm({ ...employee });
  }, [employee]);

  const sales = data.sales.filter(s => s.user_id === empId).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  
  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayNet = sales.filter(s => s.sale_date === today).reduce((sum, s) => s.type === 'add' ? sum + s.amount : sum - s.amount, 0);
    const monthNet = sales.filter(s => s.sale_date.startsWith(today.substring(0, 7))).reduce((sum, s) => s.type === 'add' ? sum + s.amount : sum - s.amount, 0);
    return { todayNet, monthNet, count: sales.length };
  }, [sales]);

  if (!employee) return <div>Employee not found</div>;

  const handleUpdate = async () => {
    if (editForm) {
      // Fixed: Await async database update and refresh context data
      await db.updateUser(empId, editForm);
      setIsEditModalOpen(false);
      await refreshAllData();
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500 pb-20">
      {/* Premium Profile Header */}
      <div className="relative h-64 bg-indigo-600 rounded-[40px] overflow-hidden shadow-2xl">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full -mr-20 -mt-20 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-400 rounded-full -ml-10 -mb-10 blur-3xl"></div>
        </div>
        
        <div className="absolute -bottom-12 left-12 flex items-end gap-6">
          <div className="w-40 h-40 bg-white p-2 rounded-[40px] shadow-xl">
            <div className="w-full h-full bg-indigo-50 border-4 border-white rounded-[32px] flex items-center justify-center text-5xl font-black text-indigo-600 uppercase">
              {employee.name.charAt(0)}
            </div>
          </div>
          <div className="mb-14 text-white">
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-black font-poppins">{employee.name}</h1>
              <Badge color={employee.is_active ? 'green' : 'red'}>{employee.is_active ? 'ACTIVE' : 'PAUSED'}</Badge>
            </div>
            <p className="text-indigo-100 font-medium text-lg mt-1">{employee.email}</p>
          </div>
        </div>

        <div className="absolute top-8 right-8">
          <Button onClick={() => setIsEditModalOpen(true)} className="bg-white/20 backdrop-blur-md text-white border border-white/30 hover:bg-white hover:text-indigo-600 px-6 rounded-2xl">
            Edit Profile Credentials
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-10">
        {/* Sidebar Info */}
        <div className="space-y-6">
          <Card className="p-6 space-y-6 border-none shadow-xl rounded-[32px]">
            <h3 className="font-black text-gray-900 uppercase tracking-widest text-xs border-b border-gray-50 pb-4">Performance Metrics</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 font-bold text-sm">Today's Net</span>
                <span className="font-black text-emerald-600 text-lg">₹{stats.todayNet.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 font-bold text-sm">Monthly Net</span>
                <span className="font-black text-indigo-600 text-lg">₹{stats.monthNet.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 font-bold text-sm">Daily Target</span>
                <span className="font-black text-gray-900">{employee.daily_lead_target} Leads</span>
              </div>
            </div>
          </Card>

          <Card className="p-6 space-y-4 border-none shadow-xl rounded-[32px]">
            <h3 className="font-black text-gray-900 uppercase tracking-widest text-xs border-b border-gray-100 pb-4">Specialized Skills</h3>
            <div className="flex flex-wrap gap-2">
              {employee.skills.map(s => <Badge key={s} color="indigo">{s}</Badge>)}
            </div>
          </Card>
        </div>

        {/* Main Feed */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-4">
            <h2 className="text-2xl font-black text-gray-900">Activity Timeline</h2>
            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">{stats.count} Transactions</span>
          </div>

          <div className="space-y-4">
            {sales.map(sale => (
              <div key={sale.id} className="relative pl-8 pb-8 group">
                <div className="absolute left-[7px] top-0 bottom-0 w-[2px] bg-gray-100 group-last:bg-transparent"></div>
                <div className={`absolute left-0 top-1 w-4 h-4 rounded-full border-4 border-white shadow-sm ${sale.type === 'add' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                
                <Card className="p-5 border-none shadow-sm hover:shadow-md transition-shadow rounded-2xl flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-black text-gray-900">{sale.lead_name || 'System Conversion'}</p>
                      <Badge color={sale.type === 'add' ? 'green' : 'red'}>{sale.type.toUpperCase()}</Badge>
                    </div>
                    <p className="text-xs text-gray-400 font-bold">
                      {sale.sale_date} at {sale.sale_time} • {sale.payment_mode}
                    </p>
                    {sale.comments && <p className="text-xs text-gray-500 italic mt-2 mt-2">"{sale.comments}"</p>}
                  </div>
                  <p className={`text-xl font-black ${sale.type === 'add' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {sale.type === 'add' ? '+' : '-'} ₹{sale.amount.toLocaleString()}
                  </p>
                </Card>
              </div>
            ))}
            {sales.length === 0 && (
              <div className="py-20 text-center bg-white rounded-[32px] border-4 border-dashed border-gray-50">
                <p className="text-gray-300 font-black text-xl uppercase tracking-widest">No Activity Yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Update Employee Credentials">
        <div className="space-y-4">
          <Input label="Display Name" value={editForm?.name} onChange={e => setEditForm({...editForm!, name: e.target.value})} />
          <Input label="Corporate Email" value={editForm?.email} onChange={e => setEditForm({...editForm!, email: e.target.value})} />
          <Input label="Login Password" type="text" placeholder="Update password" value={editForm?.password} onChange={e => setEditForm({...editForm!, password: e.target.value})} />
          <Input label="Mobile" value={editForm?.mobile} onChange={e => setEditForm({...editForm!, mobile: e.target.value})} />
          <Input label="Daily Target" type="number" value={editForm?.daily_lead_target} onChange={e => setEditForm({...editForm!, daily_lead_target: parseInt(e.target.value)})} />
          <Button onClick={handleUpdate} className="w-full py-4 bg-indigo-600 font-black rounded-2xl mt-4">Save Profile Changes</Button>
        </div>
      </Modal>
    </div>
  );
};
