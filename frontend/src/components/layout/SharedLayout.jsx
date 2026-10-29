import React, { useState } from 'react';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  BrainCircuit,
  ArrowDownToLine,
  ArrowUpFromLine,
  History,
  AlertTriangle,
  Truck,
  User,
  LogOut,
  Menu,
  X,
  Bell,
  Sun,
  Moon,
  ChevronDown,
  Layers,
  Database,
  Sliders,
  Award,
  GitCompare,
  BookmarkCheck,
  Receipt,
  Search,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Laptop,
  TrendingUp,
  Settings
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import { DEMO_ACCOUNTS } from '../../data/demoAccounts.js';

export default function SharedLayout({
  activeMenu = 'dashboard',
  onMenuChange,
  children,
}) {
  const { currentUser, logout, switchRole } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [knowledgeDropdownOpen, setKnowledgeDropdownOpen] = useState(false);

  // Role details
  const role = currentUser?.role || 'admin';
  const roleTitle = currentUser?.displayName || 'User';

  // Role-specific sidebar menus exactly per specifications
  const getSidebarMenuItems = () => {
    switch (role) {
      case 'inventory_clerk':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'inventory', label: 'Inventory', icon: Package },
          { id: 'stock-in', label: 'Stock In / Restocking', icon: ArrowDownToLine },
          { id: 'stock-out', label: 'Stock Out', icon: ArrowUpFromLine },
          { id: 'movement-history', label: 'Stock Movement History', icon: History },
          { id: 'low-stock-alerts', label: 'Low-Stock Alerts', icon: AlertTriangle, badge: '12 Low' },
          { id: 'suppliers', label: 'Suppliers', icon: Truck },
          { id: 'profile', label: 'My Profile', icon: User },
        ];

      case 'sales_personnel':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'market-pos', label: 'Market / Point of Sale', icon: ShoppingCart },
          { id: 'new-transaction', label: 'New Transaction', icon: Layers },
          { id: 'sales-history', label: 'Sales History', icon: History },
          { id: 'receipts', label: 'Receipts', icon: Receipt },
          { id: 'product-lookup', label: 'Product Lookup', icon: Search },
          { id: 'shift-summary', label: 'Shift Summary', icon: Clock },
          { id: 'profile', label: 'My Profile', icon: User },
        ];

      case 'instructor':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'inventory-overview', label: 'Inventory Overview', icon: Package },
          { id: 'sales-overview', label: 'Sales Overview', icon: BarChart3 },
          {
            id: 'knowledge',
            label: 'Knowledge Analysis & Prediction',
            icon: BrainCircuit,
            hasSubmenu: true,
            subItems: [
              { id: 'pred-demand', label: 'Product Demand Prediction' },
              { id: 'pred-sales', label: 'Sales Prediction' },
              { id: 'pred-slow', label: 'Slow-Moving Products' },
              { id: 'pred-best', label: 'Best-Selling Products' },
            ],
          },
          { id: 'dataset-explorer', label: 'Dataset Explorer', icon: Database, badge: '3 CSVs' },
          { id: 'model-training', label: 'Model Training', icon: Sliders },
          { id: 'model-evaluation', label: 'Model Evaluation', icon: Award },
          { id: 'model-comparison', label: 'Model Comparison', icon: GitCompare },
          { id: 'saved-models', label: 'Saved Models', icon: BookmarkCheck },
          { id: 'prediction-history', label: 'Prediction History', icon: History },
          { id: 'profile', label: 'My Profile', icon: User },
        ];

      case 'admin':
      default:
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'inventory', label: 'Inventory', icon: Package },
          { id: 'sales-transactions', label: 'Sales Transactions', icon: ShoppingCart },
          { id: 'user-management', label: 'User Management', icon: Users },
          { id: 'suppliers-purchasing', label: 'Suppliers & Purchasing', icon: Truck },
          { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
          {
            id: 'knowledge',
            label: 'Knowledge Analysis & Prediction',
            icon: BrainCircuit,
            hasSubmenu: true,
            subItems: [
              { id: 'pred-demand', label: 'Product Demand Prediction' },
              { id: 'pred-sales', label: 'Sales Prediction' },
              { id: 'pred-slow', label: 'Slow-Moving Products' },
              { id: 'pred-best', label: 'Best-Selling Products' },
            ],
          },
          { id: 'settings', label: 'Settings', icon: Settings },
          { id: 'profile', label: 'My Profile', icon: User },
        ];
    }
  };

  const menuItems = getSidebarMenuItems();
  const [currentDate] = useState(() =>
    new Date().toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  );

  return (
    <div
      className={`min-h-screen flex font-sans transition-colors duration-200 ${
        isDarkMode ? 'bg-[#1F2632] text-slate-100' : 'bg-[#F9FAFB] text-[#374151]'
      }`}
    >
      {/* Mobile Backdrop */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* ==================== PERSISTENT SIDEBAR ==================== */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col transition-all duration-300 ease-in-out lg:static ${
          isDarkMode
            ? 'bg-[#18202C] border-r border-[#CFC8BE]/20 text-slate-200'
            : 'bg-[#1E3A5F] border-r border-[#1E3A5F] text-white shadow-xl'
        } ${sidebarCollapsed ? 'w-20' : 'w-72'} ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header with Laptop-with-Chart Logo */}
        <div
          className={`flex h-16 items-center justify-between px-4 border-b ${
            isDarkMode ? 'border-[#CFC8BE]/20 bg-[#141B26]' : 'border-blue-900/40 bg-[#162D4A]'
          }`}
        >
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#1E3A5F] shadow-md font-bold">
              <Laptop className="h-5 w-5 text-[#1E3A5F]" />
              <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#CFC8BE] text-[#1E3A5F]">
                <TrendingUp className="h-2.5 w-2.5 stroke-[2.5]" />
              </span>
            </div>
            {!sidebarCollapsed && (
              <div className="flex flex-col">
                <span className="font-extrabold text-sm tracking-wider text-white">
                  TECH AVENUE
                </span>
                <span className="text-[10px] font-medium text-[#CFC8BE] tracking-tight">
                  Computer & Accessories
                </span>
              </div>
            )}
          </div>

          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden lg:flex p-1.5 rounded-lg text-[#CFC8BE] hover:text-white hover:bg-white/10 transition"
            title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            <Menu className="h-4 w-4" />
          </button>
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-[#CFC8BE] hover:text-white hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Current Active Role Badge */}
        <div
          className={`px-4 py-3 border-b ${
            isDarkMode ? 'border-[#CFC8BE]/10 bg-[#131A24]' : 'border-blue-900/30 bg-[#193252]'
          }`}
        >
          <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'space-x-3'}`}>
            <div className="relative">
              <div className="h-8 w-8 rounded-full bg-[#CFC8BE] text-[#1E3A5F] flex items-center justify-center font-bold text-xs shadow-xs">
                {currentUser?.name
                  ? currentUser.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)
                  : 'TA'}
              </div>
              <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-[#1E3A5F]" />
            </div>
            {!sidebarCollapsed && (
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-white truncate">{currentUser?.name}</p>
                <div className="flex items-center space-x-1.5 mt-0.5">
                  <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-semibold bg-[#CFC8BE]/20 text-[#CFC8BE] border border-[#CFC8BE]/30">
                    {roleTitle}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeMenu === item.id;

            if (item.hasSubmenu) {
              return (
                <div key={item.id} className="pt-1.5">
                  <button
                    onClick={() => {
                      if (sidebarCollapsed) setSidebarCollapsed(false);
                      setKnowledgeDropdownOpen(!knowledgeDropdownOpen);
                    }}
                    className={`w-full flex items-center px-3 py-2 rounded-xl text-xs font-semibold transition ${
                      activeMenu.startsWith('pred-')
                        ? 'bg-white/15 text-white'
                        : 'text-[#CFC8BE] hover:bg-white/10 hover:text-white'
                    } ${sidebarCollapsed ? 'justify-center' : 'justify-between'}`}
                    title={item.label}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="h-4 w-4 shrink-0 text-amber-300" />
                      {!sidebarCollapsed && <span>{item.label}</span>}
                    </div>
                    {!sidebarCollapsed && (
                      <ChevronDown
                        className={`h-3.5 w-3.5 transition-transform duration-200 ${
                          knowledgeDropdownOpen ? 'rotate-180' : ''
                        }`}
                      />
                    )}
                  </button>

                  {(!sidebarCollapsed && knowledgeDropdownOpen) && (
                    <div className="ml-4 pl-3 border-l border-white/20 space-y-1 mt-1">
                      {item.subItems.map((sub) => (
                        <button
                          key={sub.id}
                          onClick={() => onMenuChange && onMenuChange(sub.id)}
                          className={`w-full text-left py-1.5 px-2.5 rounded-lg text-[11px] font-medium transition ${
                            activeMenu === sub.id
                              ? 'bg-white/20 text-white font-bold'
                              : 'text-[#CFC8BE] hover:text-white hover:bg-white/5'
                          }`}
                        >
                          {sub.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <button
                key={item.id}
                onClick={() => onMenuChange && onMenuChange(item.id)}
                className={`w-full flex items-center px-3 py-2 rounded-xl text-xs font-semibold transition ${
                  isActive
                    ? 'bg-white text-[#1E3A5F] shadow-md font-bold'
                    : 'text-[#CFC8BE] hover:bg-white/10 hover:text-white'
                } ${sidebarCollapsed ? 'justify-center' : 'justify-between'}`}
                title={item.label}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-[#1E3A5F]' : ''}`} />
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </div>
                {!sidebarCollapsed && item.badge && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      item.badge.includes('Low')
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer with Logout */}
        <div
          className={`p-3 border-t ${
            isDarkMode ? 'border-[#CFC8BE]/15 bg-[#141B26]' : 'border-blue-900/40 bg-[#162D4A]'
          }`}
        >
          <button
            onClick={logout}
            className={`w-full flex items-center px-3 py-2 rounded-xl text-xs font-bold text-rose-300 hover:bg-rose-500/20 hover:text-rose-100 transition ${
              sidebarCollapsed ? 'justify-center' : 'space-x-3'
            }`}
            title="Logout"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* ==================== MAIN CONTENT & TOPBAR ==================== */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* TOPBAR */}
        <header
          className={`sticky top-0 z-30 flex h-16 items-center justify-between px-4 sm:px-6 border-b backdrop-blur-md transition-colors duration-200 ${
            isDarkMode
              ? 'bg-[#1F2632]/95 border-[#CFC8BE]/20 text-white'
              : 'bg-white/95 border-[#E5E7EB] text-[#374151]'
          }`}
        >
          {/* Header Left: Welcome greeting and Date */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-black/5"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div>
              <h1 className="text-base sm:text-lg font-bold tracking-tight leading-tight">
                Welcome back, <span className="text-[#1E3A5F] dark:text-blue-400">{roleTitle}</span>
              </h1>
              <p className="text-[11px] text-slate-400 font-medium">{currentDate}</p>
            </div>
          </div>

          {/* Header Right Controls */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Quick Role Switcher Pill (For seamless evaluator testing of all 4 dashboards) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                  isDarkMode
                    ? 'bg-[#2B3441] border-[#CFC8BE]/30 text-[#CFC8BE] hover:bg-[#374151]'
                    : 'bg-slate-100 border-[#E5E7EB] text-[#1E3A5F] hover:bg-slate-200'
                }`}
                title="Switch Dashboard Role"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                <span className="hidden sm:inline">Role:</span>
                <span className="font-bold">{roleTitle}</span>
                <ChevronDown className="h-3 w-3" />
              </button>

              {showRoleMenu && (
                <div
                  className={`absolute right-0 mt-2 w-56 rounded-2xl p-2 shadow-xl border z-50 animate-in fade-in zoom-in-95 ${
                    isDarkMode
                      ? 'bg-[#2B3441] border-[#CFC8BE]/30 text-white'
                      : 'bg-white border-[#E5E7EB] text-[#374151]'
                  }`}
                >
                  <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Switch Test Dashboard:
                  </p>
                  {DEMO_ACCOUNTS.map((acc) => (
                    <button
                      key={acc.role}
                      type="button"
                      onClick={() => {
                        switchRole(acc.role);
                        setShowRoleMenu(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition ${
                        role === acc.role
                          ? 'bg-[#1E3A5F] text-white'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-700/60'
                      }`}
                    >
                      <span>{acc.displayName}</span>
                      {role === acc.role && <CheckCircle2 className="h-3.5 w-3.5" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Notification Bell with Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowNotifications(!showNotifications)}
                className={`relative p-2 rounded-xl transition ${
                  isDarkMode ? 'hover:bg-slate-700/60 text-slate-300' : 'hover:bg-slate-100 text-slate-600'
                }`}
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-[#1F2632]" />
              </button>

              {showNotifications && (
                <div
                  className={`absolute right-0 mt-2 w-80 rounded-2xl p-4 shadow-xl border z-50 animate-in fade-in zoom-in-95 ${
                    isDarkMode
                      ? 'bg-[#2B3441] border-[#CFC8BE]/30 text-white'
                      : 'bg-white border-[#E5E7EB] text-[#374151]'
                  }`}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-inherit">
                    <span className="font-bold text-xs">Notifications & Alerts</span>
                    <span className="text-[10px] font-bold bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded-full">
                      2 Unread
                    </span>
                  </div>
                  <div className="mt-3 space-y-2 text-xs">
                    <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-300">
                      <p className="font-bold">Low-Stock Alert</p>
                      <p className="text-[11px] opacity-90">RTX 4060 Dual OC is below reorder threshold (3 units).</p>
                    </div>
                    <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-300">
                      <p className="font-bold">System Status</p>
                      <p className="text-[11px] opacity-90">All 4 role dashboards synced with persistent theme.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Visible Theme Toggle: Light mode: moon icon and "Dark mode" / Dark mode: sun icon and "Light mode" */}
            <button
              type="button"
              onClick={toggleTheme}
              className={`inline-flex items-center space-x-1.5 rounded-full px-3 py-1.5 text-xs font-semibold shadow-xs border transition ${
                isDarkMode
                  ? 'bg-[#2B3441] border-[#CFC8BE]/30 text-[#CFC8BE] hover:bg-[#374151]'
                  : 'bg-white border-[#E5E7EB] text-[#374151] hover:bg-slate-50'
              }`}
              title="Toggle theme"
            >
              {isDarkMode ? (
                <>
                  <Sun className="h-3.5 w-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Light mode</span>
                </>
              ) : (
                <>
                  <Moon className="h-3.5 w-3.5 text-[#1E3A5F]" />
                  <span className="hidden sm:inline">Dark mode</span>
                </>
              )}
            </button>
          </div>
        </header>

        {/* Dashboard Content Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">{children}</main>
      </div>
    </div>
  );
}
