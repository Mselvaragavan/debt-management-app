import { useState, useEffect } from 'react';
import api from '../utils/api';
import { Send, FileText, IndianRupee, Users, TrendingUp, Layers, DollarSign } from 'lucide-react';
import DynamicPlanModal from '../components/DynamicPlanModal';

const ReceiverDashboard = () => {
  const [requests, setRequests] = useState([]);
  const [deals, setDeals] = useState([]);
  const [givers, setGivers] = useState([]);
  const [formData, setFormData] = useState({ amount: '', proposedRate: '', giverId: '', preferredTenureMonths: 12 });
  const [loading, setLoading] = useState(true);
  const [selectedDeal, setSelectedDeal] = useState(null);

  const fetchData = async () => {
    try {
      const [reqsRes, dealsRes, giversRes] = await Promise.all([
        api.get('/requests'),
        api.get('/deals'),
        api.get('/users/givers')
      ]);
      setRequests(reqsRes.data);
      setDeals(dealsRes.data);
      setGivers(giversRes.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const createRequest = async (e) => {
    e.preventDefault();
    try {
      await api.post('/requests', formData);
      setFormData({ amount: '', proposedRate: '', giverId: '', preferredTenureMonths: 12 });
      alert('Loan request submitted successfully!');
      fetchData();
    } catch (err) {
      alert('Error creating request');
    }
  };

  const handleSelectGiver = (giver) => {
    setFormData({ ...formData, amount: giver.availableAmount, proposedRate: giver.preferredRate, giverId: giver.id });
    // Scroll to form smoothly
    document.getElementById('request-form').scrollIntoView({ behavior: 'smooth' });
  };

  if (loading) return <div className="animate-pulse">Loading Borrower Dashboard...</div>;

  // Calculate KPIs
  let totalReceived = 0;
  let totalRepaid = 0;
  
  deals.forEach(deal => {
    totalReceived += deal.principal;
    totalRepaid += deal.payments.reduce((acc, p) => acc + p.amount, 0);
  });
  
  // Outstanding is roughly total received minus the principal portion repaid. 
  // For simplicity on the high-level dashboard, we'll estimate total outstanding value as (Principal - (Total Repaid - rough interest)). 
  // Since we don't have the explicit backend calculation here, a good proxy for the KPI is just sum of all deals.
  // Wait, let's just show absolute "Total Received" and "Total Payments Made". Outstanding requires the schedule.

  return (
    <div className="space-y-8 animate-fade-in-up pb-10">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900">Borrower Dashboard</h1>
        <p className="text-gray-500 mt-1">Browse willing lenders, request loans, and manage your active repayment schedules.</p>
      </div>

      {/* KPI Display Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="glass-panel p-6 shadow-md border-t-4 border-indigo-500 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Total Funds Received</p>
            <h3 className="text-3xl font-extrabold text-gray-900 mt-1">₹{totalReceived.toLocaleString()}</h3>
          </div>
          <div className="bg-indigo-50 p-3 rounded-full"><Layers className="h-6 w-6 text-indigo-600"/></div>
        </div>
        <div className="glass-panel p-6 shadow-md border-t-4 border-emerald-500 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Total Value Repaid</p>
            <h3 className="text-3xl font-extrabold text-gray-900 mt-1">₹{totalRepaid.toLocaleString()}</h3>
          </div>
          <div className="bg-emerald-50 p-3 rounded-full"><TrendingUp className="h-6 w-6 text-emerald-600"/></div>
        </div>
        <div className="glass-panel p-6 shadow-md border-t-4 border-blue-500 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Active Deals</p>
            <h3 className="text-3xl font-extrabold text-gray-900 mt-1">{deals.length}</h3>
          </div>
          <div className="bg-blue-50 p-3 rounded-full"><FileText className="h-6 w-6 text-blue-600"/></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Col: Marketplace & Create Request */}
        <div className="lg:col-span-1 space-y-8">
          
          {/* Marketplace */}
          <div className="glass-panel p-6 shadow-md border-t-4 border-blue-500 max-h-96 flex flex-col">
             <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
              <Users className="text-blue-600 h-5 w-5" />
              <h2 className="text-xl font-bold text-gray-800">Available Lenders</h2>
            </div>
            <div className="overflow-y-auto pr-2 space-y-3 flex-1">
              {givers.length === 0 ? (
                 <p className="text-sm text-gray-500 italic">No lenders are currently offering funds.</p>
              ) : (
                givers.map(giver => (
                  <div key={giver.id} className="p-4 bg-white border border-gray-200 rounded-xl hover:border-blue-400 hover:shadow-md transition cursor-pointer"
                       onClick={() => handleSelectGiver(giver)}>
                    <div className="flex justify-between items-start mb-2">
                       <h3 className="font-bold text-gray-900">{giver.name}</h3>
                       <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded">Rate: {giver.preferredRate}%</span>
                    </div>
                    <p className="text-sm text-gray-600 font-medium">Available: <span className="text-indigo-600 font-bold">₹{giver.availableAmount.toLocaleString()}</span></p>
                    <button className="text-xs text-blue-600 font-bold mt-2 hover:underline">Request from this lender →</button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Form */}
          <div id="request-form" className="glass-panel p-6 shadow-lg border-t-4 border-emerald-500">
            <div className="flex items-center gap-2 mb-6">
              <Send className="text-emerald-600 h-6 w-6" />
              <h2 className="text-xl font-bold text-gray-800">Request Loan</h2>
            </div>
            <form onSubmit={createRequest} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Amount Needed (₹)</label>
                <input type="number" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition"
                  value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Proposed Interest Rate (%)</label>
                <input type="number" step="0.1" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition"
                  value={formData.proposedRate} onChange={(e) => setFormData({...formData, proposedRate: e.target.value})} required />
              </div>
              <div>
                 <label className="block text-sm font-semibold text-gray-600 mb-1">Preferred Repayment Tenure</label>
                 <select 
                   className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition text-gray-800"
                   value={formData.preferredTenureMonths}
                   onChange={(e) => setFormData({...formData, preferredTenureMonths: Number(e.target.value)})}
                 >
                    <option value={3}>3 Months</option>
                    <option value={6}>6 Months</option>
                    <option value={9}>9 Months</option>
                    <option value={12}>12 Months (1 Year)</option>
                    <option value={18}>18 Months</option>
                    <option value={24}>24 Months</option>
                    <option value={36}>36 Months</option>
                 </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Direct to Lender (Optional ID)</label>
                <input type="text" placeholder="Leave blank for open request" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition"
                  value={formData.giverId} onChange={(e) => setFormData({...formData, giverId: e.target.value})} />
              </div>
              <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold tracking-wide py-3 rounded-xl shadow-md transition transform hover:-translate-y-0.5 mt-2">
                Submit Request
              </button>
            </form>
          </div>
        </div>

        {/* Right Col: Active Deals & Repayment */}
        <div className="lg:col-span-2 space-y-8">
           {/* Requests History */}
           <div className="glass-panel p-6">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
              <h2 className="text-lg font-bold flex items-center gap-2 text-gray-800"><FileText className="text-blue-500 h-5 w-5"/> My Requests History</h2>
            </div>
            <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
              {requests.map(req => (
                <div key={req.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100 flex justify-between items-center text-sm">
                  <div>
                    <span className="font-bold text-gray-800">₹{req.amount}</span>
                    <p className="text-gray-500 text-xs">Rate: {req.proposedRate}%</p>
                  </div>
                  <span className={`px-2 py-1 rounded-md text-[10px] uppercase tracking-wider font-bold shadow-sm ${
                    req.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : 
                    req.status === 'PENDING_ADMIN_APPROVAL' ? 'bg-red-50 text-red-600 border border-red-200' : 
                    req.status === 'GIVER_ACCEPTED' ? 'bg-orange-50 text-orange-600 border border-orange-200' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {req.status === 'PENDING_ADMIN_APPROVAL' ? 'Under Admin Review' : 
                     req.status === 'GIVER_ACCEPTED' ? 'Awaiting Escrow Transfer' : req.status}
                  </span>
                </div>
              ))}
              {requests.length === 0 && <p className="text-xs text-gray-400 italic">No loan requests made.</p>}
            </div>
          </div>


          <div className="glass-panel p-6 min-h-[500px]">
            <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
              <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800"><IndianRupee className="text-indigo-500 h-6 w-6"/> Active Loan Deals</h2>
            </div>
            
            {deals.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <div className="h-16 w-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
                  <IndianRupee className="h-8 w-8 text-indigo-300" />
                </div>
                <h3 className="text-lg font-bold text-gray-700">No active loans</h3>
                <p className="text-gray-500 mt-1 max-w-sm">Submit a request and wait for a lender to accept it to see your active schedules here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {deals.map(deal => (
                  <div key={deal.id} className="border border-indigo-100 bg-gradient-to-r from-indigo-50/50 to-white p-5 rounded-2xl hover:shadow-lg transition relative overflow-hidden group">
                    <div className="absolute top-0 right-0 h-full w-2 bg-indigo-500 group-hover:w-3 transition-all duration-300"></div>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-indigo-500 mb-1">Lender: {deal.giver.name}</p>
                        <h3 className="font-extrabold text-3xl text-gray-900 tracking-tight">₹{deal.principal.toLocaleString()}</h3>
                        <div className="flex gap-4 mt-2 text-sm text-gray-600 font-medium">
                          <span className="bg-gray-100 px-2 py-1 rounded-md">{deal.interestRate}% Interest</span>
                          <span className="bg-gray-100 px-2 py-1 rounded-md">{deal.tenureMonths} Months</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => setSelectedDeal(deal)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-md transition transform hover:-translate-y-0.5 text-sm">
                        View Repayment Plan
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {selectedDeal && (
        <DynamicPlanModal deal={selectedDeal} onClose={() => setSelectedDeal(null)} refreshDashboard={fetchData} />
      )}
    </div>
  );
};

export default ReceiverDashboard;
