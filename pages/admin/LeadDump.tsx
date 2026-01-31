
import React, { useState } from 'react';
import { db } from '../../services/db';
import { distributeLeads, DistributionStrategy } from '../../services/distribution';
import { useAuth } from '../../contexts/AuthContext';
import { Card, Button, Input, Badge, Modal } from '../../components/UI';
import { PROCESS_TYPES } from '../../constants';

export const LeadDump: React.FC = () => {
  const { user, refreshAllData } = useAuth();
  const [pasteData, setPasteData] = useState('');
  const [parsedLeads, setParsedLeads] = useState<any[]>([]);
  const [strategy, setStrategy] = useState<DistributionStrategy>('equal');
  const [showSummary, setShowSummary] = useState<{ assigned: number; skipped: number } | null>(null);
  const [isDistributing, setIsDistributing] = useState(false);
  const [error, setError] = useState('');

  const handleParse = () => {
    const lines = pasteData.split('\n').filter(line => line.trim());

    const leads = lines.map((line, idx) => {
      const parts = line.split(/\t|,| {2,}/).map(s => s?.trim()).filter(Boolean);

      let name = 'Unknown';
      let mobile = '';
      let location = 'Other';
      let isValid = false;

      const phoneRegex = /\b\d{10}\b/;
      const mobileIndex = parts.findIndex(p => phoneRegex.test(p));

      if (mobileIndex !== -1) {
        mobile = parts[mobileIndex];
        isValid = true;

        const nameParts = parts.slice(0, mobileIndex);
        if (nameParts.length > 0) {
          if (/^\d{1,4}$/.test(nameParts[0])) {
            name = nameParts.slice(1).join(' ');
          } else {
            name = nameParts.join(' ');
          }
        }

        if (!name || name === 'Unknown') {
          name = nameParts[0] || 'Unknown';
        }

        const locationParts = parts.slice(mobileIndex + 1);
        if (locationParts.length > 0) {
          location = locationParts[0];
        }
      }

      return {
        id: idx,
        customer_name: name || 'Unknown',
        customer_mobile: mobile || '',
        location: location || 'Other',
        process_type: 'Legal Service',
        valid: isValid
      };
    });

    setParsedLeads(leads);
  };

  const handleDistribute = async () => {
    if (!user) return;
    const validLeads = parsedLeads.filter(l => l.valid);

    if (validLeads.length === 0) {
      setError('No valid leads to distribute. Please check phone numbers.');
      return;
    }

    setIsDistributing(true);
    setError('');

    try {
      // Fixed: db.addLead is async, use Promise.all to create leads before distribution
      const createdLeads = await Promise.all(validLeads.map(l => db.addLead({
        customer_name: l.customer_name,
        customer_mobile: l.customer_mobile,
        location: l.location,
        source: 'Smart Dump',
        process_type: l.process_type,
        status: 'New'
      })));

      // Fixed: distributeLeads is now async
      const result = await distributeLeads(createdLeads, strategy, user.id);
      setShowSummary(result);
      setParsedLeads([]);
      setPasteData('');
      await refreshAllData();
    } catch (err) {
      console.error('Distribution error:', err);
      setError('Failed to distribute leads. Please try again.');
    } finally {
      setIsDistributing(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="text-center md:text-left">
        <h1 className="text-4xl font-black text-gray-900 font-poppins tracking-tight">Lead Smart Dump</h1>
        <p className="text-gray-500 font-medium mt-1">Paste your lead table directly. System will auto-detect Names, Numbers, and States.</p>
      </div>

      <Card className="p-8 border-none shadow-2xl rounded-[40px] bg-white">
        <div className="flex gap-4 border-b border-gray-100 mb-6">
          <button className="px-6 py-3 font-black text-indigo-600 border-b-4 border-indigo-600 uppercase text-xs tracking-widest">Raw Paste Mode</button>
        </div>

        <div className="space-y-6">
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center px-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Paste Data (Excel/Table Format)</label>
              <Badge color="indigo">Auto-Detection Enabled</Badge>
            </div>
            <textarea
              className="w-full h-80 p-6 font-mono text-sm border-2 border-gray-50 rounded-[32px] focus:ring-4 focus:ring-indigo-50/50 bg-gray-50/30 resize-none transition-all outline-none"
              placeholder={`Example:\n1  Abdul Khan  8104332929  Rajasthan\n2  Bimla Devi  8899180329  Delhi`}
              value={pasteData}
              onChange={(e) => setPasteData(e.target.value)}
            />
          </div>

          <Button onClick={handleParse} className="w-full py-5 rounded-[24px] text-lg font-black shadow-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] transition-all" disabled={!pasteData.trim()}>
            Analyze & Extract Leads
          </Button>
        </div>
      </Card>

      {parsedLeads.length > 0 && (
        <Card className="p-8 space-y-8 animate-in fade-in slide-in-from-top-10 duration-500 border-none shadow-2xl rounded-[40px] bg-white">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-2xl font-black text-gray-900">Extracted Preview</h2>
              <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mt-1">Total: {parsedLeads.length} | Valid: {parsedLeads.filter(l => l.valid).length}</p>
            </div>
            <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-2xl border border-gray-100 w-full md:w-auto">
              <span className="text-[10px] font-black uppercase text-gray-400 ml-2">Strategy</span>
              <select
                className="bg-white text-xs font-black uppercase tracking-widest rounded-xl border-none focus:ring-2 focus:ring-indigo-500 py-2 px-4 shadow-sm"
                value={strategy}
                onChange={(e) => setStrategy(e.target.value as DistributionStrategy)}
              >
                <option value="equal">Equal Share</option>
                <option value="target-based">Target Priority</option>
                <option value="skill-based">Process Match</option>
              </select>
            </div>
          </div>

          <div className="overflow-hidden border border-gray-50 rounded-[32px]">
            <table className="w-full text-left">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Match</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer Name</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Mobile Number</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Location/State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {parsedLeads.map(l => (
                  <tr key={l.id} className={`${l.valid ? 'hover:bg-indigo-50/30' : 'bg-rose-50/30'} transition-colors`}>
                    <td className="px-6 py-4">
                      {l.valid ? <Badge color="green">DETECTED</Badge> : <Badge color="red">NO NUMBER</Badge>}
                    </td>
                    <td className="px-6 py-4 font-black text-gray-800 text-sm capitalize">{l.customer_name}</td>
                    <td className="px-6 py-4 font-mono text-indigo-600 font-bold">{l.customer_mobile || '----------'}</td>
                    <td className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">{l.location}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button onClick={() => setParsedLeads([])} variant="secondary" className="py-4 font-black text-xs uppercase tracking-[0.2em] rounded-2xl">
              Discard All
            </Button>
            <Button onClick={handleDistribute} variant="success" className="py-4 text-lg font-black rounded-2xl shadow-xl shadow-emerald-100 bg-emerald-600 hover:bg-emerald-700">
              Push to Team Members
            </Button>
          </div>
        </Card>
      )}

      {showSummary && (
        <Modal isOpen={!!showSummary} onClose={() => setShowSummary(null)} title="Distribution Result">
          <div className="text-center space-y-6 py-4">
            <div className={`w-24 h-24 rounded-[32px] flex items-center justify-center mx-auto shadow-inner ${showSummary.skipped > 0 ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
              {showSummary.skipped > 0 ? (
                <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              ) : (
                <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <div>
              <h3 className="text-3xl font-black text-gray-900 font-poppins">
                {showSummary.skipped > 0 ? 'Partial Success' : 'Success!'}
              </h3>
              <p className="text-gray-500 font-medium mt-2">
                Assigned <span className="font-black text-indigo-600">{showSummary.assigned}</span> leads.
              </p>
              {showSummary.skipped > 0 && (
                <p className="mt-4 p-4 bg-amber-50 rounded-2xl text-xs font-bold text-amber-700 border border-amber-100">
                  ⚠️ {showSummary.skipped} leads were skipped because team members reached their daily limit. Increase targets to assign more.
                </p>
              )}
            </div>
            <Button onClick={() => setShowSummary(null)} className="w-full py-4 rounded-2xl font-black bg-indigo-600 shadow-xl">Finish</Button>
          </div>
        </Modal>
      )}
    </div>
  );
};
