import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { RentalProvider } from './contexts/RentalContext';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import SignUp from './pages/SignUp';

// Customer Layout & Pages
import CustomerLayout from './components/CustomerLayout';
import CustomerEquipment from './pages/customer/CustomerEquipment';
import CustomerAlerts from './pages/customer/CustomerAlerts';
import CustomerGrievance from './pages/customer/CustomerGrievance';
import CustomerWeather from './pages/customer/CustomerWeather';
import CustomerSettings from './pages/customer/CustomerSettings';

// Employee Layout & Pages
import EmployeeLayout from './components/EmployeeLayout';
import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import EmployeeHandover from './pages/employee/EmployeeHandover';
import EmployeeNotifications from './pages/employee/EmployeeNotifications';
import EmployeeDrivers from './pages/employee/EmployeeDrivers';
import EmployeeComplaints from './pages/employee/EmployeeComplaints';

// Shared / Legacy Pages (Reused in Employee station)
import EquipmentDetail from './pages/EquipmentDetail';
import CheckInOut from './pages/CheckInOut';
import Alerts from './pages/Alerts';
import Leaderboard from './pages/Leaderboard';
import Forecasting from './pages/Forecasting';
import Weather from './pages/Weather';
import Settings from './pages/Settings';

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <RentalProvider>
          <Router>
            <Routes>
              {/* Public Auth Routes */}
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<SignUp />} />

              {/* Customer Routes (Section 3, 4, 5, 8) */}
              <Route
                path="/customer"
                element={
                  <ProtectedRoute allowedRoles={['customer']}>
                    <CustomerLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/customer/equipment" replace />} />
                <Route path="equipment" element={<CustomerEquipment />} />
                <Route path="alerts" element={<CustomerAlerts />} />
                <Route path="grievance" element={<CustomerGrievance />} />
                <Route path="weather" element={<CustomerWeather />} />
                <Route path="settings" element={<CustomerSettings />} />
              </Route>

              {/* Employee Routes (Section 6, 7) */}
              <Route
                path="/employee"
                element={
                  <ProtectedRoute allowedRoles={['employee', 'admin', 'manager', 'operator']}>
                    <EmployeeLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/employee/dashboard" replace />} />
                <Route path="dashboard" element={<EmployeeDashboard />} />
                <Route path="handover" element={<EmployeeHandover />} />
                <Route path="notifications" element={<EmployeeNotifications />} />
                <Route path="drivers" element={<EmployeeDrivers />} />
                <Route path="complaints" element={<EmployeeComplaints />} />
                <Route path="check-in-out" element={<CheckInOut />} />
                <Route path="alerts" element={<Alerts />} />
                <Route path="forecasting" element={<Forecasting />} />
                <Route path="leaderboard" element={<Leaderboard />} />
                <Route path="weather" element={<Weather />} />
                <Route path="settings" element={<Settings />} />
                <Route path="equipment/:assetId" element={<EquipmentDetail />} />
              </Route>

              {/* Legacy fallback route */}
              <Route path="/dashboard" element={<Navigate to="/employee/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </Router>
        </RentalProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
