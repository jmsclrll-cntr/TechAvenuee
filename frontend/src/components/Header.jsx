import React, { useState, useEffect } from 'react';
import { 
  Sun, 
  Moon, 
  Bell, 
  User, 
  Clock, 
  ShieldCheck, 
  AlertTriangle,
  CheckCircle2,
  Truck
} from 'lucide-react';

export default function Header({ user, darkMode, setDarkMode, role, shiftInfo, lowStockCount = 0 }) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    switch (role) {
      case 'inventory_clerk':
        return 'Welcome back, Inventory Clerk';
      case 'sales_personnel':
        return 'Welcome back, Sales Personnel';
      case 'instructor':
        return 'Welcome back, Instructor';
      case 'admin':
      default:
        return 'Welcome back, Admin';
    }
  };

  const formattedDate = currentTime.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  const formattedTime = currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-darkbg-card/95 backdrop-blur-md border-b border-gray-200 dark:border-darkbg-border px-6 py-3.5 transition-colors">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Role Greeting & Dynamic Subtext */}
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
              {getGreeting()}
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-navy/10 text-navy dark:bg-darkbg-hover dark:text-greige border border-navy/20 dark:border-darkbg-border">
              <ShieldCheck className="w-3.5 h-3.5 text-navy dark:text-greige" />
              {role ? role.replace('_', ' ').toUpperCase() : 'USER'}
            </span>
          </div>

          <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {formattedDate} • {formattedTime}
            </span>

            {/* Sales Personnel Shift Indicator */}
            {role === 'sales_personnel' && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Cashier: {user?.full_name || 'Active'} • {shiftInfo ? `Shift #${shiftInfo.id} Active` : 'Shift Active'}
              </span>
            )}

            {/* Instructor Inspection Indicator */}
            {role === 'instructor' && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium">
                Operational Inspection & Audit Mode
              </span>
            )}

            {/* Low-Stock Notification Badge */}
            {lowStockCount > 0 && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium">
                <AlertTriangle className="w-3.5 h-3.5" />
                {lowStockCount} items below reorder level
              </span>
            )}
          </div>
        </div>

        {/* Right: Actions, Notifications, Theme Toggle, Profile */}
        <div className="flex items-center gap-3">
          {/* THEME TOGGLE */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-darkbg-border bg-gray-50 dark:bg-darkbg hover:bg-gray-100 dark:hover:bg-darkbg-hover text-gray-700 dark:text-gray-200 text-xs font-medium transition-all shadow-sm"
            title="Toggle color theme"
          >
            {darkMode ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">Light mode</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-navy" />
                <span className="hidden sm:inline">Dark mode</span>
              </>
            )}
          </button>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg border border-gray-200 dark:border-darkbg-border bg-gray-50 dark:bg-darkbg hover:bg-gray-100 dark:hover:bg-darkbg-hover text-gray-700 dark:text-gray-200 transition-colors"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {lowStockCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                  {lowStockCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 rounded-xl bg-white dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-border shadow-xl p-3 z-50">
                <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-darkbg-border">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white">Store Alerts</h4>
                  <span className="text-[10px] text-gray-400">Real-time</span>
                </div>
                <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
                  {lowStockCount > 0 && (
                    <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold">Low-Stock Alert</p>
                        <p className="text-[11px] text-amber-700 dark:text-amber-400">{lowStockCount} products are at or below reorder threshold.</p>
                      </div>
                    </div>
                  )}
                  <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">POS System Ready</p>
                      <p className="text-[11px] text-emerald-700 dark:text-emerald-400">MySQL Database and transaction engine operational.</p>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-navy/5 dark:bg-darkbg-hover border border-navy/10 dark:border-darkbg-border text-xs text-gray-700 dark:text-gray-300 flex items-start gap-2">
                    <Truck className="w-4 h-4 text-navy dark:text-greige shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Purchasing System Online</p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">Purchase orders and stock receiving ready.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Badge */}
          <div className="flex items-center gap-2.5 pl-2 border-l border-gray-200 dark:border-darkbg-border">
            <div className="w-8 h-8 rounded-full bg-navy text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">
              {user?.full_name ? user.full_name.charAt(0) : 'U'}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold text-gray-900 dark:text-white leading-tight">
                {user?.full_name || 'User'}
              </p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 capitalize">
                {user?.role ? user.role.replace('_', ' ') : 'Role'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
