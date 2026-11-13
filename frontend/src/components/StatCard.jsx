import React from 'react';

export default function StatCard({ title, value, subtitle, icon: Icon, badgeColor = 'green', trend }) {
  const getBadgeStyle = () => {
    switch (badgeColor) {
      case 'red':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
      case 'amber':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'blue':
        return 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20';
      case 'purple':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
      case 'green':
      default:
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    }
  };

  const getIconContainerStyle = () => {
    switch (badgeColor) {
      case 'red':
        return 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/40';
      case 'amber':
        return 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/40';
      case 'blue':
        return 'bg-sky-50 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-900/40';
      case 'purple':
        return 'bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-900/40';
      case 'green':
      default:
        return 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/40';
    }
  };

  return (
    <div className="group relative bg-white dark:bg-darkbg-card border border-slate-200/90 dark:border-darkbg-border rounded-2xl p-5 sm:p-6 shadow-xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-200 flex flex-col justify-between overflow-hidden">
      
      {/* Top row: Label & Icon */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-gray-300">
            {title}
          </p>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight break-words">
            {value}
          </h3>
        </div>

        {Icon && (
          <div className={`p-3 rounded-xl border shrink-0 transition-transform duration-200 group-hover:scale-105 shadow-xs ${getIconContainerStyle()}`}>
            <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        )}
      </div>

      {/* Bottom row: Subtitle & Trend */}
      {(subtitle || trend) && (
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-darkbg-border/60 flex items-center justify-between gap-2">
          {subtitle && (
            <span className="text-xs font-semibold text-slate-600 dark:text-gray-400 line-clamp-1">
              {subtitle}
            </span>
          )}
          {trend && (
            <span className={`text-[11px] font-black px-2 py-0.5 rounded-full border whitespace-nowrap shadow-2xs ${getBadgeStyle()}`}>
              {trend}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
