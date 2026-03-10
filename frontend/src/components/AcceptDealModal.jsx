import { useState } from 'react';
import api from '../utils/api';
import { X, CheckCircle, CalendarDays } from 'lucide-react';
import PaymentGatewayModal from './PaymentGatewayModal';

const AcceptDealModal = ({ request, onClose, refreshDashboard }) => {
  const [tenure, setTenure] = useState(request.preferredTenureMonths || 12); 
  const [repaymentDay, setRepaymentDay] = useState(10); // Default 10th
  const [loading, setLoading] = useState(false);
  const [showGateway, setShowGateway] = useState(false);

  const handleAcceptClick = () => {
    // Open Gateway instead of instant API call
    setShowGateway(true);
  };

  const executeActualAccept = async () => {
    setLoading(true);
    try {
      await api.post(`/deals/${request.id}/accept`, { tenureMonths: tenure, repaymentDayOfMonth: repaymentDay });
      setShowGateway(false);
      refreshDashboard();
      onClose();
    } catch (err) {
      alert(err.response?.data?.message || 'Error accepting request');
      setShowGateway(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm px-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2"><CalendarDays className="h-5 w-5 text-indigo-500" /> Customize Deal</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition"><X className="h-5 w-5" /></button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
             <p className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-2">Loan Specifications</p>
             <div className="flex justify-between items-center text-sm">
               <span className="text-gray-600">Borrower:</span>
               <span className="font-bold text-gray-900">{request.receiver.name}</span>
             </div>
             <div className="flex justify-between items-center text-sm mt-1">
               <span className="text-gray-600">Amount to Transfer:</span>
               <span className="font-bold text-gray-900">₹{request.amount.toLocaleString()}</span>
             </div>
             <div className="flex justify-between items-center text-sm mt-1">
               <span className="text-gray-600">Interest Rate:</span>
               <span className="font-bold text-gray-900">{request.proposedRate}%</span>
             </div>
             <div className="flex justify-between items-center text-sm mt-1 pt-1 border-t border-indigo-200/50">
               <span className="text-gray-600">Borrower Preferred Tenure:</span>
               <span className="font-bold text-indigo-700">{request.preferredTenureMonths} Months</span>
             </div>
          </div>

          <div className="flex gap-4">
            <div className="w-1/2">
               <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Final Tenure</label>
               <select 
                 className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-800 font-medium cursor-pointer"
                 value={tenure}
                 onChange={(e) => setTenure(Number(e.target.value))}
               >
                  <option value={3}>3 Months</option>
                  <option value={6}>6 Months</option>
                  <option value={9}>9 Months</option>
                  <option value={12}>12 Months</option>
                  <option value={18}>18 Months</option>
                  <option value={24}>24 Months</option>
                  <option value={36}>36 Months</option>
               </select>
            </div>
            
            <div className="w-1/2">
               <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Payment Day</label>
               <select 
                 className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-800 font-medium cursor-pointer"
                 value={repaymentDay}
                 onChange={(e) => setRepaymentDay(Number(e.target.value))}
               >
                  {[...Array(28)].map((_, i) => (
                    <option key={i+1} value={i+1}>{i+1}{
                      (i+1)%10===1 && (i+1)!==11 ? 'st' :
                      (i+1)%10===2 && (i+1)!==12 ? 'nd' :
                      (i+1)%10===3 && (i+1)!==13 ? 'rd' : 'th'
                    } of Month</option>
                  ))}
               </select>
            </div>
          </div>
          
          <p className="text-xs text-center text-gray-500">
            EMIs will fall due on the <strong className="text-gray-700">{repaymentDay}</strong> of every month for <strong className="text-gray-700">{tenure} months</strong>.
          </p>

          <button 
             onClick={handleAcceptClick}
             disabled={loading}
             className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition flex justify-center items-center gap-2">
             <CheckCircle className="h-5 w-5" /> {loading ? 'Processing...' : 'Transfer to Escrow (Pending Admin)'}
          </button>
        </div>
      </div>
      
      {/* Gateway Overlay for Giver */}
      {showGateway && (
        <PaymentGatewayModal 
           amount={request.amount} 
           onCancel={() => setShowGateway(false)} 
           onSuccess={executeActualAccept} 
        />
      )}
    </div>
  );
};

export default AcceptDealModal;
