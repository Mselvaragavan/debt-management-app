import { useState, useEffect } from 'react';
import api from '../utils/api';
import { Users, Activity, DollarSign, TrendingUp, Layers, ArrowRight, ShieldCheck, CheckCircle } from 'lucide-react';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [allDeals, setAllDeals] = useState([]);
  const [securityQueue, setSecurityQueue] = useState({ requests: [], deals: [] });
  const [loading, setLoading] = useState(true);

  // Platform Aggregates
  const [metrics, setMetrics] = useState({
    totalPrincipalLent: 0,
    totalPrincipalRepaid: 0,
    totalInterestEarned: 0,
    totalPlatformVolume: 0
  });

  const fetchData = async () => {
    try {
      const [usersRes, dealsRes, queueRes] = await Promise.all([
        api.get('/users'),
        api.get('/deals/all'),
        api.get('/requests') // Admins see ALL requests due to no whereClause override
      ]);
      
      setUsers(usersRes.data);
      const deals = dealsRes.data;
      setAllDeals(deals);
      
      // Filter the exact things waiting for Admin actions
      const adminRequests = queueRes.data.filter(r => r.status === 'PENDING_ADMIN_APPROVAL');
      const adminDeals = queueRes.data.filter(r => r.status === 'GIVER_ACCEPTED');
      setSecurityQueue({ requests: adminRequests, deals: adminDeals });
      
      // Calculate Metrics
      let pLent = 0; let pRepaid = 0; let iEarned = 0; let volume = 0;
      deals.forEach(d => {
         pLent += d.principal;
         pRepaid += d.calculated?.totalPrincipalPaid || 0;
         iEarned += d.calculated?.totalInterestPaid || 0;
         volume += d.calculated?.totalValuePaid || 0;
      });

      setMetrics({
        totalPrincipalLent: pLent,
        totalPrincipalRepaid: pRepaid,
        totalInterestEarned: iEarned,
        totalPlatformVolume: volume
      });

      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const approveRequest = async (id) => {
    if(!window.confirm('Approve this loan request for the public marketplace?')) return;
    try {
      await api.post(`/requests/${id}/admin-approve-request`);
      fetchData();
    } catch (err) { alert('Error approving request'); }
  };

  const approveDealFinalize = async (id) => {
    if(!window.confirm('Finalize this deal and transfer funds to the receiver?')) return;
    try {
      await api.post(`/deals/${id}/admin-approve-deal`);
      fetchData();
    } catch (err) { alert('Error finalizing deal'); }
  };

  if (loading) return <div className="animate-pulse">Loading Admin Exhaustive Data...</div>;

  return (
    <div className="space-y-6 animate-fade-in-up pb-10">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Platform Analytics & Security</h1>
          <p className="text-gray-500 mt-1">Exhaustive breakdown of all financial flows and pending security approvals.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[
          { title: 'Total Capital Lent', value: `₹${metrics.totalPrincipalLent.toLocaleString()}`, icon: Layers, color: 'text-indigo-500', bg: 'bg-indigo-50' },
          { title: 'Capital Repaid', value: `₹${Math.round(metrics.totalPrincipalRepaid).toLocaleString()}`, icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-50' },
          { title: 'Interest Earned', value: `₹${Math.round(metrics.totalInterestEarned).toLocaleString()}`, icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-50' },
          { title: 'Total Users', value: users.length, icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
        ].map((kpi, i) => (
          <div key={i} className="glass-panel p-6 hover:-translate-y-1 transition duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-500">{kpi.title}</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">{kpi.value}</h3>
              </div>
              <div className={`p-3 rounded-xl ${kpi.bg}`}>
                <kpi.icon className={`w-6 h-6 ${kpi.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Security Queue */}
      {(securityQueue.requests.length > 0 || securityQueue.deals.length > 0) && (
        <div className="glass-panel p-6 mb-8 border-t-4 border-red-500">
          <h2 className="text-xl font-bold text-gray-800 border-b border-gray-100 pb-4 mb-6 flex items-center gap-2">
             <ShieldCheck className="h-5 w-5 text-red-500"/> Security Queue: Action Required
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* New Requests Queue */}
            <div>
               <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center justify-between">
                 Pending New Loan Requests
                 <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs">{securityQueue.requests.length}</span>
               </h3>
               <div className="space-y-3">
                 {securityQueue.requests.length === 0 && <p className="text-gray-400 text-sm italic">Clear.</p>}
                 {securityQueue.requests.map(req => (
                   <div key={req.id} className="bg-white border border-red-100 p-4 rounded-xl shadow-sm flex justify-between items-center">
                      <div>
                        <p className="font-bold text-gray-900">{req.receiver.name}</p>
                        <p className="text-sm text-gray-500">Requested: <span className="font-bold text-indigo-600">₹{req.amount.toLocaleString()}</span> @ {req.proposedRate}%</p>
                      </div>
                      <button 
                        onClick={() => approveRequest(req.id)}
                        className="bg-red-50 hover:bg-red-100 text-red-600 p-2 rounded-lg transition font-bold text-xs flex items-center gap-1">
                        <CheckCircle className="h-4 w-4"/> Approve to Market
                      </button>
                   </div>
                 ))}
               </div>
            </div>

            {/* Final Deal Approval Queue */}
            <div>
               <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center justify-between">
                 Pending Final Transfers (Giver Accepted)
                 <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full text-xs">{securityQueue.deals.length}</span>
               </h3>
               <div className="space-y-3">
                 {securityQueue.deals.length === 0 && <p className="text-gray-400 text-sm italic">Clear.</p>}
                 {securityQueue.deals.map(req => (
                   <div key={req.id} className="bg-white border border-orange-200 p-4 rounded-xl shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                         <div>
                           <p className="text-xs text-gray-400 mb-1">{req.giver?.name} <ArrowRight className="inline h-3 w-3"/> {req.receiver.name}</p>
                           <p className="font-bold text-gray-900">Transfer: ₹{req.amount.toLocaleString()}</p>
                         </div>
                         <button 
                          onClick={() => approveDealFinalize(req.id)}
                          className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-lg transition font-bold text-xs flex items-center gap-1 shadow-sm">
                          <CheckCircle className="h-3 w-3"/> Finalize & Disburse
                         </button>
                      </div>
                      <div className="bg-orange-50 rounded p-2 text-xs text-orange-800">
                         <strong>Giver Terms:</strong> {req.finalTenureMonths} Months, Due on {req.finalRepaymentDay} of Month.
                      </div>
                   </div>
                 ))}
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Comprehensive Deals Table */}
      <div className="glass-panel p-6">
        <h2 className="text-xl font-bold text-gray-800 border-b border-gray-100 pb-4 mb-6 flex items-center gap-2">
           <Activity className="h-5 w-5 text-indigo-500"/> Exhaustive Deals Tracker
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="text-xs text-gray-500 bg-gray-50 uppercase tracking-wider">
                <th className="px-4 py-3 font-semibold rounded-tl-lg">Lending Flow (Giver → Receiver)</th>
                <th className="px-4 py-3 font-semibold">Deal Struct</th>
                <th className="px-4 py-3 font-semibold text-blue-600 bg-blue-50/50">Total Paid</th>
                <th className="px-4 py-3 font-semibold text-indigo-600 bg-indigo-50/50">Initial Re-paid</th>
                <th className="px-4 py-3 font-semibold text-emerald-600 bg-emerald-50/50">Interest Profit</th>
                <th className="px-4 py-3 font-semibold text-red-600 bg-red-50/50 rounded-tr-lg">Pending Initial</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100/50">
              {allDeals.length === 0 && <tr><td colSpan="6" className="text-center py-8 text-gray-500">No deals on the platform yet.</td></tr>}
              {allDeals.map(deal => (
                <tr key={deal.id} className="hover:bg-gray-50/50 transition">
                  <td className="px-4 py-4">
                     <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-800">{deal.giver?.name}</span>
                        <ArrowRight className="h-4 w-4 text-gray-400" />
                        <span className="font-bold text-gray-800">{deal.receiver?.name}</span>
                     </div>
                  </td>
                  <td className="px-4 py-4">
                     <p className="font-bold text-gray-900">₹{deal.principal.toLocaleString()}</p>
                     <p className="text-xs text-gray-500">{deal.interestRate}% @ {deal.tenureMonths}mo</p>
                  </td>
                  <td className="px-4 py-4 bg-blue-50/10 font-bold text-gray-700">
                     ₹{Math.round(deal.calculated.totalValuePaid).toLocaleString()}
                  </td>
                  <td className="px-4 py-4 text-indigo-600 font-bold bg-indigo-50/10">
                     ₹{Math.round(deal.calculated.totalPrincipalPaid).toLocaleString()}
                  </td>
                  <td className="px-4 py-4 text-emerald-600 font-bold bg-emerald-50/10">
                     ₹{Math.round(deal.calculated.totalInterestPaid).toLocaleString()}
                  </td>
                  <td className="px-4 py-4 text-red-500 font-bold bg-red-50/10 border-l border-white">
                     ₹{Math.round(deal.calculated.remainingPrincipal).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
