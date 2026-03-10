import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, Shield } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'RECEIVER' });
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await register(formData.name, formData.email, formData.password, formData.role);
      navigate('/');
    } catch (err) {
      alert('Error creating account');
    }
  };

  return (
    <div className="flex items-center justify-center h-[80vh]">
      <div className="glass-panel w-full max-w-md p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold gradient-text">Create Account</h1>
          <p className="text-gray-500 mt-2">Join DebtSync ecosystem</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <User className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
            <input type="text" placeholder="Full Name" className="w-full pl-10 pr-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
          </div>
          <div className="relative">
            <Mail className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
            <input type="email" placeholder="Email address" className="w-full pl-10 pr-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
            <input type="password" placeholder="Password" className="w-full pl-10 pr-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} required />
          </div>
          <div className="relative">
            <Shield className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
            <select className="w-full pl-10 pr-4 py-3 bg-white/50 border border-gray-200 rounded-xl text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
              value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})}
            >
              <option value="RECEIVER">Borrower (Receiver)</option>
              <option value="GIVER">Lender (Giver)</option>
              <option value="ADMIN">Administrator</option>
            </select>
          </div>
          <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-3 rounded-xl shadow-lg transform transition hover:scale-[1.02]">
            Sign Up
          </button>
        </form>
        <p className="text-center text-sm text-gray-500">
          Already have an account? <Link to="/login" className="text-blue-600 font-semibold hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
