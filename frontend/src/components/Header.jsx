import React, { useState, useEffect, useRef } from 'react';
import {
  Sun,
  Clock,
  ShieldCheck,
  AlertTriangle,
  PanelLeftClose,
  PanelLeftOpen,
  BookOpen,
  Maximize,
  ChevronDown,
  LogOut,
  ExternalLink,
  LayoutDashboard,
  Package,
  Receipt,
  Users,
  Truck,
  BarChart3,
  BrainCircuit,
  ChevronUp,
  ArrowDownLeft,
  ArrowUpRight,
  History,
  ShoppingCart,
  Search,
  Database,
  Cpu,
  GitCompare,
  Save
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
  onOpenManual,
  activeTab,
  setActiveTab,
  onLogout
}) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [hoveredId, setHoveredId] = useState(null);
  const [predictionDropdownOpen, setPredictionDropdownOpen] = useState(false);
  const userMenuRef = useRef(null);
  const triggerButtonRef = useRef(null);
  const predictionMenuRef = useRef(null);

  const currentRole = user?.role || role || 'admin';

  const getNavItems = () => {
    switch (currentRole) {
      case 'inventory_clerk':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'inventory', label: 'Inventory', icon: Package },
          { id: 'stock_in', label: 'Stock In', icon: ArrowDownLeft },
          { id: 'stock_out', label: 'Stock Out', icon: ArrowUpRight },
          { id: 'movements', label: 'Movements', icon: History },
          { id: 'suppliers', label: 'Suppliers', icon: Truck }
        ];

      case 'sales_personnel':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'pos', label: 'Point of Sale', icon: ShoppingCart },
          { id: 'sales_history', label: 'Sales History', icon: History },
          { id: 'product_lookup', label: 'Product Lookup', icon: Search }
        ];

      case 'instructor':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'datasets', label: 'Datasets', icon: Database },
          { id: 'train', label: 'Training', icon: Cpu },
          { id: 'compare', label: 'Compare', icon: GitCompare },
          { id: 'saved_models', label: 'Saved Models', icon: Save },
          { id: 'prediction_history', label: 'History', icon: History }
        ];

      case 'admin':
      default:
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'inventory', label: 'Inventory', icon: Package },
          { id: 'sales', label: 'Sales', icon: Receipt },
          { id: 'users', label: 'Users', icon: Users },
          { id: 'purchasing', label: 'Suppliers', icon: Truck },
          { id: 'reports', label: 'Reports', icon: BarChart3 }
        ];
    }
  };

  const navItems = getNavItems();

  const predictionSubItems = [
    { id: 'pred_demand', label: 'Product Demand Prediction' },
    { id: 'pred_sales', label: 'Sales Prediction' },
    { id: 'pred_slow_moving', label: 'Slow-Moving Products' },
    { id: 'pred_best_selling', label: 'Best-Selling Products' }
  ];

  const isPredictionActive = predictionSubItems.some(item => item.id === activeTab);

  // Close prediction dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (predictionMenuRef.current && !predictionMenuRef.current.contains(e.target)) {
        setPredictionDropdownOpen(false);
        setHoveredId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const {
    scalePercent,
    setScalePercent,
  } = useTextSize();

  // Distinct supported text size scale steps: 88%, 100%, 115%
  const TEXT_SCALE_STEPS = [88, 100, 115];
  const currentStepIdx = TEXT_SCALE_STEPS.findIndex(s => Math.abs(s - scalePercent) <= 4);
  const activeStepIdx = currentStepIdx !== -1 ? currentStepIdx : (scalePercent < 94 ? 0 : scalePercent > 107 ? 2 : 1);
  const activePercentDisplay = TEXT_SCALE_STEPS[activeStepIdx];

  const handleDecreaseText = () => {
    if (activeStepIdx > 0) {
      setScalePercent(TEXT_SCALE_STEPS[activeStepIdx - 1]);
    }
  };

  const handleIncreaseText = () => {
    if (activeStepIdx < TEXT_SCALE_STEPS.length - 1) {
      setScalePercent(TEXT_SCALE_STEPS[activeStepIdx + 1]);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Trap focus & keyboard accessibility for the dropdown menu
  useEffect(() => {
    function handleClickOutside(e) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    }

    function handleKeyDown(e) {
      if (!showUserMenu) return;
      if (e.key === 'Escape') {
        setShowUserMenu(false);
        if (triggerButtonRef.current) triggerButtonRef.current.focus();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showUserMenu]);

  // Close on activeTab route change
  useEffect(() => {
    setShowUserMenu(false);
  }, [activeTab]);

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

  const handleSignOutClick = () => {
    const hasUnsaved = window.__TECHAVENUE_UNSAVED_CHANGES__ === true;
    if (hasUnsaved) {
      const confirmed = window.confirm('You have unsaved changes that will be lost. Are you sure you want to sign out?');
      if (!confirmed) return;
    }
    setShowUserMenu(false);
    if (onLogout) onLogout();
  };

  const userInitial = user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'C';
  const userName = user?.full_name || 'Carl Cantre';
  const userEmail = user?.email || (user?.username ? `${user.username}@techavenue.com` : 'admin@techavenue.com');
  const roleDisplay = (user?.role || role || 'admin').replace('_', ' ');
  const capitalizedRole = roleDisplay.charAt(0).toUpperCase() + roleDisplay.slice(1);

  return (
    <header className="sticky top-0 z-30 transition-colors bg-[#1C1917] border-b border-[#292524] px-3 sm:px-6 py-2.5 shadow-md">
      <div className="flex items-center justify-between gap-4 max-w-[1700px] mx-auto">
        {/* Left: Brand / Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#F97316] p-1.5 flex items-center justify-center shrink-0 shadow-lg shadow-orange-950/30">
              <span className="font-black text-white text-xs">TA</span>
            </div>
            <div className="hidden xl:block leading-tight select-none">
              <span className="font-black text-sm tracking-tight text-white block">
                TECH AVENUE
              </span>
              <span className="text-[10px] text-stone-400 font-semibold block uppercase tracking-wider">
                Computer &amp; Accessories
              </span>
            </div>
            <span className="hidden 2xl:inline-block ml-1 px-2.5 py-0.5 rounded text-[10px] font-bold bg-[#292524] text-[#FB923C] border border-[#44403C] capitalize">
              {roleDisplay}
            </span>
          </div>

          {lowStockCount > 0 && currentRole !== 'admin' && (
            <span className="hidden md:flex items-center gap-1 ml-2 px-2 py-0.5 rounded bg-amber-500/10 text-[#FB923C] font-bold border border-amber-500/20 text-xs">
              <AlertTriangle className="w-3.5 h-3.5" />
              {lowStockCount} low stock
            </span>
          )}
        </div>

        {/* Navigation Bar for all roles (positioned beside brand, right before user profile) */}
        <nav
          aria-label="Main Navigation"
          className="ml-auto flex items-center gap-2 sm:gap-2.5 overflow-visible"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const isHovered = hoveredId === item.id;
            const isExpanded = isActive || isHovered;

            return (
              <button
                key={item.id}
                type="button"
                onMouseEnter={() => setHoveredId(item.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => {
                  if (setActiveTab) setActiveTab(item.id);
                  setPredictionDropdownOpen(false);
                }}
                title={item.label}
                className={`relative flex items-center justify-center h-10 sm:h-11 rounded-full transition-all duration-300 ease-out cursor-pointer active:scale-95 ${isExpanded
                  ? 'px-3.5 sm:px-4.5 shadow-lg'
                  : 'w-10 sm:w-11 px-0'
                  } ${isActive
                    ? 'bg-[#F97316] text-white font-black shadow-lg shadow-orange-950/40 ring-2 ring-orange-400/40'
                    : 'text-stone-300 hover:text-white hover:bg-white/10'
                  }`}
              >
                {/* Icon: Always remains visible */}
                <Icon className="w-4.5 h-4.5 sm:w-5 sm:h-5 shrink-0 transition-transform duration-200" />

                {/* Text: When clicked/active or hovered, remains visible alongside the icon */}
                <span
                  className={`whitespace-nowrap overflow-hidden transition-all duration-300 ease-out text-xs sm:text-sm font-extrabold leading-none select-none ${isExpanded
                    ? 'max-w-[260px] opacity-100 ml-2 inline-block'
                    : 'max-w-0 opacity-0 ml-0 pointer-events-none'
                    }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}

          {/* For Admin: Add the Knowledge Analysis & Prediction Downward Dropdown */}
          {currentRole === 'admin' && (
            <>
              {/* Separator Line */}
              <div className="w-[1px] h-5 bg-[#292524] mx-1 shrink-0" />

              <div ref={predictionMenuRef} className="relative shrink-0">
                {(() => {
                  const isHovered = hoveredId === 'predictions';
                  const isExpanded = isPredictionActive || isHovered || predictionDropdownOpen;

                  return (
                    <button
                      type="button"
                      onMouseEnter={() => setHoveredId('predictions')}
                      onMouseLeave={() => {
                        if (!predictionDropdownOpen) {
                          setHoveredId(null);
                        }
                      }}
                      onClick={() => {
                        setPredictionDropdownOpen(!predictionDropdownOpen);
                        setHoveredId('predictions');
                      }}
                      title="Knowledge Analysis & Prediction"
                      className={`relative flex items-center justify-center h-10 sm:h-11 rounded-full transition-all duration-300 ease-out cursor-pointer active:scale-95 ${isExpanded
                        ? 'px-3.5 sm:px-4.5 shadow-lg'
                        : 'w-10 sm:w-11 px-0'
                        } ${isPredictionActive
                          ? 'bg-[#F97316] text-white font-black shadow-lg shadow-orange-950/40 ring-2 ring-orange-400/40'
                          : 'text-stone-300 hover:text-white hover:bg-white/10'
                        }`}
                    >
                      {/* Icon */}
                      <BrainCircuit className="w-4.5 h-4.5 sm:w-5 sm:h-5 shrink-0 transition-transform duration-200" />

                      {/* Text & Chevron */}
                      <span
                        className={`whitespace-nowrap overflow-hidden transition-all duration-300 ease-out text-xs sm:text-sm font-extrabold leading-none select-none flex items-center gap-1.5 ${isExpanded
                          ? 'max-w-[300px] opacity-100 ml-2 inline-flex'
                          : 'max-w-0 opacity-0 ml-0 pointer-events-none'
                          }`}
                      >
                        <span>Prediction Modules</span>
                        <ChevronDown
                          className={`w-3.5 h-3.5 transition-transform duration-200 ${predictionDropdownOpen ? 'rotate-180' : ''
                            }`}
                        />
                      </span>
                    </button>
                  );
                })()}

                {/* Downward Submenu with Fade-in */}
                {predictionDropdownOpen && (
                  <div className="absolute top-full mt-2.5 right-0 w-72 rounded-2xl bg-[#1C1917]/98 backdrop-blur-xl border border-[#292524] shadow-[0_18px_45px_rgba(0,0,0,0.75),0_0_0_1px_rgba(255,255,255,0.08)] p-2.5 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-3 py-1.5 text-[11px] uppercase font-bold tracking-wider text-stone-400 border-b border-[#292524]/70 mb-1.5">
                      Prediction &amp; Intelligence
                    </div>
                    {predictionSubItems.map((sub) => {
                      const isSubActive = activeTab === sub.id;
                      return (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => {
                            if (setActiveTab) setActiveTab(sub.id);
                            setPredictionDropdownOpen(false);
                            setHoveredId(null);
                          }}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${isSubActive
                            ? 'bg-[#F97316] text-white shadow-md'
                            : 'text-stone-300 hover:text-white hover:bg-white/10'
                            }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full shrink-0 ${isSubActive ? 'bg-white' : 'bg-stone-500'
                              }`}
                          />
                          <span>{sub.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </nav>

        {/* Right: User Profile & System Controls Dropdown */}
        <div ref={userMenuRef} className="relative shrink-0">
          <button
            ref={triggerButtonRef}
            type="button"
            onClick={() => setShowUserMenu(!showUserMenu)}
            className={`flex items-center gap-2.5 py-1.5 px-3 rounded-xl border transition-all cursor-pointer select-none group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316] ${showUserMenu
              ? 'bg-[#292524] border-[#F97316] text-white shadow-md'
              : 'bg-[#1C1917] border-[#292524] hover:bg-[#292524] text-white'
              }`}
            aria-haspopup="menu"
            aria-expanded={showUserMenu}
            aria-label="User Account Menu"
          >
            {/* Avatar with Green Online Dot */}
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-[#EA580C] text-white flex items-center justify-center font-black text-xs uppercase shadow-sm shrink-0">
                {userInitial}
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#10b981] ring-2 ring-[#1C1917]" />
            </div>

            {/* Name and Role Label */}
            <div className="text-left leading-tight hidden xs:block sm:block">
              <p className="text-xs font-bold text-[#FAFAF9] truncate max-w-[150px]">
                {userName}
              </p>
              <p className="text-[10px] font-medium text-stone-400 capitalize truncate">
                {roleDisplay}
              </p>
            </div>

            <ChevronDown
              className={`w-3.5 h-3.5 text-stone-400 group-hover:text-white transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''
                }`}
            />
          </button>

          {/* Profile Dropdown Menu */}
          {showUserMenu && (
            <>
              <div
                className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 sm:hidden animate-in fade-in duration-150"
                onClick={() => setShowUserMenu(false)}
                aria-hidden="true"
              />

              <div
                className="absolute right-0 top-full mt-2.5 z-50 w-[310px] sm:w-[325px] rounded-2xl bg-[#1C1917] border border-[#292524] shadow-[0_20px_50px_rgba(0,0,0,0.85)] p-4 text-white animate-in fade-in slide-in-from-top-2 duration-150"
                role="menu"
                aria-orientation="vertical"
              >
                {/* User Identity Header */}
                <div className="flex items-center gap-3 pb-3.5 border-b border-[#292524]">
                  <div className="relative">
                    <div className="w-11 h-11 rounded-full bg-[#EA580C] text-white flex items-center justify-center font-bold text-base shadow-inner shrink-0">
                      {userInitial}
                    </div>
                    <span
                      className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#10b981] ring-2 ring-[#1C1917]"
                      title="Online"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-[#FAFAF9] truncate leading-snug">
                      {userName}
                    </h3>
                    <p className="text-[11px] text-stone-400 truncate leading-snug">
                      {userEmail}
                    </p>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#292524] text-[#FB923C] uppercase tracking-wide">
                      {capitalizedRole}
                    </span>
                  </div>
                </div>

                {/* System Settings & Fullscreen Controls */}
                <div className="py-3 space-y-2.5 border-b border-[#292524]">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-stone-300 font-semibold">Full Screen Mode</span>
                    <button
                      type="button"
                      onClick={toggleFullscreen}
                      className="px-2.5 py-1 rounded-lg bg-[#292524] hover:bg-[#44403C] text-xs font-bold text-stone-200 transition-colors"
                    >
                      {isFullscreen ? 'Exit Full Screen' : 'Go Full Screen'}
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-stone-300 font-semibold">Text Scaling</span>
                    <div className="flex items-center gap-1.5 bg-[#141210] border border-[#292524] rounded-lg p-0.5">
                      <button
                        type="button"
                        onClick={handleDecreaseText}
                        disabled={activeStepIdx === 0}
                        className="px-2 py-0.5 rounded text-xs font-bold text-stone-300 disabled:opacity-30 hover:bg-white/10"
                      >
                        A-
                      </button>
                      <span className="text-xs font-mono text-[#F97316] px-1 font-bold">
                        {activePercentDisplay}%
                      </span>
                      <button
                        type="button"
                        onClick={handleIncreaseText}
                        disabled={activeStepIdx === TEXT_SCALE_STEPS.length - 1}
                        className="px-2 py-0.5 rounded text-xs font-bold text-stone-300 disabled:opacity-30 hover:bg-white/10"
                      >
                        A+
                      </button>
                    </div>
                  </div>
                </div>

                {/* System Guide & Manual */}
                <div className="py-2.5 border-b border-[#292524]">
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserMenu(false);
                      if (onOpenManual) onOpenManual();
                    }}
                    className="w-full flex items-center justify-between py-1.5 px-2 rounded-lg text-left text-xs font-semibold text-stone-300 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-[#F97316]" />
                      <span>System Guide &amp; Manual</span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-stone-500" />
                  </button>
                </div>

                {/* Sign Out Button */}
                {onLogout && (
                  <button
                    type="button"
                    onClick={handleSignOutClick}
                    className="w-full mt-3 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-all cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign out</span>
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
