import React from 'react';
import { ChevronDown, KeyRound, UserCheck } from 'lucide-react';
import { DEMO_ACCOUNTS } from '../data/demoAccounts.js';

export default function DemoCredentials({
  isOpen,
  onToggle,
  onSelectAccount,
  isDarkMode,
}) {
  return (
    <div
      className={`mt-6 rounded-2xl border transition-all duration-200 ${
        isDarkMode
          ? 'bg-[#1F2632]/80 border-[#CFC8BE]/20 text-slate-200'
          : 'bg-slate-50 border-[#E5E7EB] text-[#374151]'
      }`}
    >
      {/* Header Button to Expand/Collapse */}
      <button
        type="button"
        onClick={onToggle}
        className={`flex w-full items-center justify-between px-4 py-3 text-xs font-semibold uppercase tracking-wider transition ${
          isDarkMode
            ? 'text-[#CFC8BE] hover:text-white'
            : 'text-[#1E3A5F] hover:text-[#1E3A5F]/80'
        }`}
        aria-expanded={isOpen}
      >
        <span className="flex items-center space-x-2">
          <KeyRound className="h-4 w-4" />
          <span>Demo Login Credentials</span>
        </span>
        <ChevronDown
          className={`h-4 w-4 transform transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Expanded Content */}
      {isOpen && (
        <div className="border-t border-inherit px-3.5 py-3 space-y-2.5">
          <p
            className={`text-[11px] ${
              isDarkMode ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            Click <span className="font-semibold">Use Account</span> to autofill credentials for testing:
          </p>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {DEMO_ACCOUNTS.map((acc) => (
              <div
                key={acc.role}
                className={`flex flex-col justify-between rounded-xl border p-2.5 transition ${
                  isDarkMode
                    ? 'bg-[#2B3441] border-[#CFC8BE]/20 hover:border-[#CFC8BE]/40'
                    : 'bg-white border-[#E5E7EB] hover:border-slate-300 shadow-xs'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold ${
                        isDarkMode ? 'text-white' : 'text-[#1E3A5F]'
                      }`}
                    >
                      {acc.role}
                    </span>
                  </div>

                  <div className="mt-1 space-y-0.5 text-[11px] font-mono">
                    <p className={isDarkMode ? 'text-slate-300' : 'text-slate-600'}>
                      <span className="font-sans text-slate-400 text-[10px]">User:</span>{' '}
                      {acc.username}
                    </p>
                    <p className={isDarkMode ? 'text-slate-300' : 'text-slate-600'}>
                      <span className="font-sans text-slate-400 text-[10px]">Pass:</span>{' '}
                      {acc.password}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onSelectAccount(acc)}
                  className={`mt-2.5 flex items-center justify-center space-x-1 rounded-lg py-1 px-2 text-[11px] font-semibold transition ${
                    isDarkMode
                      ? 'bg-[#1E3A5F] text-white hover:bg-[#254b7a]'
                      : 'bg-slate-100 text-[#1E3A5F] hover:bg-[#1E3A5F] hover:text-white border border-[#E5E7EB]'
                  }`}
                >
                  <UserCheck className="h-3 w-3" />
                  <span>Use Account</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

