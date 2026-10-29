import React, { useState } from 'react';
import { 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  Sun, 
  Moon, 
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import logoImg from '../assets/logo.png';
import { api } from '../api';

export default function Login({ onLoginSuccess, darkMode, setDarkMode }) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
      setError(err.message || 'Invalid email/username or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 dark:bg-darkbg p-4 sm:p-6 transition-colors">
      {/* Top right theme toggle */}
      <div className="fixed top-4 right-4 z-10">
        <button
          type="button"
          onClick={() => setDarkMode(!darkMode)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-darkbg-border bg-white dark:bg-darkbg-card text-xs font-semibold text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-darkbg transition-colors"
          aria-label="Toggle color theme"
        >
          {darkMode ? (
            <>
              <Sun className="w-4 h-4 text-amber-400" />
              <span>Light mode</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-navy" />
              <span>Dark mode</span>
            </>
          )}
        </button>
      </div>

      <div className="w-full max-w-md bg-white dark:bg-darkbg-card rounded-2xl shadow-xl border border-gray-200 dark:border-darkbg-border p-8 space-y-6">
        {/* Brand Logo & Heading */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-navy/10 dark:bg-white/5 border border-navy/20 dark:border-white/10 mx-auto flex items-center justify-center p-2 shadow-inner">
            <img 
              src={logoImg} 
              alt="Tech Avenue" 
              className="w-full h-full object-contain"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentNode.innerHTML = '<svg class="w-8 h-8 text-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>';
              }}
            />
          </div>
          <h2 className="text-2xl font-extrabold text-navy dark:text-white tracking-wider">
            TECH AVENUE
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
            Computer and Accessories Store Management System
          </p>
        </div>

        {/* Error Notification Alert */}
        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold mb-1.5 text-gray-700 dark:text-gray-300">
              Username or Email
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
              <input
                type="text"
                required
                autoComplete="username"
                placeholder="Enter username or corporate email"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-darkbg-border bg-gray-50 dark:bg-darkbg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-navy transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1.5 text-gray-700 dark:text-gray-300">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 dark:border-darkbg-border bg-gray-50 dark:bg-darkbg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-navy transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-0.5 focus:outline-none"
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

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-navy hover:bg-navy-light text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <span>Sign In to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
