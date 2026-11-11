import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
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
  // When true: dashboard is fullscreen, sidebar auto-hides & reveals when cursor touches the left line
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('techavenue_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  // Hover state for automatic reveal on cursor touch
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const hoverTimeoutRef = useRef(null);

  // User & Authentication state
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('techavenue_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [activeTab, setActiveTab] = useState('dashboard');
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

  // Mouse hover handlers for automatic show/hide when cursor touches the edge line
  const handleMouseEnterLine = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setIsSidebarHovered(true);
  };

  const handleMouseLeaveSidebar = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    // Small 220ms grace period so cursor movement between edge/tabs doesn't flicker
    hoverTimeoutRef.current = setTimeout(() => {
      setIsSidebarHovered(false);
    }, 220);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

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
          // Ensure dashboard loads in full-width fullscreen mode
          setSidebarCollapsed(true);
          try {
            if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
              document.documentElement.requestFullscreen().catch(() => {});
            }
          } catch {}
          setUser(u);
          setActiveTab('dashboard');
        }}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />
    );
  }

  // Determine if sidebar is currently visible
  // Either permanently pinned (!sidebarCollapsed) or auto-revealed via cursor hover
  const isSidebarVisible = !sidebarCollapsed || isSidebarHovered;

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
    <div className="relative h-screen bg-gray-50 dark:bg-darkbg text-gray-900 dark:text-gray-100 flex overflow-hidden transition-colors select-none">
      {/* ========================================================================= */}
      {/* 1. SENSOR LINE: Triggers automatic show when cursor touches left edge     */}
      {/* ========================================================================= */}
      {sidebarCollapsed && !isSidebarHovered && (
        <div
          onMouseEnter={handleMouseEnterLine}
          className="absolute left-0 top-0 bottom-0 w-3 z-50 cursor-pointer group flex items-center justify-center"
          title="Move cursor here to reveal navigation menu"
        >
          {/* Subtle vertical indicator line */}
          <div className="w-1 h-full bg-navy/30 dark:bg-cyan-500/30 group-hover:bg-navy dark:group-hover:bg-cyan-400 group-hover:w-1.5 transition-all duration-200" />

          {/* Floating chevron pill handle */}
          <div className="absolute left-0.5 top-1/2 -translate-y-1/2 py-3 px-0.5 rounded-r-md bg-navy dark:bg-cyan-600 text-white shadow-lg opacity-40 group-hover:opacity-100 transition-opacity duration-150 flex items-center justify-center">
            <ChevronRight className="w-3 h-3 text-white" />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. SIDEBAR PANEL: Automatically hides & shows on cursor touch            */}
      {/* ========================================================================= */}
      <Sidebar
        role={user.role}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        onSwitchRole={handleSwitchRole}
        collapsed={!isSidebarVisible}
        isPinned={!sidebarCollapsed}
        onTogglePin={() => setSidebarCollapsed(!sidebarCollapsed)}
        onMouseEnter={handleMouseEnterLine}
        onMouseLeave={handleMouseLeaveSidebar}
        onOpenManual={() => setIsManualModalOpen(true)}
      />

      {/* ========================================================================= */}
      {/* 3. MAIN WORKSPACE / DASHBOARD CONTENT                                     */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden transition-all duration-300">
        {/* Top Header with theme toggle and live info */}
        <Header
          user={user}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          role={user.role}
          shiftInfo={shiftInfo}
          lowStockCount={lowStockCount}
          sidebarCollapsed={sidebarCollapsed}
          setSidebarCollapsed={setSidebarCollapsed}
          onOpenManual={() => setIsManualModalOpen(true)}
        />

        {/* Dashboard Role Body */}
        <main className="flex-1 overflow-y-auto">
          {renderDashboardContent()}
        </main>
      </div>

      {/* Global Interactive User Manual for all roles */}
      <UserManualModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        initialRole={user.role}
        onNavigateTab={(tab) => {
          setActiveTab(tab);
          setIsManualModalOpen(false);
        }}
      />
    </div>
  );
}

export default App;
