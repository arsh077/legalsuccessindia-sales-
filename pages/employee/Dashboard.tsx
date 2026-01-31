
import React, { useState, useMemo } from 'react';
import { db } from '../../services/db';
import { useAuth } from '../../contexts/AuthContext';
import { Card, Badge, Modal, Input, Button } from '../../components/UI';
import { Icons, LEAD_STATUSES, PAYMENT_MODES, PROCESS_TYPES } from '../../constants';
import { Lead } from '../../types';

export const EmployeeDashboard: React.FC = () => {
  const { user, data, refreshAllData } = useAuth();
  const [activeTab, setActiveTab] = useState('New');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  
  // Modal States
  const [isSalesModalOpen, setIsSalesModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  
  // Forms State
  const [salesForm, setSalesForm] = useState({
    amount: '',
    type: 'add' as 'add' | 'subtract',
    mode: 'UPI',
    notes: ''
  });

  const [manualLeadForm, setManualLeadForm] = useState({
    name: '',
    mobile: '',
    process: 'GST'
  });

  if (!user) return null;

  const today = new Date().toISOString().split('T')[0];
  // Fixed: Use sync data from AuthContext instead of direct Promise calls in render
  const myAssignments = data.assignments.filter(a => a.assigned_to === user.id && a.active);
  const myLeads = data.leads.filter(l => myAssignments.some(a => a.lead_id === l.id));
  const mySalesHistory = data.sales.filter(s => s.user_id === user.id).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const stats = useMemo(() => {
    const todaySales = mySalesHistory.filter(s => s.sale_date === today);
    const net = todaySales.reduce((sum, s) => s.type === 'add' ? sum + s.amount : sum - s.amount, 0);
    const monthNet = mySalesHistory.filter(s => s.sale_date.startsWith(today.substring(0, 7))).reduce((sum, s) => s.type === 'add' ? sum + s.amount : sum - s.amount, 0);

    return {
      target: user.daily_lead_target,
      assignedToday: myAssignments.filter(a => a.assigned_at.startsWith(today)).length,
      netToday: net,
      netMonth: monthNet
    };
  }, [myAssignments, mySalesHistory, today, user]);

  const filteredLeads = myLeads.filter(l => l.status === activeTab).sort((a, b) => b.id - a.id);

  const handleOpenSalesModal = (type: 'add' | 'subtract' = 'add', lead?: Lead) => {
    setSelectedLead(lead || null);
    setSalesForm({
      amount: '',
      type,
      mode: type === 'subtract' ? 'Adjustment' : 'UPI',
      notes: lead ? `Auto-recorded via Converted Lead: ${lead.customer_name}` : ''
    });
    setIsSalesModalOpen(true);
  };

  const handleAddManualLead = async () => {
    if (!manualLeadForm.name || !manualLeadForm.mobile) return;
    // Fixed: Await async database calls and refresh context data
    const newLead = await db.addLead({
      customer_name: manualLeadForm.name,
      customer_mobile: manualLeadForm.mobile,
      process_type: manualLeadForm.process,
      status: 'New',
      source: 'Manual Entry'
    });
    await db.assignLead(newLead.id, user.id, 'Self-Assigned');
    setManualLeadForm({ name: '', mobile: '', process: 'GST' });
    await refreshAllData();
  };

  const handleStatusChange = async (leadId: number, status: string) => {
    // Fixed: Await status update and use context data for lookups
    const old = await db.updateLeadStatus(leadId, status as any);
    await db.addAuditLog({
      user_id: user.id,
      action_type: 'LEAD_STATUS_CHANGE',
      entity_type: 'lead',
      entity_id: leadId,
      old_value: old,
      new_value: { status }
    });
    if (status === 'Converted') {
      const lead = data.leads.find(l => l.id === leadId);
      handleOpenSalesModal('add', lead);
    }
    await refreshAllData();
  };

  const handleSaveSale = async () => {
    // Fixed: Await async sale recording and refresh data
    await db.addSale({
      user_id: user.id,
      user_name: user.name,
      lead_id: selectedLead?.id,
      lead_name: selectedLead?.customer_name,
      amount: parseFloat(salesForm.amount) || 0,
      type: salesForm.type,
      payment_mode: salesForm.mode,
      comments: salesForm.notes
    });
    setIsSalesModalOpen(false);
    await refreshAllData();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-gray-900 font-poppins tracking-tight">Welcome, {user.name.split(' ')[0]}!</h1>
          <p className="text-gray-500 font-medium mt-1">Manage your inventory and track performance.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => handleOpenSalesModal('add')} variant="success" className="px-6 py-2.5 rounded-2xl shadow-lg shadow-emerald-100 font-black text-xs uppercase tracking-widest">
            + Quick Sale
          </Button>
          <Button onClick={() => setIsDetailModalOpen(true)} className="px-6 py-2.5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest">
            Manage Leads
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 border-l-4 border-l-indigo-600 bg-white shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><Icons.Users className="w-8 h-8"/></div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Today's Data Provided</p>
            <p className="text-4xl font-black text-gray-900">{stats.target}</p>
          </div>
        </Card>

        <Card className="p-6 border-l-4 border-l-blue-500 bg-white shadow-sm flex items-center gap-4 group">
          <div className="p-3 bg-blue-50 text-blue-500 rounded-2xl"><Icons.Dashboard className="w-8 h-8"/></div>
          <div className="flex-1">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Assigned Today</p>
            <div className="flex items-center justify-between">
              <div className="flex items-baseline gap-1">
                <p className="text-3xl font-black text-gray-900">{stats.assignedToday}</p>
                <p className="text-xs text-gray-400 font-bold">/ {stats.target}</p>
              </div>
              <button onClick={() => setIsDetailModalOpen(true)} className="w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center font-bold text-lg hover:scale-110 transition-transform shadow-md">
                +
              </button>
            </div>
          </div>
        </Card>

        <Card className="p-6 border-l-4 border-l-emerald-600 bg-white shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><Icons.Sales className="w-8 h-8"/></div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Net Sales (Today)</p>
            <p className="text-3xl font-black text-emerald-600">₹{stats.netToday.toLocaleString()}</p>
          </div>
        </Card>

        <Card className="p-6 bg-indigo-900 text-white shadow-xl flex items-center gap-4">
          <div className="p-3 bg-white/10 text-white rounded-2xl"><Icons.Reports className="w-8 h-8"/></div>
          <div>
            <p className="text-[10px] font-black text-white/50 uppercase tracking-widest">Month Revenue</p>
            <p className="text-3xl font-black">₹{stats.netMonth.toLocaleString()}</p>
          </div>
        </Card>
      </div>

      {/* Main Lead Feed */}
      <div className="space-y-6">
        <div className="flex overflow-x-auto gap-2 p-2 bg-white rounded-3xl w-fit shadow-sm border border-gray-100">
          {LEAD_STATUSES.map(status => (
            <button
              key={status}
              onClick={() => setActiveTab(status)}
              className={`px-8 py-3 rounded-2xl font-black transition-all text-xs uppercase tracking-widest ${
                activeTab === status ? 'bg-indigo-600 text-white shadow-xl' : 'text-gray-400 hover:text-gray-900'
              }`}
            >
              {status}
              <span className={`ml-3 px-2 py-0.5 rounded-lg text-[10px] ${activeTab === status ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-400'}`}>
                {myLeads.filter(l => l.status === status).length}
              </span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredLeads.map(lead => (
            <Card key={lead.id} className="p-6 flex flex-col gap-4 border-none shadow-xl bg-white group hover:scale-[1.02] transition-transform duration-300">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-black text-gray-900 font-poppins">{lead.customer_name}</h3>
                  <p className="text-sm text-gray-400 font-bold mt-1">{lead.customer_mobile}</p>
                </div>
                <Badge color={activeTab === 'Converted' ? 'green' : 'blue'}>{lead.status.toUpperCase()}</Badge>
              </div>
              <div className="flex gap-2">
                <Badge color="indigo">{lead.process_type}</Badge>
                {lead.location && <Badge color="gray">{lead.location}</Badge>}
              </div>
              <div className="flex gap-3 mt-2">
                <select 
                  className="flex-1 bg-gray-50 border-none rounded-xl py-2.5 px-4 font-black text-xs uppercase tracking-widest text-indigo-600 focus:ring-2 focus:ring-indigo-500"
                  value={lead.status}
                  onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                >
                  {LEAD_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <a href={`tel:${lead.customer_mobile}`} className="bg-indigo-50 text-indigo-600 p-2.5 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                </a>
              </div>
            </Card>
          ))}
          {filteredLeads.length === 0 && (
            <div className="col-span-full py-20 text-center text-gray-400 font-black uppercase tracking-widest">No data in this stage</div>
          )}
        </div>
      </div>

      {/* Comprehensive Detail Modal (Sales & Leads) */}
      <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title="Lead & Sales Management">
        <div className="space-y-8">
          {/* Section 1: Sales Summary */}
          <div>
            <div className="flex justify-between items-center mb-4 px-2">
              <h4 className="font-black text-xs uppercase tracking-widest text-gray-400">Section A: Sales Ledger</h4>
              <Badge color="green">Today Net: ₹{stats.netToday.toLocaleString()}</Badge>
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
              {mySalesHistory.filter(s => s.sale_date === today).map(sale => (
                <div key={sale.id} className="p-3 bg-gray-50 rounded-xl flex justify-between items-center border border-gray-100">
                  <div className="text-[11px]">
                    <p className="font-black text-gray-900">{sale.lead_name || 'Manual Sale'}</p>
                    <p className="text-gray-400">{sale.sale_time} • {sale.payment_mode}</p>
                  </div>
                  <p className={`font-black text-sm ${sale.type === 'add' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {sale.type === 'add' ? '+' : '-'} ₹{sale.amount.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="h-[1px] bg-gray-100"></div>

          {/* Section 2: Leads Management */}
          <div>
            <h4 className="font-black text-xs uppercase tracking-widest text-gray-400 mb-4 px-2">Section B: Lead Inventory (Total: {myLeads.length})</h4>
            
            {/* Quick Manual Lead Add Form */}
            <div className="p-4 bg-indigo-50 rounded-2xl mb-4 space-y-3">
              <p className="text-[10px] font-black text-indigo-600 uppercase">Quick Add New Data</p>
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Client Name" value={manualLeadForm.name} onChange={e => setManualLeadForm({...manualLeadForm, name: e.target.value})} />
                <Input placeholder="Mobile No." value={manualLeadForm.mobile} onChange={e => setManualLeadForm({...manualLeadForm, mobile: e.target.value})} />
              </div>
              <div className="flex gap-2">
                <select className="flex-1 bg-white border rounded-xl px-4 py-2 text-sm" value={manualLeadForm.process} onChange={e => setManualLeadForm({...manualLeadForm, process: e.target.value})}>
                  {PROCESS_TYPES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <Button onClick={handleAddManualLead} variant="primary" className="px-6">+ Add Lead</Button>
              </div>
            </div>

            <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
              {myLeads.slice(0, 10).map(lead => (
                <div key={lead.id} className="p-3 bg-white border border-gray-100 rounded-xl flex justify-between items-center">
                  <div>
                    <p className="text-xs font-black text-gray-900">{lead.customer_name}</p>
                    <Badge color="blue">{lead.status}</Badge>
                  </div>
                  <p className="text-[10px] text-gray-400 font-bold">{lead.process_type}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      {/* Transaction Entry Modal */}
      <Modal isOpen={isSalesModalOpen} onClose={() => setIsSalesModalOpen(false)} title="Record Transaction">
        <div className="space-y-4">
          <Input label="Amount (₹)" type="number" value={salesForm.amount} onChange={e => setSalesForm({...salesForm, amount: e.target.value})} />
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black text-gray-700 uppercase">Mode</label>
              <select className="bg-white border rounded-xl px-4 py-3" value={salesForm.mode} onChange={e => setSalesForm({...salesForm, mode: e.target.value})}>
                {PAYMENT_MODES.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black text-gray-700 uppercase">Action</label>
              <div className="flex gap-1">
                <button onClick={() => setSalesForm({...salesForm, type: 'add'})} className={`flex-1 py-3 rounded-xl text-[10px] font-black ${salesForm.type === 'add' ? 'bg-emerald-600 text-white' : 'bg-gray-100'}`}>ADD</button>
                <button onClick={() => setSalesForm({...salesForm, type: 'subtract'})} className={`flex-1 py-3 rounded-xl text-[10px] font-black ${salesForm.type === 'subtract' ? 'bg-rose-600 text-white' : 'bg-gray-100'}`}>SUB</button>
              </div>
            </div>
          </div>
          <Input label="Remarks" value={salesForm.notes} onChange={e => setSalesForm({...salesForm, notes: e.target.value})} />
          <Button onClick={handleSaveSale} variant={salesForm.type === 'add' ? 'success' : 'danger'} className="w-full py-4 font-black mt-2">Confirm Transaction</Button>
        </div>
      </Modal>
    </div>
  );
};
