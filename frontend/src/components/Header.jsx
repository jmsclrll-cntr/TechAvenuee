import React, { useState, useEffect, useRef } from 'react';
import {
  Sun,
  Clock,
  ShieldCheck,
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
  Save,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { useTextSize } from '../context/TextSizeContext';
import { useThemeColor } from '../context/ThemeColorContext';

const SMOOTH_TAB_TRANSITION = {
  transition: 'all 0.45s cubic-bezier(0.22, 1, 0.36, 1)'
};

export default function Header({
  user,
  darkMode,
  setDarkMode,
  role,
  activeWorkspace,
  setActiveWorkspace,
  shiftInfo,
  lowStockCount = 0,
  onOpenManual,
  activeTab,
  setActiveTab,
  onLogout
}) {
  const { themeId, setThemeId, currentTheme, THEME_PALETTES } = useThemeColor();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [hoveredId, setHoveredId] = useState(null);
  const [predictionDropdownOpen, setPredictionDropdownOpen] = useState(false);
  const userMenuRef = useRef(null);
  const triggerButtonRef = useRef(null);
  const predictionMenuRef = useRef(null);

  const isInstructor = user?.role === 'instructor';
  const effectiveRole = isInstructor ? (activeWorkspace || 'instructor') : (user?.role || role || 'admin');
  const currentRole = effectiveRole;

  // Role Workspaces configuration for Academic Instructor & system navigation
  const ROLE_WORKSPACES = [
    {
      id: 'admin',
      label: 'Admin',
      badge: 'Admin Workspace',
      icon: ShieldCheck,
      defaultTab: 'sales',
      subTabs: [
        { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
        { id: 'sales', label: 'Sales Audit', icon: Receipt },
        { id: 'users', label: 'Users', icon: Users },
        { id: 'purchasing', label: 'Suppliers', icon: Truck },
        { id: 'reports', label: 'Reports', icon: BarChart3 },
        { id: 'inventory', label: 'Inventory', icon: Package },
        { id: 'predictions', label: 'Prediction Modules', icon: BrainCircuit }
      ],
      hasPredictions: false
    },
    {
      id: 'inventory_clerk',
      label: 'Inventory Clerk',
      badge: 'Inventory Clerk Workspace',
      icon: Package,
      defaultTab: 'inventory',
      subTabs: [
        { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
        { id: 'inventory', label: 'Inventory', icon: Package },
        { id: 'stock_in', label: 'Stock-In', icon: ArrowDownLeft },
        { id: 'stock_out', label: 'Stock-Out', icon: ArrowUpRight },
        { id: 'movements', label: 'Movement', icon: History },
        { id: 'suppliers', label: 'Suppliers', icon: Truck }
      ],
      hasPredictions: false
    },
    {
      id: 'sales_personnel',
      label: 'Sales Personnel',
      badge: 'Sales Personnel Workspace',
      icon: ShoppingCart,
      defaultTab: 'pos',
      subTabs: [
        { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
        { id: 'pos', label: 'Point of Sale', icon: ShoppingCart },
        { id: 'sales_history', label: 'Sales History', icon: History },
        { id: 'product_lookup', label: 'Product Lookup', icon: Search }
      ],
      hasPredictions: false
    },
    {
      id: 'instructor',
      label: 'Instructor ML',
      badge: 'Academic Instructor ML Workspace',
      icon: BrainCircuit,
      defaultTab: 'dashboard',
      subTabs: [
        { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
        { id: 'datasets', label: 'Datasets', icon: Database },
        { id: 'train', label: 'Training', icon: Cpu },
        { id: 'compare', label: 'Compare Models', icon: GitCompare },
        { id: 'saved_models', label: 'Saved Models', icon: Save },
        { id: 'prediction_history', label: 'History', icon: History }
      ],
      hasPredictions: false
    }
  ];

  const currentWorkspaceConfig = ROLE_WORKSPACES.find(w => w.id === effectiveRole) || ROLE_WORKSPACES[3];

  const predictionSubItems = [
    { id: 'pred_demand', label: 'Product Demand Prediction' },
    { id: 'pred_sales', label: 'Sales Prediction' },
    { id: 'pred_slow_moving', label: 'Slow-Moving Products' },
    { id: 'pred_best_selling', label: 'Best-Selling Products' }
  ];

  const isPredictionActive = activeTab === 'predictions' || activeTab === 'prediction_modules' || predictionSubItems.some(item => item.id === activeTab);

  const handleSelectWorkspace = (targetWsId) => {
    if (setActiveWorkspace) {
      setActiveWorkspace(targetWsId);
    }
    const targetWs = ROLE_WORKSPACES.find(w => w.id === targetWsId);
    if (targetWs && setActiveTab) {
      if (activeTab !== 'dashboard') {
        const hasTab = targetWs.subTabs.some(t => t.id === activeTab || (t.id === 'predictions' && isPredictionActive)) || (targetWs.hasPredictions && isPredictionActive);
        if (!hasTab) {
          setActiveTab(targetWs.defaultTab);
        }
      }
    }
    setPredictionDropdownOpen(false);
  };

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
  const currentEffectiveRole = role || activeWorkspace || user?.role || 'admin';
  const isAdmin = currentEffectiveRole === 'admin';

  return (
    <header className="sticky top-0 z-30 transition-colors bg-[#1C1917] border-b border-[#292524] shadow-md">
      {/* Top Navigation Row */}
      <div className="px-3 sm:px-6 py-2.5">
        <div className="flex items-center justify-between gap-4 max-w-[1700px] mx-auto">
        {/* Left: Brand / Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div 
              className="w-9 h-9 rounded-xl p-1.5 flex items-center justify-center shrink-0 shadow-lg transition-all"
              style={{
                backgroundColor: currentTheme.primary,
                boxShadow: `0 8px 24px -4px ${currentTheme.primary}70`
              }}
            >
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
            {isInstructor ? (
              <div className="hidden xl:flex items-center gap-1.5 ml-1">
                <span 
                  className="px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wide transition-colors"
                  style={{
                    backgroundColor: 'var(--accent-glow)',
                    color: 'var(--accent-light)',
                    borderColor: 'var(--accent-border)'
                  }}
                >
                  Academic Instructor
                </span>
              </div>
            ) : (
              <span 
                className="inline-block ml-1 px-2.5 py-0.5 rounded text-[10px] font-bold border capitalize transition-colors"
                style={{
                  backgroundColor: 'var(--accent-glow)',
                  color: 'var(--accent-light)',
                  borderColor: 'var(--accent-border)'
                }}
              >
                {roleDisplay}
              </span>
            )}
          </div>
        </div>

        {/* Navigation Bar: Upper-Bar Role Switcher for Academic Instructor only */}
        {isInstructor && (
          <nav
            aria-label="Instructor Workspace Navigation"
            className="ml-auto flex items-center gap-2 sm:gap-2.5 overflow-visible"
          >
            {/* Role Workspaces Quick Buttons */}
            <div className="flex items-center gap-1 sm:gap-1.5 bg-[#141210] p-1 rounded-full border border-[#292524]">
              {ROLE_WORKSPACES.map((ws) => {
                const WsIcon = ws.icon;
                const isWsActive = effectiveRole === ws.id;

                return (
                  <button
                    key={ws.id}
                    type="button"
                    onClick={() => handleSelectWorkspace(ws.id)}
                    title={`Switch to ${ws.label} Workspace`}
                    style={isWsActive ? {
                      backgroundColor: 'var(--accent-primary)',
                      boxShadow: '0 4px 14px var(--accent-glow)',
                      outline: '1px solid var(--accent-border)',
                      ...SMOOTH_TAB_TRANSITION
                    } : SMOOTH_TAB_TRANSITION}
                    className={`relative flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer active:scale-95 ${
                      isWsActive
                        ? 'text-white font-black'
                        : 'text-stone-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <WsIcon className="w-4 h-4 shrink-0" />
                    <span className="whitespace-nowrap">{ws.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>
        )}

        {/* Right: User Profile & System Controls Dropdown */}
        <div ref={userMenuRef} className="relative shrink-0">
          <button
            ref={triggerButtonRef}
            type="button"
            onClick={() => setShowUserMenu(!showUserMenu)}
            className={`flex items-center gap-2.5 py-1.5 px-3 rounded-xl border transition-all cursor-pointer select-none group focus:outline-none ${
              showUserMenu
                ? 'bg-[#292524] text-white shadow-md'
                : 'bg-[#1C1917] border-[#292524] hover:bg-[#292524] text-white'
            }`}
            style={showUserMenu ? { borderColor: currentTheme.primary } : {}}
            aria-haspopup="menu"
            aria-expanded={showUserMenu}
            aria-label="User Account Menu"
          >
            {/* Avatar with Green Online Dot */}
            <div className="relative">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center font-black text-xs uppercase shadow-sm shrink-0 transition-colors"
                style={{ 
                  backgroundColor: 'var(--accent-primary)',
                  color: 'var(--accent-text, #FFFFFF)'
                }}
              >
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
                    <div 
                      className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-base shadow-inner shrink-0 transition-colors"
                      style={{ 
                        backgroundColor: 'var(--accent-primary)',
                        color: 'var(--accent-text, #FFFFFF)'
                      }}
                    >
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
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      <span 
                        className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border transition-colors"
                        style={{
                          backgroundColor: 'var(--accent-glow)',
                          color: 'var(--accent-light)',
                          borderColor: 'var(--accent-border)'
                        }}
                      >
                        {capitalizedRole}
                      </span>
                      {isInstructor && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          Full Access Mode
                        </span>
                      )}
                    </div>
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
                      <span className="text-xs font-mono px-1 font-bold" style={{ color: 'var(--accent-primary)' }}>
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

                  {/* Theme Color Selector */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-stone-300 font-semibold">Theme Color</span>
                    <div className="flex items-center gap-2">
                      {THEME_PALETTES.map((swatch) => {
                        const isSelected = themeId === swatch.id;
                        return (
                          <button
                            key={swatch.id}
                            type="button"
                            onClick={() => setThemeId(swatch.id)}
                            title={swatch.name}
                            className={`w-5 h-5 rounded-full transition-all duration-200 cursor-pointer relative flex items-center justify-center shrink-0 ${
                              isSelected ? 'scale-110' : 'opacity-80 hover:opacity-100 hover:scale-105'
                            }`}
                            style={{
                              background: swatch.swatchBackground || swatch.color,
                              border: swatch.swatchBorder || 'none',
                              boxShadow: isSelected
                                ? `0 0 0 2px #1C1917, 0 0 0 4px ${swatch.color}, 0 0 14px ${swatch.color}`
                                : (swatch.swatchBorder ? `0 0 0 1px ${swatch.color}60` : '0 0 0 1px rgba(255,255,255,0.18)')
                            }}
                          >
                            {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white shadow-xs" />}
                          </button>
                        );
                      })}
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
                      <BookOpen className="w-4 h-4 transition-colors" style={{ color: 'var(--accent-primary)' }} />
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
      </div>

      {/* Floating Bottom Navigation Dock: For Admin, Inventory Clerk, Sales Personnel, and Instructor */}
      {currentWorkspaceConfig?.subTabs && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 max-w-[95vw] pointer-events-none select-none">
          <nav
            aria-label="Workspace Navigation Dock"
            className="pointer-events-auto bg-[#1C1917]/95 backdrop-blur-xl border border-[#292524] shadow-[0_12px_40px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.08)] rounded-full p-1.5 flex items-center gap-1 sm:gap-1.5 overflow-x-auto scrollbar-none"
          >
            {currentWorkspaceConfig.subTabs.map((sub) => {
              const SubIcon = sub.icon;
              const isSubActive = activeTab === sub.id || (sub.id === 'predictions' && isPredictionActive);

              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => {
                    if (setActiveTab) setActiveTab(sub.id === 'predictions' ? 'predictions' : sub.id);
                  }}
                  title={sub.label}
                  style={isSubActive ? {
                    backgroundColor: 'var(--accent-primary)',
                    boxShadow: '0 6px 20px var(--accent-glow)',
                    outline: '1px solid var(--accent-border)',
                    ...SMOOTH_TAB_TRANSITION
                  } : SMOOTH_TAB_TRANSITION}
                  className={`group relative flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold shrink-0 cursor-pointer select-none transition-all duration-200 active:scale-95 ${
                    isSubActive
                      ? 'text-white font-black'
                      : 'text-stone-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {/* Icon */}
                  <SubIcon
                    style={SMOOTH_TAB_TRANSITION}
                    className={`w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0 ${
                      isSubActive ? 'text-white' : 'text-stone-400 group-hover:text-white'
                    }`}
                  />

                  {/* Label */}
                  <span className="whitespace-nowrap tracking-tight">
                    {sub.label}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
