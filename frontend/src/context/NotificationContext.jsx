import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import {
  Bell,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
  Trash2,
  Clock,
  CheckCheck
} from 'lucide-react';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [history, setHistory] = useState(() => {
    try {
      const saved = sessionStorage.getItem('techavenue_notifications');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [toasts, setToasts] = useState([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all' | 'accepted' | 'error'
  const historyModalRef = useRef(null);

  // Sync to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem('techavenue_notifications', JSON.stringify(history));
    } catch (e) {
      console.warn('Failed to save notifications to sessionStorage', e);
    }
  }, [history]);

  // Close history drawer when clicking outside
  useEffect(() => {
    if (!isHistoryOpen) return;
    const handleClickOutside = (e) => {
      if (historyModalRef.current && !historyModalRef.current.contains(e.target)) {
        setIsHistoryOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isHistoryOpen]);

  const showNotification = useCallback((message, type = 'success', title = null) => {
    if (!message) return;
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 6);
    const resolvedTitle = title || (
      type === 'success' ? 'Accepted' :
      type === 'error' ? 'System Error' :
      type === 'warning' ? 'Warning' : 'Information'
    );

    const newEntry = {
      id,
      message,
      type, // 'success' | 'error' | 'warning' | 'info'
      title: resolvedTitle,
      timestamp: new Date().toISOString(),
      read: false
    };

    // Prepend to history (keep latest 80)
    setHistory(prev => [newEntry, ...prev].slice(0, 80));

    // Show floating bottom-left toast (keep max 3 active)
    setToasts(prev => [newEntry, ...prev].slice(0, 3));

    // Auto dismiss toast after 5.5s
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5500);
  }, []);

  const showSuccess = useCallback((message, title = 'Accepted') => {
    showNotification(message, 'success', title);
  }, [showNotification]);

  const showError = useCallback((message, title = 'System Error') => {
    showNotification(message, 'error', title);
  }, [showNotification]);

  const showWarning = useCallback((message, title = 'Warning') => {
    showNotification(message, 'warning', title);
  }, [showNotification]);

  const showInfo = useCallback((message, title = 'Information') => {
    showNotification(message, 'info', title);
  }, [showNotification]);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    setToasts([]);
    try {
      sessionStorage.removeItem('techavenue_notifications');
    } catch {
      // ignore
    }
  }, []);

  const markAllAsRead = useCallback(() => {
    setHistory(prev => prev.map(item => ({ ...item, read: true })));
  }, []);

  // Make available globally on window
  useEffect(() => {
    window.showNotification = showNotification;
    window.showSuccess = showSuccess;
    window.showError = showError;
    window.showWarning = showWarning;
    window.showInfo = showInfo;

    return () => {
      delete window.showNotification;
      delete window.showSuccess;
      delete window.showError;
      delete window.showWarning;
      delete window.showInfo;
    };
  }, [showNotification, showSuccess, showError, showWarning, showInfo]);

  const unreadCount = history.filter(item => !item.read).length;

  const handleToggleHistory = () => {
    const nextState = !isHistoryOpen;
    setIsHistoryOpen(nextState);
    if (nextState) {
      markAllAsRead();
    }
  };

  const filteredHistory = history.filter(item => {
    if (filter === 'accepted') return item.type === 'success';
    if (filter === 'error') return item.type === 'error';
    return true;
  });

  const formatTime = (isoString) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        history,
        toasts,
        showNotification,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        removeToast,
        clearHistory,
        markAllAsRead,
        isHistoryOpen,
        setIsHistoryOpen
      }}
    >
      {children}

      {/* FLOATING TOAST POPUPS (BOTTOM-LEFT) */}
      <div className="fixed bottom-20 left-4 sm:left-6 z-50 flex flex-col-reverse gap-2.5 max-w-[380px] w-[calc(100vw-2rem)] pointer-events-none">
        {toasts.map((toast) => {
          const isError = toast.type === 'error';
          const isWarning = toast.type === 'warning';
          const isInfo = toast.type === 'info';

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto p-3.5 rounded-2xl border shadow-2xl flex items-start justify-between gap-3 bg-[#1C1917]/98 backdrop-blur-xl text-xs font-medium transition-all duration-300 animate-in fade-in slide-in-from-bottom-3 ${
                isError
                  ? 'border-red-500/50 shadow-red-950/40 text-red-100'
                  : isWarning
                  ? 'border-amber-500/50 shadow-amber-950/40 text-amber-100'
                  : isInfo
                  ? 'border-blue-500/50 shadow-blue-950/40 text-blue-100'
                  : 'border-emerald-500/50 shadow-emerald-950/40 text-emerald-100'
              }`}
            >
              <div className="flex items-start gap-2.5 min-w-0 flex-1">
                <div className="shrink-0 mt-0.5">
                  {isError ? (
                    <div className="w-6 h-6 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center">
                      <AlertCircle className="w-3.5 h-3.5" />
                    </div>
                  ) : isWarning ? (
                    <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center">
                      <AlertTriangle className="w-3.5 h-3.5" />
                    </div>
                  ) : isInfo ? (
                    <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center">
                      <Info className="w-3.5 h-3.5" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-[10px] font-extrabold uppercase tracking-wider ${
                        isError
                          ? 'text-red-400'
                          : isWarning
                          ? 'text-amber-400'
                          : isInfo
                          ? 'text-blue-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {toast.title}
                    </span>
                    <span className="text-[10px] text-stone-500 font-mono">Just now</span>
                  </div>
                  <p className="text-xs text-stone-200 leading-snug break-words">
                    {toast.message}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="text-stone-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition shrink-0 cursor-pointer"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {/* FLOATING NOTIFICATION ICON BUTTON (BOTTOM-LEFT) */}
      <div className="fixed bottom-5 left-4 sm:left-6 z-50">
        <button
          type="button"
          onClick={handleToggleHistory}
          title="System Notification History"
          className={`relative w-11 h-11 sm:w-12 sm:h-12 rounded-full border flex items-center justify-center transition-all duration-200 cursor-pointer shadow-xl active:scale-95 ${
            isHistoryOpen
              ? 'bg-[#F97316] text-white border-orange-400 ring-2 ring-orange-500/30'
              : 'bg-[#1C1917]/95 backdrop-blur-xl border-[#292524] text-stone-300 hover:text-white hover:bg-[#292524] hover:border-stone-600'
          }`}
        >
          <Bell className="w-5 h-5 shrink-0" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-[#F97316] text-white text-[10px] font-black flex items-center justify-center shadow-lg ring-2 ring-[#141210] animate-pulse">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* NOTIFICATION HISTORY POPUP CARD (BOTTOM-LEFT) */}
      {isHistoryOpen && (
        <div
          ref={historyModalRef}
          className="fixed bottom-18 sm:bottom-20 left-4 sm:left-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] rounded-2xl bg-[#1C1917]/98 backdrop-blur-2xl border border-[#292524] shadow-[0_24px_60px_rgba(0,0,0,0.85)] flex flex-col max-h-[520px] overflow-hidden text-white animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
          {/* Header */}
          <div className="p-3.5 sm:p-4 border-b border-[#292524] flex items-center justify-between bg-[#141210]/60">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-orange-500/10 border border-orange-500/20 text-[#F97316] flex items-center justify-center">
                <Bell className="w-3.5 h-3.5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-[#FAFAF9] leading-tight">
                  System Notification History
                </h3>
                <p className="text-[10px] text-stone-400">
                  {history.length} event{history.length === 1 ? '' : 's'} recorded
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {history.length > 0 && (
                <button
                  type="button"
                  onClick={clearHistory}
                  className="px-2 py-1 text-stone-400 hover:text-red-400 rounded-lg hover:bg-white/5 transition text-xs flex items-center gap-1 font-semibold cursor-pointer"
                  title="Clear all history"
                >
                  <Trash2 className="w-3 h-3" />
                  <span className="text-[10px]">Clear</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsHistoryOpen(false)}
                className="p-1 text-stone-400 hover:text-white rounded-lg hover:bg-white/5 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="px-3 py-2 border-b border-[#292524] flex items-center gap-1.5 bg-[#171412]">
            {['all', 'accepted', 'error'].map((tabKey) => (
              <button
                key={tabKey}
                onClick={() => setFilter(tabKey)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold capitalize transition-all cursor-pointer ${
                  filter === tabKey
                    ? 'bg-[#F97316] text-white shadow-sm'
                    : 'text-stone-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {tabKey === 'all'
                  ? `All (${history.length})`
                  : tabKey === 'accepted'
                  ? `Accepted (${history.filter((h) => h.type === 'success').length})`
                  : `Errors (${history.filter((h) => h.type === 'error').length})`}
              </button>
            ))}
          </div>

          {/* List of Notifications */}
          <div className="flex-1 overflow-y-auto p-2 sm:p-2.5 space-y-1.5 max-h-[360px] scrollbar-thin">
            {filteredHistory.length === 0 ? (
              <div className="py-12 text-center text-stone-500 space-y-2">
                <Clock className="w-8 h-8 mx-auto opacity-40 text-stone-500" />
                <p className="text-xs font-semibold">No notification history found.</p>
                <p className="text-[10px] text-stone-600">
                  Errors and accepted system events will appear here.
                </p>
              </div>
            ) : (
              filteredHistory.map((item) => (
                <div
                  key={item.id}
                  className={`p-2.5 rounded-xl border transition-all text-xs flex items-start gap-2.5 ${
                    item.type === 'error'
                      ? 'bg-red-500/5 border-red-500/20 text-stone-200'
                      : item.type === 'warning'
                      ? 'bg-amber-500/5 border-amber-500/20 text-stone-200'
                      : item.type === 'info'
                      ? 'bg-blue-500/5 border-blue-500/20 text-stone-200'
                      : 'bg-emerald-500/5 border-emerald-500/20 text-stone-200'
                  }`}
                >
                  <div className="shrink-0 mt-0.5">
                    {item.type === 'error' ? (
                      <AlertCircle className="w-4 h-4 text-red-400" />
                    ) : item.type === 'warning' ? (
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                    ) : item.type === 'info' ? (
                      <Info className="w-4 h-4 text-blue-400" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wide ${
                          item.type === 'error'
                            ? 'text-red-400'
                            : item.type === 'warning'
                            ? 'text-amber-400'
                            : item.type === 'info'
                            ? 'text-blue-400'
                            : 'text-emerald-400'
                        }`}
                      >
                        {item.title}
                      </span>
                      <span className="text-[10px] text-stone-500 font-mono shrink-0">
                        {formatTime(item.timestamp)}
                      </span>
                    </div>
                    <p className="text-xs text-stone-300 leading-snug break-words">
                      {item.message}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    return {
      showNotification: (msg, type, title) => window.showNotification?.(msg, type, title),
      showSuccess: (msg, title) => window.showSuccess?.(msg, title),
      showError: (msg, title) => window.showError?.(msg, title),
      showWarning: (msg, title) => window.showWarning?.(msg, title),
      showInfo: (msg, title) => window.showInfo?.(msg, title),
      history: [],
      toasts: [],
      removeToast: () => {},
      clearHistory: () => {},
      markAllAsRead: () => {},
      isHistoryOpen: false,
      setIsHistoryOpen: () => {}
    };
  }
  return context;
}

export default NotificationContext;
