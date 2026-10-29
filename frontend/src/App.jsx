import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ClerkDashboard from './pages/ClerkDashboard';
import SalesDashboard from './pages/SalesDashboard';
import AdminDashboard from './pages/AdminDashboard';
import InstructorDashboard from './pages/InstructorDashboard';
import Login from './pages/Login';
import { api } from './api';

function App() {
  // Theme state persisted in localStorage
  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('techavenue_theme');
    if (savedTheme) {
      return savedTheme === 'dark';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // User & Authentication state
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('techavenue_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [shiftInfo, setShiftInfo] = useState(null);
  const [lowStockCount, setLowStockCount] = useState(5);

  // Sync dark mode class to <html> element and persist
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('techavenue_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('techavenue_theme', 'light');
    }
  }, [darkMode]);

  // Listen for invalid auth
  useEffect(() => {
    const handleInvalidAuth = () => {
      setUser(null);
    };
    window.addEventListener('auth_invalid', handleInvalidAuth);
    return () => window.removeEventListener('auth_invalid', handleInvalidAuth);
  }, []);

  // Fetch initial summary info if logged in
  useEffect(() => {
    if (user) {
      api.getDashboardStats(user.role).then(res => {
        if (res.status === 'success' && res.data) {
          if (res.data.cards?.low_stock_products !== undefined) {
            setLowStockCount(res.data.cards.low_stock_products);
          }
          if (res.data.shift_info) {
            setShiftInfo(res.data.shift_info);
          }
        }
      }).catch(err => console.log('Dashboard stats error:', err));
    }
  }, [user]);

  // Handle Switch Role (Fast demo toggle)
  const handleSwitchRole = async (targetRole) => {
    try {
      const res = await api.switchRole(targetRole);
      if (res.status === 'success') {
        localStorage.setItem('techavenue_token', res.token);
        localStorage.setItem('techavenue_user', JSON.stringify(res.user));
        setUser(res.user);
        setActiveTab('dashboard');
      }
    } catch (err) {
      alert(`Role switch error: ${err.message}`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('techavenue_token');
    localStorage.removeItem('techavenue_user');
    setUser(null);
    setActiveTab('dashboard');
  };

  if (!user) {
    return (
      <Login
        onLoginSuccess={(u) => {
          setUser(u);
          setActiveTab('dashboard');
        }}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />
    );
  }

  // Render Role Dashboard based on authenticated user's role
  const renderDashboardContent = () => {
    switch (user.role) {
      case 'inventory_clerk':
        return (
          <ClerkDashboard
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            user={user}
          />
        );

      case 'sales_personnel':
        return (
          <SalesDashboard
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            user={user}
          />
        );

      case 'admin':
        return (
          <AdminDashboard
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            user={user}
          />
        );

      case 'instructor':
        return (
          <InstructorDashboard
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            user={user}
          />
        );

      default:
        return (
          <div className="p-8 text-center text-gray-500">
            Unknown user role. Please sign out and sign in again.
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-darkbg text-gray-900 dark:text-gray-100 flex transition-colors">
      {/* Persistent Role-Specific Sidebar */}
      <Sidebar
        role={user.role}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        onSwitchRole={handleSwitchRole}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header with theme toggle and live info */}
        <Header
          user={user}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          role={user.role}
          shiftInfo={shiftInfo}
          lowStockCount={lowStockCount}
        />

        {/* Dashboard Role Body */}
        <main className="flex-1">
          {renderDashboardContent()}
        </main>
      </div>
    </div>
  );
}

export default App;
