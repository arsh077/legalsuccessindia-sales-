
import React, { useState, useMemo } from 'react';
import { db } from '../../services/db';
import { Card, Badge, Button, Modal, Input } from '../../components/UI';
import { Icons } from '../../constants';
import { User, UserRole } from '../../types';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export const EmployeeList: React.FC = () => {
  const navigate = useNavigate();
  const { data, refreshAllData } = useAuth();
  
  // Fixed: Use synced data from AuthContext instead of direct DB Promise calls
  const employees = useMemo(() => 
    data.users.filter(u => u.role === UserRole.EMPLOYEE), 
    [data.users]
  );

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState<User | null>(null);
  const [newTarget, setNewTarget] = useState('');

  const [empForm, setEmpForm] = useState({
    name: '',
    email: '',
    password: '',
    mobile: '',
    target: '10',
    experience_level: 'senior' as 'new' | 'senior'
  });

  const handleOpenTargetEdit = (emp: User) => {
    setSelectedEmp(emp);
    setNewTarget(emp.daily_lead_target.toString());
    setIsTargetModalOpen(true);
  };

  const handleUpdateTarget = async (shouldNavigate: boolean = false) => {
    if (selectedEmp) {
      // Fixed: Await async database update and refresh context data
      await db.updateUser(selectedEmp.id, { daily_lead_target: parseInt(newTarget) || 0 });
      setIsTargetModalOpen(false);
      await refreshAllData();
      if (shouldNavigate) {
        navigate('/admin/leads/dump');
      }
    }
  };

  const handleToggleStatus = async (id: number, currentStatus: boolean) => {
    // Fixed: Await async database update and refresh context data
    await db.updateUser(id, { is_active: !currentStatus });
    await refreshAllData();
  };

  const handleRemove = async (id: number, name: string) => {
    if (window.confirm(`Are you sure you want to remove ${name}? This action is permanent and will log them out immediately.`)) {
      // Fixed: Await async database update and refresh context data
      await db.removeUser(id);
      await refreshAllData();
    }
  };

  const handleSaveEmployee = async () => {
    // Fixed: Await async database update and refresh context data
    await db.addUser({
      name: empForm.name,
      email: empForm.email,
      password: empForm.password || 'password123',
      mobile: empForm.mobile,
      role: UserRole.EMPLOYEE,
      is_active: true,
      daily_lead_target: parseInt(empForm.target),
      experience_level: empForm.experience_level,
      skills: [],
    });
    setIsAddModalOpen(false);
    setEmpForm({ name: '', email: '', password: '', mobile: '', target: '10', experience_level: 'senior' });
    await refreshAllData();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black text-gray-900 font-poppins tracking-tight">Team Management</h1>
          <p className="text-gray-500 font-medium mt-1">Configure priorities and targets for old vs new members.</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} className="px-8 py-3 bg-indigo-600 shadow-xl shadow-indigo-100 font-black uppercase text-xs tracking-widest">
          + Add New Employee
        </Button>
      </div>

      <Card className="overflow-hidden border-none shadow-xl bg-white rounded-[32px]">
        <div className="p-6 border-b border-gray-50 flex justify-between items-center">
          <h3 className="font-black text-xl text-gray-900">Registered Employees</h3>
          <Badge color="indigo">{employees.length} Members</Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Identity</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Level</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Target</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {[...employees].sort((a,b) => a.experience_level === 'senior' ? -1 : 1).map(emp => (
                <tr key={emp.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 ${emp.experience_level === 'senior' ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'} rounded-xl flex items-center justify-center font-black transition-all`}>
                        {emp.experience_level === 'senior' ? '👑' : emp.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-black text-gray-900">{emp.name}</p>
                        <p className="text-[10px] text-gray-400 font-bold">{emp.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge color={emp.experience_level === 'senior' ? 'yellow' : 'blue'}>
                      {emp.experience_level === 'senior' ? 'OLD MEMBER' : 'NEW MEMBER'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col">
                        <span className="font-black text-gray-900 text-sm">{emp.daily_lead_target}</span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Leads/Day</span>
                      </div>
                      <button 
                        onClick={() => handleOpenTargetEdit(emp)} 
                        className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => handleToggleStatus(emp.id, emp.is_active)}
                      className="focus:outline-none"
                    >
                      <Badge color={emp.is_active ? 'green' : 'red'}>
                        {emp.is_active ? 'ACTIVE' : 'PAUSED'}
                      </Badge>
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="secondary" 
                        onClick={() => navigate(`/admin/employee/${emp.id}`)}
                        className="p-2 bg-indigo-50 border-none text-indigo-600 hover:bg-indigo-600 hover:text-white"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268-2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      </Button>
                      <Button 
                        variant="danger" 
                        onClick={() => handleRemove(emp.id, emp.name)}
                        className="p-2 bg-rose-50 border-none text-rose-600 hover:bg-rose-600 hover:text-white"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Register Team Member">
        <div className="space-y-4">
          <Input label="Full Name" placeholder="e.g. Ramesh Kumar" value={empForm.name} onChange={e => setEmpForm({...empForm, name: e.target.value})} />
          <Input label="Email Address" type="email" placeholder="ramesh@legalsuccess.in" value={empForm.email} onChange={e => setEmpForm({...empForm, email: e.target.value})} />
          
          <div className="flex flex-col gap-1.5">
             <label className="text-sm font-semibold text-gray-700">Member Priority Category</label>
             <div className="flex gap-2 p-1 bg-gray-50 rounded-2xl border border-gray-100">
               <button 
                onClick={() => setEmpForm({...empForm, experience_level: 'senior'})}
                className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${empForm.experience_level === 'senior' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400'}`}
               >
                 Old Employee (Seniors)
               </button>
               <button 
                onClick={() => setEmpForm({...empForm, experience_level: 'new'})}
                className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${empForm.experience_level === 'new' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400'}`}
               >
                 New Employee (Associates)
               </button>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <Input label="Mobile Number" placeholder="98XXXXXXXX" value={empForm.mobile} onChange={e => setEmpForm({...empForm, mobile: e.target.value})} />
            <Input label="Daily Lead Target" type="number" value={empForm.target} onChange={e => setEmpForm({...empForm, target: e.target.value})} />
          </div>
          
          <div className="pt-4">
            <Button onClick={handleSaveEmployee} className="w-full py-4 text-lg font-black bg-indigo-600 shadow-xl">
              Create Account
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isTargetModalOpen} onClose={() => setIsTargetModalOpen(false)} title="Update Data Provided Target">
        {selectedEmp && (
          <div className="space-y-6">
            <div className="text-center p-6 bg-indigo-50 rounded-[24px] border border-indigo-100">
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Adjusting Limit For</p>
              <p className="text-2xl font-black text-indigo-900 mt-1">{selectedEmp.name}</p>
            </div>
            <Input 
              label={`Daily Limit for ${selectedEmp.name}`} 
              type="number" 
              value={newTarget} 
              onChange={e => setNewTarget(e.target.value)}
              autoFocus
            />
            <div className="flex flex-col gap-3 pt-2">
              <Button onClick={() => handleUpdateTarget(false)} className="w-full py-4 bg-indigo-600 font-black shadow-xl text-lg">Save Target</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
