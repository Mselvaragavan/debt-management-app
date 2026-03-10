import { useState, useEffect, useContext } from 'react';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { Settings, CheckCircle, Clock, Diamond, TrendingUp, Layers } from 'lucide-react';
import AcceptDealModal from '../components/AcceptDealModal';
import DynamicPlanModal from '../components/DynamicPlanModal';

const GiverDashboard = () => {
  const { user } = useContext(AuthContext);
  const [requests, setRequests] = useState([]);
  const [deals, setDeals] = useState([]);
  const [preferences, setPreferences] = useState({ availableAmount: user?.availableAmount || 0, preferredRate: user?.preferredRate || 0 });
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedDeal, setSelectedDeal] = useState(null);

  const fetchData = async () => {
    try {
      const [reqsRes, dealsRes] = await Promise.all([
        api.get('/requests'),
        api.get('/deals')
      ]);
      setRequests(reqsRes.data);
      setDeals(dealsRes.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const updatePreferences = async (e) => {
    e.preventDefault();
    try {
      await api.put('/users/preferences', preferences);
      alert('Preferences updated successfully!');
    } catch (err) {
      alert('Error updating preferences');
    }
  };

  if (loading) return <div className="animate-pulse">Loading Giver Dashboard...</div>;

  // Calculate KPIs
  let totalDeployed = 0;
  let totalCollected = 0;
  
  deals.forEach(deal => {
    totalDeployed += deal.principal;
    totalCollected += deal.payments.reduce((acc, p) => acc + p.amount, 0);
  });

  return (
    <div className="space-y-8 animate-fade-in-up pb-10">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900">Lender Dashboard</h1>
        <p className="text-gray-500 mt-1">Manage your lending preferences, customize deal tenures, and monitor active loans.</p>
      </div>

      {/* KPI Display Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="glass-panel p-6 shadow-md border-t-4 border-indigo-500 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Total Capital Deployed</p>
            <h3 className="text-3xl font-extrabold text-gray-900 mt-1">₹{totalDeployed.toLocaleString()}</h3>
          </div>
          <div className="bg-indigo-50 p-3 rounded-full"><Diamond className="h-6 w-6 text-indigo-600"/></div>
        </div>
        <div className="glass-panel p-6 shadow-md border-t-4 border-emerald-500 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Total Returns Collected</p>
            <h3 className="text-3xl font-extrabold text-gray-900 mt-1">₹{totalCollected.toLocaleString()}</h3>
          </div>
          <div className="bg-emerald-50 p-3 rounded-full"><TrendingUp className="h-6 w-6 text-emerald-600"/></div>
        </div>
        <div className="glass-panel p-6 shadow-md border-t-4 border-blue-500 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Active Deals</p>
            <h3 className="text-3xl font-extrabold text-gray-900 mt-1">{deals.length}</h3>
          </div>
          <div className="bg-blue-50 p-3 rounded-full"><Layers className="h-6 w-6 text-blue-600"/></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Col: Preferences */}
        <div className="lg:col-span-1 space-y-8">
          <div className="glass-panel p-6 shadow-lg border-t-4 border-indigo-500">
            <div className="flex items-center gap-2 mb-6">
              <Settings className="text-indigo-600 h-6 w-6" />
              <h2 className="text-xl font-bold text-gray-800">Your Capital Preferences</h2>
            </div>
            <form onSubmit={updatePreferences} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Available Capital (₹)</label>
                <input type="number" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={preferences.availableAmount} onChange={(e) => setPreferences({...preferences, availableAmount: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Preferred Interest Rate (%)</label>
                <input type="number" step="0.1" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={preferences.preferredRate} onChange={(e) => setPreferences({...preferences, preferredRate: e.target.value})} />
              </div>
              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-lg transition">
                Save Preferences
              </button>
            </form>
          </div>
        </div>

        {/* Right Col: Requests & Deals */}
        <div className="lg:col-span-2 space-y-8">
          <div className="glass-panel p-6 border-t-4 border-blue-400">
            <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
              <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800"><Clock className="text-blue-500 h-5 w-5"/> Open Loan Requests</h2>
              <span className="bg-blue-100 text-blue-700 font-bold px-3 py-1 rounded-full text-xs">{requests.length} pending</span>
            </div>
            {requests.length === 0 ? (
              <p className="text-gray-500 italic text-center py-4">No open requests currently.</p>
            ) : (
               <div className="overflow-x-auto">
                 <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 font-semibold rounded-tl-lg">Borrower</th>
                      <th className="px-4 py-3 font-semibold">Amount Requested</th>
                      <th className="px-4 py-3 font-semibold">Proposed Rate</th>
                      <th className="px-4 py-3 font-semibold text-right rounded-tr-lg">Action</th>
                    </tr>
                  </thead>
                   <tbody className="divide-y divide-gray-100">
                    {requests.map(req => (
                      <tr key={req.id} className="hover:bg-blue-50/50 transition">
                         <td className="px-4 py-3 font-medium text-gray-900">{req.receiver.name}</td>
                         <td className="px-4 py-3 text-indigo-600 font-bold">₹{req.amount.toLocaleString()}</td>
                         <td className="px-4 py-3 text-gray-600">{req.proposedRate}%</td>
                         <td className="px-4 py-3 text-right">
                           {req.status === 'PENDING' ? (
                             <button onClick={() => setSelectedRequest(req)} className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-4 py-2 rounded-lg font-bold text-[10px] uppercase tracking-wider transition flex items-center justify-end ml-auto gap-2">
                               <Settings className="h-3 w-3" /> Customize & Fund
                             </button>
                           ) : (
                             // It should realistically never hit this block since Givers only GET 'PENDING' requests due to the updated backend route, but just in case:
                             <span className="text-xs font-bold text-gray-400 bg-gray-100 px-3 py-1.5 rounded-md">Processing...</span>
                           )}
                         </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="glass-panel p-6 border-t-4 border-green-400">
            <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
              <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800"><CheckCircle className="text-green-500 h-5 w-5"/> Active Deals Portfolio</h2>
            </div>
            {deals.length === 0 ? (
              <p className="text-gray-500 italic text-center py-4">You have no active deals yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {deals.map(deal => {
                  const paymentsMade = deal.payments.reduce((acc, p) => acc + p.amount, 0);
                  const progressPercentage = Math.min(100, Math.round((paymentsMade / deal.principal) * 100));

                  return (
                  <div key={deal.id} className="border border-green-100 bg-white p-5 rounded-xl hover:shadow-lg transition">
                    <p className="text-xs font-bold uppercase tracking-wider text-green-500 mb-1">Borrower: {deal.receiver.name}</p>
                    <h3 className="font-extrabold text-2xl text-gray-900">₹{deal.principal.toLocaleString()}</h3>
                    <div className="flex justify-between mt-2 text-sm font-medium">
                      <span className="text-gray-600">Rate: <span className="text-gray-900">{deal.interestRate}%</span></span>
                      <span className="text-gray-600">Tenure: <span className="text-gray-900">{deal.tenureMonths} mo</span></span>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-100">
                       <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Progress</span>
                          <span className="font-bold text-green-600">{progressPercentage}% Returns</span>
                       </div>
                       <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${progressPercentage}%` }}></div>
                       </div>
                       <button 
                         onClick={() => setSelectedDeal(deal)}
                         className="w-full mt-4 bg-green-50 hover:bg-green-100 text-green-700 font-bold py-2 rounded-lg text-sm transition">
                         View Repayment Schedule
                       </button>
                    </div>
                  </div>
                )})}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {selectedRequest && (
        <AcceptDealModal 
          request={selectedRequest} 
          onClose={() => setSelectedRequest(null)} 
          refreshDashboard={fetchData} 
        />
      )}

      {selectedDeal && (
        <DynamicPlanModal 
          deal={selectedDeal} 
          onClose={() => setSelectedDeal(null)} 
          refreshDashboard={fetchData} 
        />
      )}
    </div>
  );
};

export default GiverDashboard;
