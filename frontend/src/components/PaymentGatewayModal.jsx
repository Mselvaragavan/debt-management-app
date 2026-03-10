import { useState } from 'react';
import { X, CreditCard, Smartphone, CheckCircle, Loader2, Lock } from 'lucide-react';

const PaymentGatewayModal = ({ amount, onCancel, onSuccess }) => {
  const [method, setMethod] = useState('card');
  const [status, setStatus] = useState('idle'); // idle, processing, success

  const handlePay = (e) => {
    e.preventDefault();
    setStatus('processing');
    
    // Simulate network delay for verification
    setTimeout(() => {
      setStatus('success');
      // Wait for success animation before triggering the actual backend update
      setTimeout(() => {
        onSuccess(amount);
      }, 1500);
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900/70 backdrop-blur-sm px-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl relative overflow-hidden animate-fade-in-up">
        
        {/* Header */}
        <div className="bg-gray-50 border-b border-gray-100 p-5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-indigo-600 font-bold">
            <Lock className="h-5 w-5" /> Secure Checkout
          </div>
          {status === 'idle' && (
            <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition">
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center mb-6">
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Amount to Pay</p>
            <h2 className="text-4xl font-extrabold text-gray-900 mt-1">₹{Number(amount).toLocaleString()}</h2>
          </div>

          {status === 'idle' && (
            <>
              {/* Tabs */}
              <div className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-lg">
                <button 
                  onClick={() => setMethod('card')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md font-medium text-sm transition ${method === 'card' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                  <CreditCard className="h-4 w-4" /> Card
                </button>
                <button 
                  onClick={() => setMethod('upi')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md font-medium text-sm transition ${method === 'upi' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                  <Smartphone className="h-4 w-4" /> UPI
                </button>
              </div>

              {/* Dynamic Forms */}
              <form onSubmit={handlePay}>
                {method === 'card' ? (
                  <div className="space-y-4 animate-fade-in">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-1">Card Number</label>
                      <input type="text" placeholder="0000 0000 0000 0000" required maxLength="19" className="w-full bg-white border border-gray-200 px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition font-medium tracking-widest" />
                    </div>
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-1">Expiry</label>
                        <input type="text" placeholder="MM/YY" required maxLength="5" className="w-full bg-white border border-gray-200 px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition font-medium text-center" />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-1">CVV</label>
                        <input type="password" placeholder="***" required maxLength="4" className="w-full bg-white border border-gray-200 px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition font-medium text-center tracking-widest" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 animate-fade-in">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-1">UPI ID</label>
                      <input type="text" placeholder="username@bank" required className="w-full bg-white border border-gray-200 px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition font-medium" />
                    </div>
                    <p className="text-xs text-gray-500 text-center">Open your UPI app after clicking pay to authorize the transaction.</p>
                  </div>
                )}

                <button type="submit" className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg transition transform hover:-translate-y-0.5 flex justify-center items-center gap-2 text-lg">
                  Pay Securely
                </button>
              </form>
            </>
          )}

          {status === 'processing' && (
            <div className="py-12 flex flex-col items-center justify-center animate-fade-in text-center">
               <Loader2 className="h-16 w-16 text-indigo-500 animate-spin mb-4" />
               <h3 className="text-xl font-bold text-gray-900">Processing Payment...</h3>
               <p className="text-sm text-gray-500 mt-2">Please do not close this window or hit back.</p>
            </div>
          )}

          {status === 'success' && (
            <div className="py-12 flex flex-col items-center justify-center animate-fade-in text-center">
               <div className="h-20 w-20 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                 <CheckCircle className="h-12 w-12 text-emerald-500 animate-[pulse_1s_ease-in-out_infinite]" />
               </div>
               <h3 className="text-2xl font-bold text-gray-900">Payment Successful!</h3>
               <p className="text-sm text-gray-500 mt-2">Redirecting back to dashboard...</p>
            </div>
          )}

        </div>
        
        {/* Footer */}
        <div className="bg-gray-50 py-3 text-center text-xs text-gray-400 font-medium">
           Secured by AntiGravity Payments
        </div>
      </div>
    </div>
  );
};

export default PaymentGatewayModal;
