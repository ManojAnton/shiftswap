import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastContainer } from './components/ui';
import Layout from './components/layout/Layout';
import { PageLoader } from './components/ui';

// Pages
import LoginPage from './pages/auth/LoginPage';
import ManagerDashboardPage from './pages/manager/ManagerDashboard';
import ManagerSchedulesPage from './pages/manager/ManagerSchedules';
import ManagerSwapsPage from './pages/manager/ManagerSwaps';
import ManagerEmployeesPage from './pages/manager/ManagerEmployees';
import ManagerAvailabilityPage from './pages/manager/ManagerAvailability';
import EmployeeDashboardPage from './pages/employee/EmployeeDashboard';
import EmployeeAvailabilityPage from './pages/employee/EmployeeAvailability';
import EmployeeSwapsPage from './pages/employee/EmployeeSwaps';
import EmployeeIncomingPage from './pages/employee/EmployeeIncoming';

function ProtectedRoute({ children, role }: { children: React.ReactNode; role?: 'Manager' | 'Employee' }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) {
    return <Navigate to={user.role === 'Manager' ? '/manager/dashboard' : '/employee/dashboard'} replace />;
  }
  return <>{children}</>;
}

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;

  return (
    <Routes>
      <Route path="/login" element={
        user ? <Navigate to={user.role === 'Manager' ? '/manager/dashboard' : '/employee/dashboard'} replace /> : <LoginPage />
      }/>

      {/* Manager routes */}
      <Route path="/manager/*" element={
        <ProtectedRoute role="Manager">
          <Layout>
            <Routes>
              <Route path="dashboard" element={<ManagerDashboardPage />} />
              <Route path="schedules" element={<ManagerSchedulesPage />} />
              <Route path="swaps" element={<ManagerSwapsPage />} />
              <Route path="employees" element={<ManagerEmployeesPage />} />
              <Route path="availability" element={<ManagerAvailabilityPage />} />
              <Route path="*" element={<Navigate to="/manager/dashboard" replace />} />
            </Routes>
          </Layout>
        </ProtectedRoute>
      }/>

      {/* Employee routes */}
      <Route path="/employee/*" element={
        <ProtectedRoute role="Employee">
          <Layout>
            <Routes>
              <Route path="dashboard" element={<EmployeeDashboardPage />} />
              <Route path="availability" element={<EmployeeAvailabilityPage />} />
              <Route path="swaps" element={<EmployeeSwapsPage />} />
              <Route path="incoming" element={<EmployeeIncomingPage />} />
              <Route path="*" element={<Navigate to="/employee/dashboard" replace />} />
            </Routes>
          </Layout>
        </ProtectedRoute>
      }/>

      {/* Default redirect */}
      <Route path="/" element={
        user
          ? <Navigate to={user.role === 'Manager' ? '/manager/dashboard' : '/employee/dashboard'} replace />
          : <Navigate to="/login" replace />
      }/>
      <Route path="*" element={<Navigate to="/" replace />}/>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <ToastContainer />
      </AuthProvider>
    </BrowserRouter>
  );
}
