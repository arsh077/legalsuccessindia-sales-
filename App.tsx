
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { AdminDashboard } from './pages/admin/Dashboard';
import { LeadDump } from './pages/admin/LeadDump';
import { Reports } from './pages/admin/Reports';
import { EmployeeProfile } from './pages/admin/EmployeeProfile';
import { EmployeeList } from './pages/admin/EmployeeList';
import { EmployeeDashboard } from './pages/employee/Dashboard';
import { MySales } from './pages/employee/MySales';

const ProtectedRoute: React.FC<{ children: React.ReactNode, roles?: string[] }> = ({ children, roles }) => {
  const { user, loading } = useAuth();
  
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-2xl animate-spin"></div>
    </div>
  );
  
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" />;
  
  return <Layout>{children}</Layout>;
};

const RootRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  return user.role === 'admin' ? <Navigate to="/admin/dashboard" /> : <Navigate to="/employee/dashboard" />;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          
          {/* Admin Routes */}
          <Route path="/admin/dashboard" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/leads/dump" element={<ProtectedRoute roles={['admin']}><LeadDump /></ProtectedRoute>} />
          <Route path="/admin/reports" element={<ProtectedRoute roles={['admin']}><Reports /></ProtectedRoute>} />
          <Route path="/admin/employees" element={<ProtectedRoute roles={['admin']}><EmployeeList /></ProtectedRoute>} />
          <Route path="/admin/employee/:id" element={<ProtectedRoute roles={['admin']}><EmployeeProfile /></ProtectedRoute>} />
          
          {/* Employee Routes */}
          <Route path="/employee/dashboard" element={<ProtectedRoute roles={['employee']}><EmployeeDashboard /></ProtectedRoute>} />
          <Route path="/employee/sales" element={<ProtectedRoute roles={['employee']}><MySales /></ProtectedRoute>} />
          
          <Route path="/" element={<RootRedirect />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
