import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext, AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import GiverDashboard from './pages/GiverDashboard';
import ReceiverDashboard from './pages/ReceiverDashboard';
import Navbar from './components/Navbar';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <div className="h-screen flex items-center justify-center text-xl font-semibold">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" />;

  return children;
};

const DashboardRouter = () => {
  const { user, loading } = useContext(AuthContext);
  
  if (loading) return <div className="h-screen flex items-center justify-center text-xl font-semibold">Loading...</div>;
  if (!user) return <Navigate to="/login" />;

  switch (user.role) {
    case 'ADMIN': return <AdminDashboard />;
    case 'GIVER': return <GiverDashboard />;
    case 'RECEIVER': return <ReceiverDashboard />;
    default: return <Navigate to="/login" />;
  }
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
          <Navbar />
          <div className="pt-20 px-4 max-w-7xl mx-auto">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route 
                path="/" 
                element={
                  <ProtectedRoute>
                    <DashboardRouter />
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </div>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
