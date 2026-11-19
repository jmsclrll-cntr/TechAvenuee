import React, { useState, useEffect } from 'react';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  ArrowRight,
  AlertCircle,
  ShieldCheck,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import logoImg from '../assets/logo.png';
import { api } from '../api';

export default function Login({ onLoginSuccess, darkMode, setDarkMode }) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Full Screen Mode state
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Sync fullscreen state with browser events (F11, Esc, button clicks)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(
        Boolean(
          document.fullscreenElement ||
          document.webkitFullscreenElement ||
          document.mozFullScreenElement ||
          document.msFullscreenElement
        )
      );
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    try {
      const docEl = document.documentElement;
      const isCurrentlyFullscreen = Boolean(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );

      if (!isCurrentlyFullscreen) {
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
        localStorage.setItem('techavenue_sidebar_collapsed', 'true');
        setIsFullscreen(true);
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          await document.webkitExitFullscreen();
        } else if (docEl.mozCancelFullScreen) {
          await docEl.mozCancelFullScreen();
        } else if (docEl.msExitFullscreen) {
          await docEl.msExitFullscreen();
        }
        localStorage.setItem('techavenue_fullscreen', 'false');
        setIsFullscreen(false);
      }
    } catch (err) {
      console.warn('Fullscreen toggle request was not completed:', err);
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError('');

    if (!identifier.trim()) {
      setError('Please enter your email or username.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    try {
      const docEl = document.documentElement;
      if (!document.fullscreenElement) {
        if (docEl.requestFullscreen) {
          docEl.requestFullscreen().catch(() => {});
        } else if (docEl.webkitRequestFullscreen) {
          docEl.webkitRequestFullscreen().catch(() => {});
        }
      }
      localStorage.setItem('techavenue_fullscreen', 'true');
      localStorage.setItem('techavenue_sidebar_collapsed', 'true');
      setIsFullscreen(true);
    } catch {
      // Non-blocking fallback
    }

    setLoading(true);

    try {
      const res = await api.login(identifier.trim(), password);
      if (res && res.status === 'success') {
        localStorage.setItem('techavenue_token', res.token);
        localStorage.setItem('techavenue_user', JSON.stringify(res.user));
        localStorage.setItem('techavenue_fullscreen', 'true');
        localStorage.setItem('techavenue_sidebar_collapsed', 'true');
        onLoginSuccess(res.user);
      } else {
        setError(res?.message || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
        setError('Cannot connect to backend server. Please verify the backend is running on http://127.0.0.1:5000.');
      } else {
        setError(err.message || 'Invalid email/username or password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-center items-center p-4 sm:p-6 lg:p-10 py-8 overflow-x-hidden overflow-y-auto select-none bg-[#141210]">

      {/* ========================================================================= */}
      {/* 1. FIXED FADED COLOR BACKGROUND (ATMOSPHERIC BLENDED DEPTH - NO IMAGES)    */}
      {/* ========================================================================= */}
      {/* Fixed Atmospheric Black-into-White Ambient Gradient Overlay */}
      <div className="fixed inset-0 z-0 bg-gradient-to-br from-black/95 via-[#141210]/90 to-white/[0.06] pointer-events-none" />

      {/* Fixed Center-out Radial Vignette Blended into System Dark Theme */}
      <div className="fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_center,transparent_25%,#141210_88%)] pointer-events-none" />

      {/* Fixed Soft Luminous Ambient Glow Orbs */}
      <div className="fixed -top-40 -left-40 w-[650px] h-[650px] rounded-full bg-white/[0.04] blur-[140px] pointer-events-none" />
      <div className="fixed -bottom-40 -right-40 w-[650px] h-[650px] rounded-full bg-[#F97316]/10 blur-[150px] pointer-events-none" />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[450px] rounded-full bg-white/[0.02] blur-[120px] pointer-events-none" />

      {/* Top-Right Option Bar: Minimal Full Screen Toggle Icon with Glass Style */}
      <div className="fixed top-4 right-4 sm:top-6 sm:right-6 z-20 flex items-center">
        <button
          type="button"
          onClick={toggleFullscreen}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl border border-white/15 hover:border-white/30 bg-[#1C1917]/75 hover:bg-[#292524]/90 backdrop-blur-md text-stone-300 hover:text-white flex items-center justify-center transition-all duration-200 shadow-lg active:scale-95 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#F97316]/40"
          aria-label={isFullscreen ? 'Exit full screen mode' : 'Enter full screen mode'}
          title={isFullscreen ? 'Exit Full Screen (Esc)' : 'Full Screen Mode'}
        >
          {isFullscreen ? (
            <Minimize2 className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#F97316] transition-transform hover:scale-110" />
          ) : (
            <Maximize2 className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#F97316] transition-transform hover:scale-110" />
          )}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 2. HORIZONTAL GLASSMORPHISM FRAME (CENTRALIZED IMPORTANT LABELS)          */}
      {/* ========================================================================= */}
      <div className="relative z-10 w-full max-w-4xl lg:max-w-5xl rounded-3xl bg-[#1C1917]/75 backdrop-blur-3xl border border-white/[0.14] shadow-[0_25px_80px_rgba(0,0,0,0.85),0_0_0_1px_rgba(255,255,255,0.06)] overflow-hidden my-auto transition-all duration-300">

        {/* Specular Light Refraction Along Top Glass Edge */}
        <div className="absolute top-0 inset-x-8 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent pointer-events-none" />

        {/* Ambient Corner Glass Specular Highlight */}
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/[0.07] blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-[#F97316]/10 blur-2xl pointer-events-none" />

        <div className="grid grid-cols-1 md:grid-cols-12 relative z-10">

          {/* LEFT COLUMN: CENTRALIZED BRANDING & SYSTEM INFORMATION (5 cols) */}
          <div className="md:col-span-5 p-8 sm:p-10 flex flex-col justify-center items-center text-center space-y-5 border-b md:border-b-0 md:border-r border-white/[0.08] bg-black/40 backdrop-blur-md relative overflow-hidden">
            {/* Ambient subtle corner glow inside left panel */}
            <div className="absolute -top-8 -left-8 w-32 h-32 rounded-full bg-white/[0.05] blur-xl pointer-events-none" />

            <div className="relative z-10 space-y-4 max-w-xs mx-auto">
              {/* Logo Badge Container */}
              <div className="w-32 sm:w-36 rounded-2xl bg-black/70 p-2.5 border border-white/[0.14] backdrop-blur-md shadow-inner mx-auto">
                <img
                  src={logoImg}
                  alt="Tech Avenue"
                  className="w-full h-auto max-h-16 object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>

              <div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-sm">
                  TECH AVENUE
                </h1>
                <p className="text-xs sm:text-sm text-stone-300 font-medium leading-relaxed mt-1">
                  Computer &amp; Accessories Store Management System
                </p>
              </div>

              {/* Operations Portal Chip */}
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/25 text-xs font-bold text-orange-400 uppercase tracking-wider mx-auto">
                <Sparkles className="w-3.5 h-3.5 text-[#F97316]" />
                <span>Store Operations Portal</span>
              </div>

              {/* Feature Highlights (Centralized) */}
              <div className="pt-2 space-y-2.5 text-xs text-stone-300 text-left max-w-[260px] mx-auto">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Master Inventory &amp; Restock Control</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Point of Sale &amp; Cashier Transactions</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Machine Learning Predictive Analytics</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: LOGIN CREDENTIALS FORM (7 cols) */}
          <div className="md:col-span-7 p-6 sm:p-8 lg:p-10 flex flex-col justify-between space-y-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-[#FAFAF9] tracking-tight">
                Sign In to Dashboard
              </h2>
              <p className="text-xs sm:text-sm text-stone-400 mt-1">
                Enter your credentials to access your designated workspace.
              </p>
            </div>

            {/* Error Notification Alert */}
            {error && (
              <div className="p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-200 text-xs font-semibold flex items-center gap-2.5 backdrop-blur-md shadow-lg animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span className="leading-snug">{error}</span>
              </div>
            )}

            {/* Credentials Form */}
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              {/* Username / Email Field */}
              <div>
                <label className="block text-xs font-bold mb-1.5 text-stone-200 uppercase tracking-wider">
                  Username or Email
                </label>
                <div className="relative group">
                  <User className="w-4.5 h-4.5 absolute left-3.5 top-3.5 text-stone-400 group-focus-within:text-[#F97316] transition-colors pointer-events-none" />
                  <input
                    type="text"
                    required
                    autoComplete="username"
                    placeholder="Enter username or corporate email"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-white/[0.12] bg-black/40 hover:bg-black/55 focus:bg-black/70 text-white placeholder-stone-400 text-sm shadow-inner backdrop-blur-sm focus:outline-none focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316]/50 transition-all duration-200"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-xs font-bold mb-1.5 text-stone-200 uppercase tracking-wider">
                  Password
                </label>
                <div className="relative group">
                  <Lock className="w-4.5 h-4.5 absolute left-3.5 top-3.5 text-stone-400 group-focus-within:text-[#F97316] transition-colors pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-12 py-3 rounded-xl border border-white/[0.12] bg-black/40 hover:bg-black/55 focus:bg-black/70 text-white placeholder-stone-400 text-sm shadow-inner backdrop-blur-sm focus:outline-none focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316]/50 transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 p-1 rounded-lg text-stone-400 hover:text-white hover:bg-white/5 transition-all focus:outline-none cursor-pointer"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 sm:py-4 px-6 rounded-xl font-black text-sm sm:text-base text-white tracking-wide bg-gradient-to-r from-[#F97316] via-[#EA580C] to-[#FB923C] hover:from-[#EA580C] hover:to-[#F97316] active:scale-[0.99] shadow-[0_4px_25px_rgba(249,115,22,0.35)] hover:shadow-[0_6px_30px_rgba(249,115,22,0.5)] border border-orange-400/40 transition-all duration-200 flex items-center justify-center gap-2.5 cursor-pointer group disabled:opacity-60"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <>
                    <span>Sign In to Dashboard</span>
                    <ArrowRight className="w-4.5 h-4.5 transition-transform duration-200 group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>

            {/* Bottom Trust & Security Indicator */}
            <div className="pt-2 flex items-center justify-center gap-2 text-xs text-stone-400 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Authorized Access &bull; Enterprise Secure &bull; End-to-End Encryption</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
