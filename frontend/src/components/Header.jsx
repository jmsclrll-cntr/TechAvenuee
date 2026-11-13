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
  ExternalLink
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
  const userMenuRef = useRef(null);
  const triggerButtonRef = useRef(null);

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
      if (e.key === 'Escape' && showUserMenu) {
        setShowUserMenu(false);
        if (triggerButtonRef.current) {
          triggerButtonRef.current.focus();
        }
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
    // Check for potential unsaved work (form modifications) if flagged
    const hasUnsaved = window.__TECHAVENUE_UNSAVED_CHANGES__ === true;
    if (hasUnsaved) {
      const confirmed = window.confirm('You have unsaved changes that will be lost. Are you sure you want to sign out?');
      if (!confirmed) return;
    }
    setShowUserMenu(false);
    if (onLogout) onLogout();
  };

  const getGreeting = () => {
    const name = user?.full_name || 'Carl Cantre';
    return { prefix: 'Welcome back,', name };
  };

  const greeting = getGreeting();

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

  const userInitial = user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'C';
  const userName = user?.full_name || 'Carl Cantre';
  const userEmail = user?.email || (user?.username ? `${user.username}@techavenue.com` : 'admin@techavenue.com');
  const roleDisplay = (user?.role || role || 'admin').replace('_', ' ');
  const capitalizedRole = roleDisplay.charAt(0).toUpperCase() + roleDisplay.slice(1);

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-darkbg-card/95 backdrop-blur-md border-b border-gray-200 dark:border-darkbg-border px-6 py-3.5 transition-colors">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Sidebar Toggle + Role Greeting & Dynamic Subtext */}
        <div className="flex items-center gap-3">
          {/* Sidebar Toggle / Auto-Hide Mode Button */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={`p-2 rounded-lg border transition-all shadow-sm cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#38d2eb] ${
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
            <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
              {greeting.prefix}{' '}
              <span className="text-navy dark:text-cyan-300">{greeting.name}</span>
            </h1>

            {/* Subtext Indicators (Sales shift, Instructor audit, or Low-stock badge) */}
            <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-600 dark:text-gray-300 font-semibold">
              {/* Sales Personnel Shift Indicator */}
              {role === 'sales_personnel' && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Cashier: {user?.full_name || 'Active'} • {shiftInfo ? `Shift #${shiftInfo.id} Active` : 'Shift Active'}
                </span>
              )}

              {/* Instructor Inspection Indicator */}
              {role === 'instructor' && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-blue-500/10 text-blue-700 dark:text-blue-400 font-bold border border-blue-500/20">
                  Operational Inspection & Audit Mode
                </span>
              )}

              {/* Low-Stock Notification Badge */}
              {lowStockCount > 0 && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold border border-amber-500/20">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {lowStockCount} items below reorder level
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Consolidated User Profile & System Controls Dropdown (Layout 3: Profile Card) */}
        <div ref={userMenuRef} className="relative">
          {/* 1. TRIGGER BUTTON */}
          <button
            ref={triggerButtonRef}
            type="button"
            onClick={() => setShowUserMenu(!showUserMenu)}
            className={`flex items-center gap-2.5 py-1.5 px-3 rounded-xl border transition-all cursor-pointer select-none group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#38d2eb] ${
              showUserMenu
                ? 'bg-[#1d2531] border-[#38d2eb] ring-1 ring-[#38d2eb] text-[#38d2eb] shadow-md'
                : 'bg-white dark:bg-[#1d2531] border-slate-300 dark:border-[#3a485c] hover:bg-slate-50 dark:hover:bg-[#253041] text-slate-800 dark:text-[#f0f4f8] shadow-xs'
            }`}
            aria-haspopup="menu"
            aria-expanded={showUserMenu}
            aria-label="User Account Menu"
          >
            {/* Avatar with Green Online Dot */}
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-[#2563eb] text-white flex items-center justify-center font-black text-xs uppercase shadow-sm shrink-0">
                {userInitial}
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#10b981] ring-2 ring-white dark:ring-[#1d2531]" />
            </div>

            {/* Name and Role Label */}
            <div className="text-left leading-tight hidden xs:block sm:block">
              <p className="text-xs font-bold text-slate-900 dark:text-[#f0f4f8] truncate max-w-[150px]">
                {userName}
              </p>
              <p className="text-[10px] font-medium text-slate-600 dark:text-[#a6b4c6] capitalize truncate">
                {roleDisplay}
              </p>
            </div>

            {/* Dropdown Chevron */}
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 shrink-0 ${
              showUserMenu ? 'rotate-180 text-[#38d2eb]' : 'text-[#a6b4c6] group-hover:text-slate-800 dark:group-hover:text-[#f0f4f8]'
            }`} />
          </button>

          {/* ========================================================================= */}
          {/* USER PROFILE CARD PANEL (LAYOUT 3)                                       */}
          {/* ========================================================================= */}
          {showUserMenu && (
            <>
              {/* Mobile bottom-sheet overlay */}
              <div 
                className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 sm:hidden animate-in fade-in duration-150"
                onClick={() => setShowUserMenu(false)}
                aria-hidden="true"
              />

              <div
                role="menu"
                aria-orientation="vertical"
                aria-label="User profile and settings"
                className="fixed inset-x-0 bottom-0 sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2.5 w-full sm:w-[340px] max-h-[88vh] sm:max-h-[min(650px,calc(100vh-80px))] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-[#1d2531] border border-[#3a485c] shadow-2xl z-50 transition-all motion-reduce:transition-none duration-150 animate-in fade-in slide-in-from-bottom-4 sm:slide-in-from-top-2 flex flex-col focus:outline-none"
                style={{ fontSize: '13px' }}
              >
                {/* 2. BANNER HEADER: Blue-to-cyan horizontal gradient (~86px tall) */}
                <div className="relative h-[86px] w-full shrink-0 rounded-t-2xl bg-gradient-to-r from-[#1d4ed8] via-[#0284c7] to-[#38d2eb]">
                  {/* Subtle inner gloss effect */}
                  <div className="absolute inset-0 bg-white/10 opacity-40 mix-blend-overlay rounded-t-2xl pointer-events-none" />
                </div>

                {/* Main Card Content Body */}
                <div className="relative px-5 pt-0 pb-5 flex flex-col items-center text-center">
                  {/* 3. LARGE AVATAR (~54px) overlapping banner and panel body */}
                  <div className="relative -mt-[27px] mb-2.5 shrink-0">
                    <div className="w-[54px] h-[54px] rounded-full bg-[#2563eb] text-white flex items-center justify-center font-black text-xl uppercase shadow-lg ring-4 ring-[#1d2531]">
                      {userInitial}
                    </div>
                    {/* Green online dot indicator */}
                    <span 
                      className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-[#10b981] ring-[2.5px] ring-[#1d2531]" 
                      title="Online"
                    />
                  </div>

                  {/* 4. CENTERED NAME, EMAIL, AND ROLE PILL BADGE */}
                  <h2 className="text-[15px] font-bold text-[#f0f4f8] tracking-tight leading-tight">
                    {userName}
                  </h2>
                  <p className="text-[12px] font-normal text-[#a6b4c6] mt-0.5 truncate max-w-[280px]">
                    {userEmail}
                  </p>
                  <div className="mt-2 mb-3.5">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#113a48] text-[#38d2eb] border border-[#1b5368]">
                      {capitalizedRole}
                    </span>
                  </div>

                  {/* 5. "VIEW PROFILE" FULL-WIDTH BUTTON */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserMenu(false);
                      if (setActiveTab) setActiveTab('profile');
                    }}
                    className="w-full py-2 px-3 rounded-[10px] border border-[#38d2eb] text-[#38d2eb] hover:bg-[#38d2eb]/10 active:bg-[#38d2eb]/20 text-[13px] font-semibold transition-all duration-150 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#38d2eb] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1d2531]"
                  >
                    View profile
                  </button>

                  {/* 6. SETTINGS ROWS */}
                  <div className="w-full mt-4 space-y-1 text-left">
                    {/* (a) Dark mode toggle switch */}
                    <div className="flex items-center justify-between py-2 px-2.5 rounded-lg hover:bg-[#253041] transition-colors group">
                      <div className="flex items-center gap-3">
                        <Sun className="w-4 h-4 text-[#a6b4c6] shrink-0" />
                        <span className="text-[13px] font-medium text-[#f0f4f8]">Dark mode</span>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={darkMode}
                        aria-label="Toggle dark mode"
                        onClick={() => setDarkMode(!darkMode)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#38d2eb] ${
                          darkMode ? 'bg-[#38d2eb]' : 'bg-[#2b3749]'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                            darkMode ? 'translate-x-5' : 'translate-x-0 bg-[#8b9bb4]'
                          }`}
                        />
                      </button>
                    </div>

                    {/* (b) Full screen toggle switch */}
                    <div className="flex items-center justify-between py-2 px-2.5 rounded-lg hover:bg-[#253041] transition-colors group">
                      <div className="flex items-center gap-3">
                        <Maximize className="w-4 h-4 text-[#a6b4c6] shrink-0" />
                        <span className="text-[13px] font-medium text-[#f0f4f8]">Full screen</span>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={isFullscreen}
                        aria-label="Toggle full screen mode"
                        onClick={toggleFullscreen}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#38d2eb] ${
                          isFullscreen ? 'bg-[#38d2eb]' : 'bg-[#2b3749]'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full shadow-md ring-0 transition duration-200 ease-in-out ${
                            isFullscreen ? 'translate-x-5 bg-white' : 'translate-x-0 bg-[#8b9bb4]'
                          }`}
                        />
                      </button>
                    </div>

                    {/* (c) Text size compact stepper */}
                    <div className="flex items-center justify-between py-2 px-2.5 rounded-lg hover:bg-[#253041] transition-colors group">
                      <div className="flex items-center gap-3">
                        {/* Custom crisp T icon */}
                        <span className="w-4 h-4 text-[#a6b4c6] flex items-center justify-center font-serif text-[15px] font-semibold leading-none select-none">
                          T
                        </span>
                        <span className="text-[13px] font-medium text-[#f0f4f8]">Text size</span>
                      </div>
                      
                      <div className="flex items-center bg-[#131b26] border border-[#2e3b4d] rounded-lg px-1.5 py-1 gap-2 select-none shadow-inner">
                        <button
                          type="button"
                          aria-label="Decrease text size"
                          disabled={activeStepIdx === 0}
                          onClick={handleDecreaseText}
                          className="px-1.5 py-0.5 rounded text-[11px] font-bold text-[#a6b4c6] hover:text-[#f0f4f8] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/5 active:bg-white/10 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-[#38d2eb]"
                        >
                          A-
                        </button>
                        
                        <span 
                          aria-live="polite" 
                          className="text-[11px] font-bold font-mono text-[#38d2eb] min-w-[38px] text-center"
                        >
                          {activePercentDisplay}%
                        </span>

                        <button
                          type="button"
                          aria-label="Increase text size"
                          disabled={activeStepIdx === TEXT_SCALE_STEPS.length - 1}
                          onClick={handleIncreaseText}
                          className="px-1.5 py-0.5 rounded text-[11px] font-bold text-[#a6b4c6] hover:text-[#f0f4f8] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/5 active:bg-white/10 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-[#38d2eb]"
                        >
                          A+
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 7. DIVIDER & SYSTEM GUIDE ROW */}
                  <div className="w-full my-3 border-t border-[#3a485c]/60" />

                  <button
                    type="button"
                    onClick={() => {
                      setShowUserMenu(false);
                      if (onOpenManual) onOpenManual();
                    }}
                    className="w-full flex items-center justify-between py-2 px-2.5 rounded-lg text-left hover:bg-[#253041] transition-colors cursor-pointer group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#38d2eb]"
                  >
                    <div className="flex items-center gap-3">
                      <BookOpen className="w-4 h-4 text-[#a6b4c6] group-hover:text-[#f0f4f8] transition-colors shrink-0" />
                      <span className="text-[13px] font-medium text-[#f0f4f8]">System guide & manual</span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-[#a6b4c6] group-hover:text-[#38d2eb] transition-colors shrink-0" />
                  </button>

                  {/* 8. FULL-WIDTH SIGN OUT BUTTON */}
                  {onLogout && (
                    <button
                      type="button"
                      onClick={handleSignOutClick}
                      className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-[13px] font-semibold text-[#f87878] bg-[#3a1b22]/70 hover:bg-[#4a222b] active:bg-[#5a2834] border border-[#6d252f]/60 transition-all duration-150 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f87878]"
                    >
                      <LogOut className="w-4 h-4 text-[#f87878]" />
                      <span>Sign out</span>
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
