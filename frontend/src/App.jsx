import React, { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import SharedLayout from './components/layout/SharedLayout.jsx';
import LoginForm from './pages/loginform.jsx';
import InventoryClerkDashboard from './pages/dashboards/InventoryClerkDashboard.jsx';
import SalesPersonnelDashboard from './pages/dashboards/SalesPersonnelDashboard.jsx';
import AdminDashboard from './pages/dashboards/AdminDashboard.jsx';
import InstructorDashboard from './pages/dashboards/InstructorDashboard.jsx';

function MainApp() {
  const { currentUser, isAuthenticated } = useAuth();
  const [activeMenu, setActiveMenu] = useState('dashboard');

  if (!isAuthenticated || !currentUser) {
    return <LoginForm onLoginSuccess={() => setActiveMenu('dashboard')} />;
  }

  // Render role-specific dashboard inside shared layout
  const renderDashboardByRole = () => {
    switch (currentUser.role) {
      case 'inventory_clerk':
        return <InventoryClerkDashboard />;
      case 'sales_personnel':
        return <SalesPersonnelDashboard />;
      case 'instructor':
        return <InstructorDashboard />;
      case 'admin':
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <SharedLayout activeMenu={activeMenu} onMenuChange={setActiveMenu}>
      {renderDashboardByRole()}
    </SharedLayout>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ThemeProvider>
  );
}
