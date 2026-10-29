import React from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle({ isDarkMode, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`inline-flex items-center space-x-2 rounded-full px-4 py-2 text-xs font-semibold shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
        isDarkMode
          ? 'bg-[#2B3441] text-[#CFC8BE] border border-[#CFC8BE]/30 hover:bg-[#374151] focus:ring-[#CFC8BE]'
          : 'bg-white text-[#374151] border border-[#E5E7EB] hover:bg-slate-50 focus:ring-[#1E3A5F]'
      }`}
      aria-label="Toggle color theme"
    >
      {isDarkMode ? (
        <>
          <Sun className="h-4 w-4 text-amber-400" />
          <span>Light mode</span>
        </>
      ) : (
        <>
          <Moon className="h-4 w-4 text-[#1E3A5F]" />
          <span>Dark mode</span>
        </>
      )}
    </button>
  );
}

