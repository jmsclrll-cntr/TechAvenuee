import React, { useState, useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import Header from './components/Header'; // adjust path if your Header lives elsewhere
import UserManualModal from './components/UserManualModal';
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

  // Sidebar collapsed state persisted in localStorage
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('techavenue_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  // User & Authentication state
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('techavenue_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeWorkspace, setActiveWorkspace] = useState(() => {
    try {
      const saved = localStorage.getItem('techavenue_active_workspace');
      if (saved && ['admin', 'inventory_clerk', 'sales_personnel', 'instructor'].includes(saved)) {
        return saved;
      }
    } catch {
      // Ignore
    }
    return 'instructor';
  });
  const [shiftInfo, setShiftInfo] = useState(null);
  const [lowStockCount, setLowStockCount] = useState(5);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);

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

  // Persist sidebar collapsed state
  useEffect(() => {
    try {
      localStorage.setItem('techavenue_sidebar_collapsed', sidebarCollapsed ? 'true' : 'false');
    } catch {
      // Ignore localStorage errors
    }
  }, [sidebarCollapsed]);

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
    localStorage.removeItem('techavenue_active_workspace');
    setUser(null);
    setActiveTab('dashboard');
    setActiveWorkspace('instructor');
  };

  if (!user) {
    return (
      <Login
        onLoginSuccess={(u) => {
          // Ensure dashboard starts with visible fixed sidebar
          setSidebarCollapsed(false);
          try {
            if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
              document.documentElement.requestFullscreen().catch(() => { });
            }
          } catch { }
          setUser(u);
          setActiveTab('dashboard');
        }}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />
    );
  }

  // Academic Instructor has full access to switch between all role workspaces
  const currentWorkspace = user.role === 'instructor' ? activeWorkspace : user.role;
  const effectiveUser = user.role === 'instructor' ? { ...user, role: currentWorkspace, isInstructor: true } : user;

  // Render Role Dashboard based on effective workspace
  const renderDashboardContent = () => {
    const props = { activeTab, setActiveTab, user: effectiveUser };

    switch (currentWorkspace) {
      case 'inventory_clerk':
        return <ClerkDashboard {...props} />;

      case 'sales_personnel':
        return <SalesDashboard {...props} />;

      case 'admin':
        return <AdminDashboard {...props} />;

      case 'instructor':
        return <InstructorDashboard {...props} />;

      default:
        return (
          <div className="p-8 text-center text-gray-500">
            Unknown user role. Please sign out and sign in again.
          </div>
        );
    }
  };

  return (
    <BrowserRouter>
      <div className="relative h-screen bg-darkbg text-gray-100 flex flex-col overflow-hidden transition-colors select-none">
        {/* Top Header with theme toggle, workspaces, sub-tabs, and live info */}
        <Header
          user={user}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          role={currentWorkspace}
          activeWorkspace={currentWorkspace}
          setActiveWorkspace={(ws) => {
            setActiveWorkspace(ws);
            localStorage.setItem('techavenue_active_workspace', ws);
          }}
          shiftInfo={shiftInfo}
          lowStockCount={lowStockCount}
          onOpenManual={() => setIsManualModalOpen(true)}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onLogout={handleLogout}
          onSwitchRole={handleSwitchRole}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        {/* Main Full-Width Dashboard Content Body */}
        <main className="flex-1 overflow-y-auto bg-[#141210] pb-24 sm:pb-28">
          {renderDashboardContent()}
        </main>

        {/* Global Interactive User Manual for all roles */}
        <UserManualModal
          isOpen={isManualModalOpen}
          onClose={() => setIsManualModalOpen(false)}
          userRole={user.role}
          initialRole={user.role}
          onNavigateTab={async (tab, targetRole) => {
            setIsManualModalOpen(false);
            if (targetRole && targetRole !== user.role) {
              try {
                const res = await api.switchRole(targetRole);
                if (res.status === 'success') {
                  localStorage.setItem('techavenue_token', res.token);
                  localStorage.setItem('techavenue_user', JSON.stringify(res.user));
                  setUser(res.user);
                  setActiveTab(tab);
                }
              } catch (err) {
                console.error('Role switch error:', err);
                setActiveTab(tab);
              }
            } else {
              setActiveTab(tab);
            }
          }}
        />
      </div>
    </BrowserRouter>
  );
}

export default App;