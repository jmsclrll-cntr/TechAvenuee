import React from 'react';

export default function StatCard({ title, value, subtitle, icon: Icon, badgeColor = 'green', trend }) {
  const getBadgeStyle = () => {
    switch (badgeColor) {
      case 'red':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'amber':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'blue':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'green':
      default:
        return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    }
  };

  return (
    <div className="bg-white dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
            {title}
          </p>
          <h3 className="text-2xl font-bold mt-1 text-gray-900 dark:text-white">
            {value}
          </h3>
        </div>
        {Icon && (
          <div className="p-2.5 rounded-lg bg-navy/5 dark:bg-darkbg-hover text-navy dark:text-greige">
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {(subtitle || trend) && (
        <div className="mt-3 flex items-center gap-2">
          {trend && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${getBadgeStyle()}`}>
              {trend}
            </span>
          )}
          {subtitle && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

