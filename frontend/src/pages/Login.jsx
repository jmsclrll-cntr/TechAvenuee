import React, { useState, useEffect } from 'react';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  Sun,
  Moon,
  ArrowRight,
  AlertCircle,
  ShieldCheck,
  Cpu
} from 'lucide-react';
import logoImg from '../assets/logo.png';
import workstationBg from '../assets/workstation-bg.svg';
import { api } from '../api';

const COMPUTER_BACKGROUNDS = [
  {
    id: 'cyber-workstation',
    label: 'Cyber Workstation & Hardware',
    src: workstationBg,
  },
  {
    id: 'datacenter-servers',
    label: 'High-Tech Server Facility',
    src: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=2000&q=80',
    fallback: workstationBg
  },
  {
    id: 'circuit-processor',
    label: 'Motherboard & Microprocessor',
    src: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=2000&q=80',
    fallback: workstationBg
  },
  {
    id: 'cyber-matrix',
    label: 'Cyber Matrix Command Ops',
    src: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=2000&q=80',
    fallback: workstationBg
  }
];

export default function Login({ onLoginSuccess, darkMode, setDarkMode }) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Automatic Background slideshow state
  const [bgIndex, setBgIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Automatically cycle through computer backgrounds with smooth pre-transition animation
  useEffect(() => {
    const cycleDuration = 8000; // 8 seconds per scene
    const animationLeadTime = 800; // trigger animation effect 800ms before changing

    // Trigger animation effect before changing
    const animTimer = setTimeout(() => {
      setIsTransitioning(true);
    }, cycleDuration - animationLeadTime);

    // Switch to next background
    const switchTimer = setTimeout(() => {
      setBgIndex((prev) => (prev + 1) % COMPUTER_BACKGROUNDS.length);
      // Smoothly end transition effect shortly after switch
      const endTimer = setTimeout(() => {
        setIsTransitioning(false);
      }, 500);
      return () => clearTimeout(endTimer);
    }, cycleDuration);

    return () => {
      clearTimeout(animTimer);
      clearTimeout(switchTimer);
    };
  }, [bgIndex]);

  const currentBg = COMPUTER_BACKGROUNDS[bgIndex];

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

    setLoading(true);

    try {
      const res = await api.login(identifier.trim(), password);
      if (res && res.status === 'success') {
        localStorage.setItem('techavenue_token', res.token);
        localStorage.setItem('techavenue_user', JSON.stringify(res.user));
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
    <div className="relative min-h-screen w-full flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 overflow-hidden select-none bg-slate-950">

      {/* ========================================================================= */}
      {/* 1. FULL-SCREEN HIGH-TECH COMPUTER FIELD BACKGROUND (CLEAN & IMMERSIVE)    */}
      {/* ========================================================================= */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center transition-all duration-1000 ease-out"
        style={{ backgroundImage: `url(${currentBg.src || workstationBg})` }}
      >
        <img
          key={currentBg.id}
          src={currentBg.src}
          alt="Computer Field Background"
          className={`w-full h-full object-cover object-center transition-all duration-700 ease-out ${isTransitioning
            ? 'scale-108 filter blur-[2px] brightness-110'
            : 'scale-100 filter blur-[0.5px] brightness-[0.88] contrast-[1.08]'
            }`}
          onError={(e) => {
            e.currentTarget.src = workstationBg;
          }}
        />
      </div>

      {/* Dynamic Pre-Transition Holographic Sweep Effect */}
      <div
        className={`absolute inset-0 z-0 bg-gradient-to-r from-transparent via-cyan-400/25 to-transparent pointer-events-none transition-transform duration-700 ease-in-out ${isTransitioning ? 'translate-x-full opacity-100' : '-translate-x-full opacity-0'
          }`}
      />

      {/* Balanced Dark Transparent Overlay for Contrast and Readability */}
      <div className="absolute inset-0 z-0 bg-slate-950/30 backdrop-blur-[0.5px] bg-gradient-to-t from-slate-950/80 via-slate-950/25 to-slate-950/70 pointer-events-none" />

      {/* Ambient Cyan & Blue Glow Highlights */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-cyan-400/20 rounded-full blur-[90px] pointer-events-none animate-pulse" style={{ animationDuration: '6s' }} />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-blue-600/25 rounded-full blur-[90px] pointer-events-none animate-pulse" style={{ animationDuration: '8s' }} />

      {/* Top-Right Theme Toggle */}
      <div className="fixed top-4 right-4 sm:top-6 sm:right-6 z-20">
        <button
          type="button"
          onClick={() => setDarkMode(!darkMode)}
          className="group flex items-center gap-2.5 px-4 py-2 sm:px-4.5 sm:py-2.5 rounded-xl border border-white/20 hover:border-cyan-400/50 bg-slate-900/80 hover:bg-slate-800/90 backdrop-blur-xl text-xs sm:text-sm font-semibold text-slate-100 hover:text-white shadow-xl transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-400/40 active:scale-95"
          aria-label="Toggle color theme"
        >
          {darkMode ? (
            <>
              <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 group-hover:rotate-45 transition-transform duration-300" />
              <span>Light mode</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-300 group-hover:-rotate-12 transition-transform duration-300" />
              <span>Dark mode</span>
            </>
          )}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 2. CENTERED GLASSMORPHISM CARD (NO SHADOWBOX)                             */}
      {/* ========================================================================= */}
      <div className="relative z-10 w-full max-w-[480px] sm:max-w-[500px] bg-slate-950/85 dark:bg-slate-950/90 backdrop-blur-3xl rounded-3xl border border-white/20 dark:border-cyan-500/35 p-7 sm:p-10 space-y-7 transition-all duration-300 hover:border-cyan-400/45 shadow-none">

        {/* Subtle Cyan Top Edge Highlight Line */}
        <div className="absolute top-0 inset-x-12 h-px bg-gradient-to-r from-transparent via-cyan-400/70 to-transparent pointer-events-none" />

        {/* Brand Logo & Heading with User's Uploaded Photo */}
        <div className="text-center space-y-4">
          {/* Logo Badge Container */}
          <div className="relative w-40 sm:w-48 rounded-2xl bg-black/90 p-2.5 mx-auto border border-white/20 dark:border-cyan-500/40 group hover:scale-105 transition-all duration-300 shadow-none overflow-hidden">
            <img
              src={logoImg}
              alt="Tech Avenue Smart Solutions"
              className="relative w-full h-auto max-h-24 object-contain"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentNode.innerHTML = '<svg class="w-10 h-10 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>';
              }}
            />
          </div>

          <div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-cyan-300 drop-shadow">
              TECH AVENUE
            </h2>
            <p className="text-sm sm:text-base text-slate-200 dark:text-slate-200 font-medium tracking-wide mt-2 leading-relaxed">
              Computer and Accessories Store Management System
            </p>
          </div>

          {/* Computer Field Indicator Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-xs font-bold text-cyan-300 uppercase tracking-widest shadow-sm">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span>Store Operations Portal</span>
          </div>
        </div>

        {/* Error Notification Alert */}
        {error && (
          <div className="p-4 rounded-xl bg-red-500/15 border border-red-500/40 text-red-200 text-sm font-semibold flex items-center gap-3 backdrop-blur-md shadow-lg animate-in fade-in duration-200">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
            <span className="leading-snug">{error}</span>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
          {/* Username / Email Field */}
          <div>
            <label className="block text-sm sm:text-base font-bold mb-2 text-slate-100 tracking-wide">
              Username or Email
            </label>
            <div className="relative group">
              <User className="w-5 h-5 absolute left-4 top-4 text-slate-400 group-focus-within:text-cyan-400 transition-colors pointer-events-none" />
              <input
                type="text"
                required
                autoComplete="username"
                placeholder="Enter username or corporate email"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 sm:py-4 rounded-xl border border-white/20 bg-slate-900/80 hover:bg-slate-900 focus:bg-slate-900 text-white placeholder-slate-400 text-sm sm:text-base shadow-inner backdrop-blur-sm focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30 transition-all duration-200"
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-sm sm:text-base font-bold mb-2 text-slate-100 tracking-wide">
              Password
            </label>
            <div className="relative group">
              <Lock className="w-5 h-5 absolute left-4 top-4 text-slate-400 group-focus-within:text-cyan-400 transition-colors pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-12 py-3.5 sm:py-4 rounded-xl border border-white/20 bg-slate-900/80 hover:bg-slate-900 focus:bg-slate-900 text-white placeholder-slate-400 text-sm sm:text-base shadow-inner backdrop-blur-sm focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30 transition-all duration-200"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 p-1 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-white/5 transition-all focus:outline-none focus:ring-1 focus:ring-cyan-400/50 cursor-pointer"
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 px-6 rounded-2xl font-black text-base sm:text-lg text-white tracking-wide bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:via-blue-500 hover:to-indigo-500 active:scale-[0.99] shadow-[0_4px_30px_rgba(0,240,255,0.4)] hover:shadow-[0_6px_35px_rgba(0,240,255,0.6)] border border-cyan-400/40 transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer group"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <span>Sign In to Dashboard</span>
                <ArrowRight className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1.5" />
              </>
            )}
          </button>
        </form>

        {/* Bottom Trust & Security Indicator */}
        <div className="pt-2 flex items-center justify-center gap-2 text-xs sm:text-sm text-slate-300 font-medium tracking-wide">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          <span>Authorized Access • Enterprise Secure</span>
        </div>
      </div>
    </div>
  );
}
