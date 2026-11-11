import React, { useState, useEffect, useRef } from 'react';
import { 
  Sun, 
  Moon, 
  Bell, 
  Clock, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Truck, 
  PanelLeftClose, 
  PanelLeftOpen, 
  Type, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  SlidersHorizontal,
  BookOpen,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { useTextSize } from '../context/TextSizeContext';

export default function Header({ 
  user, 
  darkMode, 
  setDarkMode, 
  role, 
  shiftInfo, 
  lowStockCount = 0, 
  sidebarCollapsed, 
  setSidebarCollapsed,
  onOpenManual
}) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showNotifications, setShowNotifications] = useState(false);
  const [showTextSizeDropdown, setShowTextSizeDropdown] = useState(false);

  const textSizeRef = useRef(null);
  const notificationsRef = useRef(null);

  const {
    scalePercent,
    setScalePercent,
    decreaseScale,
    increaseScale,
    resetScale,
    minScale,
    maxScale,
    defaultScale,
  } = useTextSize();

  const isMin = scalePercent <= minScale;
  const isMax = scalePercent >= maxScale;
  const isDefault = scalePercent === defaultScale;

  // Track fill percentage for the slider
  const fillPercent = Math.max(
    0,
    Math.min(100, ((scalePercent - minScale) / (maxScale - minScale)) * 100)
  );

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Close dropdowns when clicking outside or on Escape key
  useEffect(() => {
    function handleClickOutside(e) {
      if (textSizeRef.current && !textSizeRef.current.contains(e.target)) {
        setShowTextSizeDropdown(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    }

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setShowTextSizeDropdown(false);
        setShowNotifications(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Synchronized Full Screen mode state for Dashboard
  const [isFullscreen, setIsFullscreen] = useState(() => {
    return Boolean(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement
    );
  });

  useEffect(() => {
    const handleFsChange = () => {
      const isFs = Boolean(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );
      setIsFullscreen(isFs);
    };

    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    document.addEventListener('mozfullscreenchange', handleFsChange);
    document.addEventListener('MSFullscreenChange', handleFsChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
      document.removeEventListener('mozfullscreenchange', handleFsChange);
      document.removeEventListener('MSFullscreenChange', handleFsChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    try {
      const docEl = document.documentElement;
      const isCurrentlyFs = Boolean(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );

      if (!isCurrentlyFs) {
        if (docEl.requestFullscreen) {
          await docEl.requestFullscreen();
        } else if (docEl.webkitRequestFullscreen) {
          await docEl.webkitRequestFullscreen();
        } else if (docEl.mozRequestFullScreen) {
          await docEl.mozRequestFullScreen();
        } else if (docEl.msRequestFullscreen) {
          await docEl.msRequestFullscreen();
        }
        localStorage.setItem('techavenue_fullscreen', 'true');
        if (setSidebarCollapsed) setSidebarCollapsed(true);
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          await document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
          await document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) {
          await document.msExitFullscreen();
        }
        localStorage.setItem('techavenue_fullscreen', 'false');
      }
    } catch (err) {
      console.warn('Fullscreen toggle failed:', err);
    }
  };

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
        {/* Left: Sidebar Toggle + Role Greeting & Dynamic Subtext */}
        <div className="flex items-center gap-3">
          {/* Sidebar Toggle / Auto-Hide Mode Button */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={`p-2 rounded-lg border transition-all shadow-sm cursor-pointer ${
              sidebarCollapsed
                ? 'border-gray-200 dark:border-darkbg-border bg-gray-50 dark:bg-darkbg hover:bg-gray-100 dark:hover:bg-darkbg-hover text-gray-500 hover:text-navy dark:hover:text-cyan-400'
                : 'border-navy/30 dark:border-cyan-400/30 bg-navy/10 dark:bg-cyan-500/15 text-navy dark:text-cyan-300'
            }`}
            title={sidebarCollapsed ? 'Auto-Hide Mode: Hover left edge line to reveal navigation (Click to pin open)' : 'Navigation Pinned: Click to enable fullscreen auto-hide mode'}
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen className="w-4 h-4" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </button>

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
        </div>

        {/* Right: Actions, Text Size Popover, Theme Toggle, Notifications, Profile */}
        <div className="flex items-center gap-2.5">
          {/* ========================================================================= */}
          {/* TEXT SIZE BUTTON WITH COMPACT POPOVER (Positioned next to Light Mode)     */}
          {/* ========================================================================= */}
          <div ref={textSizeRef} className="relative">
            <button
              type="button"
              onClick={() => setShowTextSizeDropdown(!showTextSizeDropdown)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all shadow-sm cursor-pointer ${
                showTextSizeDropdown
                  ? 'border-navy dark:border-cyan-400 bg-navy/10 dark:bg-cyan-500/15 text-navy dark:text-cyan-300 ring-2 ring-navy/20 dark:ring-cyan-500/20'
                  : 'border-gray-200 dark:border-darkbg-border bg-gray-50 dark:bg-darkbg hover:bg-gray-100 dark:hover:bg-darkbg-hover text-gray-700 dark:text-gray-200'
              }`}
              title="Adjust Text Size and Display Scale"
              aria-label="Text Size"
              aria-expanded={showTextSizeDropdown}
            >
              <Type className="w-4 h-4 text-navy dark:text-cyan-400" />
              <span className="hidden sm:inline">Text Size</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-bold">
                {scalePercent}%
              </span>
            </button>

            {/* COMPACT POPOVER DROPDOWN (ONLY SHOWS ON CLICK, MATCHES BUTTON PROPORTION) */}
            {showTextSizeDropdown && (
              <div
                className="absolute right-0 top-full mt-2 w-56 sm:w-60 rounded-xl bg-white dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-border shadow-xl p-3 z-50 animate-in fade-in zoom-in-95 duration-100 select-none"
                style={{ fontSize: '0.75rem' }} /* Maintain fixed scale for popup itself */
              >
                {/* Mini Header */}
                <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-gray-100 dark:border-darkbg-border">
                  <div className="flex items-center gap-1.5">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-navy dark:text-cyan-400" />
                    <span className="font-bold text-[11px] text-gray-800 dark:text-gray-200">
                      Display Scale
                    </span>
                  </div>
                  <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded bg-navy/10 dark:bg-cyan-500/20 text-navy dark:text-cyan-300 border border-navy/20 dark:border-cyan-400/30">
                    {scalePercent}%
                  </span>
                </div>

                {/* Compact Slider Row: ZoomOut + Track + ZoomIn */}
                <div className="flex items-center gap-1.5 py-0.5">
                  <button
                    type="button"
                    onClick={() => decreaseScale(5)}
                    disabled={isMin}
                    className={`p-1 rounded-md border border-gray-200 dark:border-darkbg-border bg-gray-50 dark:bg-darkbg hover:bg-gray-100 dark:hover:bg-darkbg-hover text-gray-700 dark:text-gray-200 transition-all cursor-pointer ${
                      isMin ? 'opacity-30 cursor-not-allowed' : 'active:scale-95'
                    }`}
                    title="Decrease by 5%"
                    aria-label="Decrease scale"
                  >
                    <ZoomOut className="w-3 h-3" />
                  </button>

                  <div className="relative flex-1 flex items-center py-0.5">
                    <div className="absolute inset-x-0 h-1.5 rounded-full bg-gray-200 dark:bg-slate-700 overflow-hidden pointer-events-none">
                      <div
                        className="h-full bg-gradient-to-r from-navy to-cyan-500 dark:from-blue-600 dark:to-cyan-400 transition-all duration-75"
                        style={{ width: `${fillPercent}%` }}
                      />
                    </div>
                    <input
                      type="range"
                      min={minScale}
                      max={maxScale}
                      step="1"
                      value={scalePercent}
                      onChange={(e) => setScalePercent(Number(e.target.value))}
                      className="text-size-slider-compact relative z-10 w-full"
                      aria-label="Display scale slider"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => increaseScale(5)}
                    disabled={isMax}
                    className={`p-1 rounded-md border border-gray-200 dark:border-darkbg-border bg-gray-50 dark:bg-darkbg hover:bg-gray-100 dark:hover:bg-darkbg-hover text-gray-700 dark:text-gray-200 transition-all cursor-pointer ${
                      isMax ? 'opacity-30 cursor-not-allowed' : 'active:scale-95'
                    }`}
                    title="Increase by 5%"
                    aria-label="Increase scale"
                  >
                    <ZoomIn className="w-3 h-3" />
                  </button>
                </div>

                {/* Compact Footer Landmarks & Reset */}
                <div className="flex justify-between items-center text-[10px] text-gray-400 dark:text-gray-500 mt-1.5 pt-1.5 border-t border-gray-100 dark:border-darkbg-border">
                  <span
                    className="cursor-pointer hover:text-gray-700 dark:hover:text-gray-300"
                    onClick={() => setScalePercent(minScale)}
                  >
                    {minScale}%
                  </span>

                  {!isDefault ? (
                    <button
                      type="button"
                      onClick={resetScale}
                      className="flex items-center gap-1 text-navy dark:text-cyan-400 hover:underline font-semibold cursor-pointer"
                      title="Reset to 100%"
                    >
                      <RotateCcw className="w-2.5 h-2.5" />
                      <span>100% Reset</span>
                    </button>
                  ) : (
                    <span className="font-medium text-navy dark:text-cyan-400">100% (Default)</span>
                  )}

                  <span
                    className="cursor-pointer hover:text-gray-700 dark:hover:text-gray-300"
                    onClick={() => setScalePercent(maxScale)}
                  >
                    {maxScale}%
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* USER MANUAL BUTTON                                                         */}
          {/* ========================================================================= */}
          <button
            type="button"
            onClick={onOpenManual}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-navy/20 dark:border-blue-500/30 bg-navy/5 dark:bg-blue-500/10 hover:bg-navy/10 dark:hover:bg-blue-500/20 text-navy dark:text-blue-400 text-xs font-bold transition-all shadow-sm cursor-pointer"
            title="Open Interactive System User Manual & Workflow Guides"
          >
            <BookOpen className="w-4 h-4 text-navy dark:text-blue-400" />
            <span className="hidden sm:inline">User Manual</span>
          </button>

          {/* ========================================================================= */}
          {/* THEME TOGGLE (LIGHT / DARK MODE BUTTON)                                    */}
          {/* ========================================================================= */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-darkbg-border bg-gray-50 dark:bg-darkbg hover:bg-gray-100 dark:hover:bg-darkbg-hover text-gray-700 dark:text-gray-200 text-xs font-medium transition-all shadow-sm cursor-pointer"
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

          {/* ========================================================================= */}
          {/* MINIMAL FULL SCREEN TOGGLE BUTTON                                         */}
          {/* ========================================================================= */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2 rounded-lg border border-gray-200 dark:border-darkbg-border bg-gray-50 dark:bg-darkbg hover:bg-gray-100 dark:hover:bg-darkbg-hover text-gray-700 dark:text-gray-200 transition-all shadow-sm cursor-pointer"
            title={isFullscreen ? 'Exit Full Screen (Esc)' : 'Full Screen Mode'}
            aria-label={isFullscreen ? 'Exit Full Screen' : 'Full Screen Mode'}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4 text-navy dark:text-cyan-300" />
            ) : (
              <Maximize2 className="w-4 h-4 text-navy dark:text-cyan-400" />
            )}
          </button>

          {/* Notifications Dropdown */}
          <div ref={notificationsRef} className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg border border-gray-200 dark:border-darkbg-border bg-gray-50 dark:bg-darkbg hover:bg-gray-100 dark:hover:bg-darkbg-hover text-gray-700 dark:text-gray-200 transition-colors cursor-pointer"
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
