import { useState, useEffect, useContext } from 'react';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { X, Calendar, DollarSign, Activity, AlertCircle, Zap, CheckCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import PaymentGatewayModal from './PaymentGatewayModal';

const DynamicPlanModal = ({ deal, onClose, refreshDashboard }) => {
  const { user } = useContext(AuthContext);
  const [scheduleData, setScheduleData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Payment States
  const [paymentAmount, setPaymentAmount] = useState('');
  
  // Gateway States
  const [showGateway, setShowGateway] = useState(false);
  const [gatewayAmount, setGatewayAmount] = useState(0);
  const [isPayoffMode, setIsPayoffMode] = useState(false);

  useEffect(() => {
    fetchSchedule();
  }, [deal.id]);

  const fetchSchedule = async () => {
    try {
      const res = await api.get(`/deals/${deal.id}/schedule`);
      setScheduleData(res.data);
      if (res.data.schedule.length > 0) {
        // Pre-fill active EMI
        const nextPayment = res.data.schedule.find(s => s.status !== 'PAID');
        if (nextPayment) setPaymentAmount(Math.round(nextPayment.emi).toString());
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handlePaymentClick = (e) => {
    e.preventDefault();
    if (!paymentAmount || Number(paymentAmount) <= 0) return;
    
    // Open Gateway instead of instant API call
    setGatewayAmount(Number(paymentAmount));
    setIsPayoffMode(false);
    setShowGateway(true);
  };

  const calculatePayoffAmount = () => {
    if (!scheduleData) return 0;
    const nextPayment = scheduleData.schedule.find(s => s.status !== 'PAID');
    if (!nextPayment) return 0; 
    const prevBalance = nextPayment.balance + nextPayment.principalPaid;
    return prevBalance + nextPayment.interest; 
  };

  const handleInstantPayoffClick = () => {
    const amount = calculatePayoffAmount();
    
    // Open Gateway for Payoff
    setGatewayAmount(amount);
    setIsPayoffMode(true);
    setShowGateway(true);
  };

  const executeActualPayment = async (amount) => {
    try {
      await api.post('/payments', { dealId: deal.id, amount: amount });
      setShowGateway(false);
      fetchSchedule();
      refreshDashboard();
      
      if (isPayoffMode) {
        setTimeout(() => {
           alert('Congratulations! Loan successfully paid off early.');
           onClose();
        }, 500);
      } else {
        setPaymentAmount('');
      }
    } catch (err) {
      alert('Error processing actual payment on server');
      setShowGateway(false);
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading || !scheduleData) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm">
      <div className="bg-white p-6 rounded-2xl shadow-xl flex items-center gap-3">
        <Activity className="animate-spin text-indigo-600 h-6 w-6" /> Loading precise banking schedule...
      </div>
    </div>
  );

  const { standardEmi, schedule } = scheduleData;
  const isReceiver = user.role === 'RECEIVER';
  const isPaidOff = schedule.every(s => s.status === 'PAID') || (schedule.length > 0 && schedule[schedule.length - 1].balance <= 0 && schedule[0].status === 'PAID');

  // Chart Data Mapper
  const chartData = schedule.map(s => ({
    name: formatDate(s.dueDate).split(' ')[0] + ' ' + formatDate(s.dueDate).split(' ')[1], // e.g. "10 May"
    Balance: Math.round(s.balance),
    Interest: Math.round(s.interest)
  }));


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm px-4 py-8 overflow-y-auto">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl animate-fade-in-up my-auto flex flex-col relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition p-2 bg-gray-100 rounded-full z-10">
          <X className="h-5 w-5" />
        </button>

        <div className="flex flex-col lg:flex-row h-full">
          
          {/* Left Column: Details & Chart */}
          <div className="w-full lg:w-1/3 bg-gray-50 p-6 border-r border-gray-200 rounded-l-2xl">
            <h2 className="text-2xl font-extrabold text-gray-900 mb-1">Amortization Plan</h2>
            <p className="text-sm text-gray-500 mb-6 font-medium">Standard EMI: <span className="text-indigo-600 font-bold">₹{Math.round(standardEmi).toLocaleString()}</span></p>

            <div className="space-y-4 mb-8">
               <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
                 <div className="bg-blue-100 p-2 rounded-lg text-blue-600"><DollarSign className="h-5 w-5" /></div>
                 <div>
                   <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Principal</p>
                   <p className="font-bold text-gray-800 text-lg">₹{deal.principal.toLocaleString()}</p>
                 </div>
               </div>
               <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
                 <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600"><Calendar className="h-5 w-5" /></div>
                 <div>
                   <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Interest & Tenure</p>
                   <p className="font-bold text-gray-800">{deal.interestRate}% over {deal.tenureMonths} mo</p>
                 </div>
               </div>
            </div>

            <div className="h-48 w-full mt-4">
               <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 text-center">Remaining Balance Projection</p>
               <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                  <Area type="monotone" dataKey="Balance" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorBalance)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Instant Payoff Innovation Feature */}
            {isReceiver && !isPaidOff && (
               <div className="mt-8 pt-6 border-t border-gray-200">
                  <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-5 rounded-xl shadow-lg relative overflow-hidden group">
                     {/* Decorative bolt */}
                     <Zap className="absolute -right-4 -top-4 h-24 w-24 text-white opacity-10 group-hover:scale-110 transition-transform duration-500" />
                     
                     <h3 className="text-white font-bold text-lg mb-1 flex items-center gap-2 relative z-10"><Zap className="h-4 w-4 text-yellow-300"/> Instant Payoff Quote</h3>
                     <p className="text-indigo-100 text-xs mb-4 relative z-10">Close this loan today. Save massive amounts on future unearned interest.</p>
                     
                     <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 mb-4 relative z-10">
                        <p className="text-indigo-50 text-xs font-medium uppercase tracking-wider">Total Due Today</p>
                        <p className="text-white font-extrabold text-2xl tracking-tight">₹{Math.round(calculatePayoffAmount()).toLocaleString()}</p>
                     </div>

                     <button 
                       onClick={handleInstantPayoffClick}
                       className="w-full bg-white text-indigo-700 hover:bg-gray-50 font-bold py-2.5 rounded-lg shadow transition text-sm relative z-10 transition transform hover:-translate-y-0.5">
                       Payoff & Close Loan Now
                     </button>
                  </div>
               </div>
            )}
          </div>

          {/* Right Column: Banking Schedule Table & Dynamic Payment */}
          <div className="w-full lg:w-2/3 p-6 flex flex-col">
            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b border-gray-100 pb-2 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-gray-400" /> Complete Schedule Breakdown
            </h3>

            {/* Banking Table */}
            <div className="flex-1 overflow-y-auto mb-6 pr-2 custom-scrollbar border border-gray-100 rounded-xl relative">
              <table className="w-full text-sm text-left relative">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50 sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="px-5 py-4 font-semibold">Due Date</th>
                    <th className="px-5 py-4 font-semibold text-right">EMI Amount</th>
                    <th className="px-5 py-4 text-center text-gray-400 border-x border-gray-200">
                       <span className="block text-[10px] uppercase opacity-70">Split</span>
                       <span className="text-emerald-600 font-bold">Principal</span> + <span className="text-orange-500 font-bold">Interest</span>
                    </th>
                    <th className="px-5 py-4 font-semibold text-right">Remaining Balance</th>
                    <th className="px-5 py-4 font-semibold text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {schedule.map((row) => (
                    <tr key={row.month} className={`hover:bg-gray-50/50 transition ${row.status === 'PAID' ? 'bg-green-50/20' : ''}`}>
                      <td className="px-5 py-4 font-medium text-gray-900">
                         {formatDate(row.dueDate)}
                         <span className="block text-xs text-gray-400">Month {row.month}</span>
                      </td>
                      <td className="px-5 py-4 font-bold text-gray-800 text-right">₹{Math.round(row.emi).toLocaleString()}</td>
                      
                      {/* Detailed Split Column */}
                      <td className="px-5 py-4 text-center border-x border-gray-100/50 bg-gray-50/30">
                         <span className="text-emerald-600 font-bold">₹{Math.round(row.principalPaid).toLocaleString()}</span>
                         <span className="text-gray-300 mx-2">+</span>
                         <span className="text-orange-500 font-medium">₹{Math.round(row.interest).toLocaleString()}</span>
                      </td>

                      <td className="px-5 py-4 font-bold text-indigo-600 text-right">
                        {row.balance > 0.5 ? `₹${Math.round(row.balance).toLocaleString()}` : <span className="text-green-500 flex items-center justify-end gap-1"><CheckCircle className="h-4 w-4"/> Settled</span>}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded-md tracking-wider ${
                          row.status === 'PAID' ? 'bg-green-100 text-green-700' :
                          row.status === 'PARTIAL' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Dynamic Payment Action */}
            {isReceiver && !isPaidOff && (
              <div className="bg-white border-2 border-indigo-100 rounded-2xl p-5 shadow-md">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 flex items-center gap-2"><DollarSign className="text-emerald-500 h-5 w-5 bg-emerald-50 rounded-full"/> Make a Repayment</h4>
                    <p className="text-xs text-gray-500 font-medium mt-1">Smart Engine: Paying extra dynamically reduces future interest & shortens tenure.</p>
                  </div>
                  <form onSubmit={handlePaymentClick} className="flex-1 flex gap-3 w-full">
                    <div className="relative flex-1">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₹</span>
                      <input 
                        type="number" 
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        className="w-full pl-8 pr-4 py-3 bg-gray-50 border border-indigo-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition font-bold text-gray-800"
                        placeholder="Amount"
                        required
                      />
                    </div>
                    <button 
                      type="submit" 
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold shadow-md transition whitespace-nowrap transform hover:-translate-y-0.5">
                      Pay Securely
                    </button>
                  </form>
                </div>
              </div>
            )}
            
            {isPaidOff && (
               <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center">
                  <div className="mx-auto w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-3">
                     <CheckCircle className="h-6 w-6" />
                  </div>
                  <h3 className="text-emerald-800 font-bold text-lg">Loan Completely Settled</h3>
                  <p className="text-emerald-600 text-sm mt-1">All principal and interest have been fully repaid according to schedule.</p>
               </div>
            )}

          </div>
        </div>
      </div>
      
      {/* Gateway Overlay */}
      {showGateway && (
        <PaymentGatewayModal 
           amount={gatewayAmount} 
           onCancel={() => setShowGateway(false)} 
           onSuccess={executeActualPayment} 
        />
      )}
    </div>
  );
};

export default DynamicPlanModal;
