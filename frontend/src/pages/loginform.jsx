import React, { useState } from 'react';
import {
  User,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  LogIn,
  KeyRound
} from 'lucide-react';
import TechAvenueLogo from '../components/TechAvenueLogo.jsx';
import ThemeToggle from '../components/ThemeToggle.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { DEMO_ACCOUNTS } from '../data/demoAccounts.js';

export default function LoginForm({ onLoginSuccess }) {
  const { login } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();

  // Form States
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('Admin@123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Validation / Feedback State
  const [feedback, setFeedback] = useState(null);

  // Quick fill demo role account
  const handleQuickSelect = (acc) => {
    setUsername(acc.username);
    setPassword(acc.password);
    setFeedback({
      type: 'info',
      message: `Selected ${acc.displayName} account. Click "SIGN IN" to enter the ${acc.displayName} dashboard.`,
    });
  };

  // Handle Form Submission with Validation
  const handleSubmit = (e) => {
    e.preventDefault();

    const trimmedUser = username.trim();
    const trimmedPass = password.trim();

    // 1. Check for empty fields
    if (!trimmedUser || !trimmedPass) {
      setFeedback({
        type: 'error',
        message: 'Please enter both username and password.',
      });
      return;
    }

    // 2. Validate credentials via AuthContext
    const result = login(trimmedUser, trimmedPass);

    if (result.success) {
      setFeedback({
        type: 'success',
        role: result.user.displayName,
        message: `Login successful! Redirecting to ${result.user.displayName} Dashboard...`,
      });
      if (onLoginSuccess) {
        setTimeout(() => onLoginSuccess(result.user), 400);
      }
    } else {
      setFeedback({
        type: 'error',
        message: result.message || 'Invalid username or password. Please try again.',
      });
    }
  };

  return (
    <div
      className={`min-h-screen flex flex-col justify-between p-4 sm:p-6 transition-colors duration-200 ${
        isDarkMode ? 'bg-[#1F2632] text-slate-100' : 'bg-[#F9FAFB] text-[#374151]'
      }`}
    >
      {/* Top Header Bar with Theme Toggle (Top Right) */}
      <header className="flex w-full items-center justify-end">
        <ThemeToggle isDarkMode={isDarkMode} onToggle={toggleTheme} />
      </header>

      {/* Main Container - Centered Vertically & Horizontally */}
      <main className="my-auto flex w-full items-center justify-center py-6">
        <div
          className={`w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-xl transition-all duration-200 border ${
            isDarkMode
              ? 'bg-[#2B3441] border-[#CFC8BE]/30 shadow-black/40'
              : 'bg-white border-[#E5E7EB] shadow-slate-200/60'
          }`}
        >
          {/* Logo & System Title */}
          <TechAvenueLogo isDarkMode={isDarkMode} />

          {/* Welcome Message */}
          <div className="mt-5 mb-5 text-center">
            <h2
              className={`text-xl font-bold tracking-tight ${
                isDarkMode ? 'text-white' : 'text-[#374151]'
              }`}
            >
              Welcome Back
            </h2>
            <p
              className={`mt-1 text-xs font-normal ${
                isDarkMode ? 'text-slate-300' : 'text-slate-500'
              }`}
            >
              Sign in to continue to the store management system.
            </p>
          </div>

          {/* Quick Role Fill Pills for the 4 User Roles */}
          <div
            className={`mb-5 p-3 rounded-2xl border text-xs ${
              isDarkMode ? 'bg-[#1F2632] border-[#CFC8BE]/20' : 'bg-slate-50 border-[#E5E7EB]'
            }`}
          >
            <div className="flex items-center space-x-1.5 mb-2 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
              <KeyRound className="h-3 w-3 text-amber-500" />
              <span>Select Demo Role to Test:</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => handleQuickSelect(acc)}
                  className={`py-1.5 px-2 rounded-xl text-[11px] font-bold text-left truncate transition border ${
                    username.toLowerCase() === acc.username.toLowerCase()
                      ? 'bg-[#1E3A5F] text-white border-[#1E3A5F] shadow-xs'
                      : isDarkMode
                      ? 'bg-[#2B3441] border-[#CFC8BE]/20 hover:border-[#CFC8BE]/40 text-slate-200'
                      : 'bg-white border-[#E5E7EB] hover:bg-slate-100 text-[#1E3A5F]'
                  }`}
                  title={`${acc.displayName} (${acc.username})`}
                >
                  <span className="block truncate">{acc.displayName}</span>
                  <span className="text-[9px] opacity-70 block font-mono">{acc.username}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Inline Feedback Alerts */}
          {feedback && (
            <div
              className={`mb-4 flex items-start space-x-2.5 rounded-xl p-3 text-xs font-medium border animate-in fade-in duration-200 ${
                feedback.type === 'success'
                  ? isDarkMode
                    ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : feedback.type === 'info'
                  ? isDarkMode
                    ? 'bg-blue-950/60 border-blue-500/40 text-blue-200'
                    : 'bg-blue-50 border-blue-200 text-blue-800'
                  : isDarkMode
                  ? 'bg-rose-950/60 border-rose-500/40 text-rose-200'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
              role="alert"
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
              ) : feedback.type === 'info' ? (
                <KeyRound className="h-4 w-4 shrink-0 text-blue-500 mt-0.5" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
              )}
              <div className="flex-1">
                <p>{feedback.message}</p>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username Input */}
            <div>
              <label
                htmlFor="username"
                className={`block text-xs font-semibold mb-1.5 ${
                  isDarkMode ? 'text-[#CFC8BE]' : 'text-[#374151]'
                }`}
              >
                Username
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <User
                    className={`h-4 w-4 ${
                      isDarkMode ? 'text-[#CFC8BE]/70' : 'text-slate-400'
                    }`}
                  />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (feedback) setFeedback(null);
                  }}
                  placeholder="Enter your username"
                  className={`w-full rounded-xl py-2.5 pl-10 pr-4 text-xs sm:text-sm font-medium transition-colors outline-none border focus:ring-2 ${
                    isDarkMode
                      ? 'bg-[#1F2632] border-[#CFC8BE]/30 text-white placeholder-slate-500 focus:border-[#CFC8BE] focus:ring-[#CFC8BE]/20'
                      : 'bg-slate-50 border-[#E5E7EB] text-[#374151] placeholder-slate-400 focus:bg-white focus:border-[#1E3A5F] focus:ring-[#1E3A5F]/20'
                  }`}
                />
              </div>
            </div>

            {/* Password Input with Show/Hide Toggle */}
            <div>
              <label
                htmlFor="password"
                className={`block text-xs font-semibold mb-1.5 ${
                  isDarkMode ? 'text-[#CFC8BE]' : 'text-[#374151]'
                }`}
              >
                Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <Lock
                    className={`h-4 w-4 ${
                      isDarkMode ? 'text-[#CFC8BE]/70' : 'text-slate-400'
                    }`}
                  />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (feedback) setFeedback(null);
                  }}
                  placeholder="Enter your password"
                  className={`w-full rounded-xl py-2.5 pl-10 pr-11 text-xs sm:text-sm font-medium transition-colors outline-none border focus:ring-2 ${
                    isDarkMode
                      ? 'bg-[#1F2632] border-[#CFC8BE]/30 text-white placeholder-slate-500 focus:border-[#CFC8BE] focus:ring-[#CFC8BE]/20'
                      : 'bg-slate-50 border-[#E5E7EB] text-[#374151] placeholder-slate-400 focus:bg-white focus:border-[#1E3A5F] focus:ring-[#1E3A5F]/20'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className={`absolute inset-y-0 right-0 flex items-center pr-3.5 transition ${
                    isDarkMode
                      ? 'text-[#CFC8BE]/70 hover:text-white'
                      : 'text-slate-400 hover:text-[#1E3A5F]'
                  }`}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password Row */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center space-x-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className={`h-4 w-4 rounded border transition ${
                    isDarkMode
                      ? 'border-[#CFC8BE]/40 bg-[#1F2632] text-[#1E3A5F] focus:ring-[#CFC8BE]'
                      : 'border-slate-300 bg-white text-[#1E3A5F] focus:ring-[#1E3A5F]'
                  }`}
                />
                <span
                  className={`text-xs ${
                    isDarkMode ? 'text-slate-300' : 'text-slate-600'
                  }`}
                >
                  Remember me
                </span>
              </label>

              <button
                type="button"
                onClick={() =>
                  setFeedback({
                    type: 'info',
                    message: 'Please contact the system administrator (admin@techavenue.com) for password assistance.',
                  })
                }
                className={`text-xs font-semibold hover:underline transition ${
                  isDarkMode ? 'text-[#CFC8BE]' : 'text-[#1E3A5F]'
                }`}
              >
                Forgot password?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="mt-3 flex w-full items-center justify-center space-x-2 rounded-xl bg-[#1E3A5F] py-3 px-4 text-xs sm:text-sm font-bold uppercase tracking-wider text-white shadow-md transition-all hover:bg-[#162c48] active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:ring-offset-2"
            >
              <LogIn className="h-4 w-4" />
              <span>SIGN IN</span>
            </button>
          </form>
        </div>
      </main>

      {/* Small Footer */}
      <footer className="w-full text-center py-2">
        <p
          className={`text-xs font-medium tracking-wide ${
            isDarkMode ? 'text-slate-400' : 'text-slate-400'
          }`}
        >
          &copy; 2026 TECH AVENUE
        </p>
      </footer>
    </div>
  );
}
