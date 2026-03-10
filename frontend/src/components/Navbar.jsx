import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, LayoutDashboard, Wallet, User as UserIcon, Bell } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-md border-b border-gray-200/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-2">
            <Wallet className="h-8 w-8 text-blue-600" />
            <Link to="/" className="text-2xl font-extrabold gradient-text tracking-tight">DebtSync</Link>
          </div>
          
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <div className="flex items-center gap-3 mr-4 bg-gray-100/50 px-4 py-1.5 rounded-full border border-gray-200">
                  <UserIcon className="h-4 w-4 text-gray-500" />
                  <div>
                    <span className="text-sm font-semibold text-gray-800 tracking-wide">{user.name}</span>
                    <span className="ml-2 text-xs font-bold text-white bg-indigo-500 px-2 py-0.5 rounded-md">{user.role}</span>
                  </div>
                </div>
                <button className="p-2 text-gray-400 hover:text-blue-600 transition relative">
                  <Bell className="h-5 w-5" />
                  <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
                </button>
                <button onClick={handleLogout} className="flex items-center gap-2 text-gray-600 hover:text-red-500 transition font-medium">
                  <LogOut className="h-5 w-5" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <div className="space-x-4">
                <Link to="/login" className="text-gray-600 hover:text-blue-600 font-medium transition">Login</Link>
                <Link to="/register" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl shadow-md transition transform hover:-translate-y-0.5 font-medium">Get Started</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
