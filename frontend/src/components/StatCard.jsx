import React from 'react';

export default function StatCard({ title, value, subtitle, icon: Icon, badgeColor = 'accent', trend, compact = false }) {
  const isSemantic = ['red', 'amber', 'green'].includes(badgeColor);

  const getSemanticBadgeClass = () => {
    switch (badgeColor) {
      case 'red':
        return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      case 'amber':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'green':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      default:
        return '';
    }
  };

  const getSemanticIconClass = () => {
    switch (badgeColor) {
      case 'red':
        return 'bg-rose-950/30 text-rose-400 border-rose-900/40';
      case 'amber':
        return 'bg-amber-950/30 text-amber-400 border-amber-900/40';
      case 'green':
        return 'bg-emerald-950/30 text-emerald-400 border-emerald-900/40';
      default:
        return '';
    }
  };

  return (
    <div 
      className={`group relative bg-[#1C1917] border border-[#292524] rounded-xl shadow-xs transition-all duration-200 flex flex-col justify-between overflow-hidden hover:border-[var(--accent-border)] ${
        compact ? 'p-3 sm:p-3.5' : 'p-3.5 sm:p-4'
      }`}
    >
      {/* Subtle corner ambient glow */}
      <div 
        className="absolute -right-8 -top-8 w-24 h-24 rounded-full blur-xl pointer-events-none"
        style={{ backgroundColor: 'var(--accent-glow)' }}
      />
      
      {/* Top row: Label & Icon */}
      <div className="relative z-10 flex items-start justify-between gap-2">
        <div className="space-y-0.5">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400 truncate max-w-[140px]">
            {title}
          </p>
          <h3 className={`font-black text-[#FAFAF9] tracking-tight break-words font-mono ${
            compact ? 'text-base sm:text-lg' : 'text-lg sm:text-xl'
          }`}>
            {value}
          </h3>
        </div>

        {Icon && (
          <div 
            className={`p-2 rounded-lg border shrink-0 transition-transform duration-200 group-hover:scale-110 shadow-xs ${
              isSemantic ? getSemanticIconClass() : ''
            }`}
            style={!isSemantic ? {
              backgroundColor: 'var(--accent-glow)',
              color: 'var(--accent-primary)',
              borderColor: 'var(--accent-border)'
            } : undefined}
          >
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      {/* Bottom row: Subtitle & Optional Trend/Status Tag */}
      <div className="relative z-10 mt-2 pt-1.5 border-t border-[#292524] flex items-center justify-between text-[11px] gap-2">
        <span className="text-stone-400 font-medium truncate">
          {subtitle}
        </span>
        
        {trend && (
          <span 
            className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold border shrink-0 ${
              isSemantic ? getSemanticBadgeClass() : ''
            }`}
            style={!isSemantic ? {
              backgroundColor: 'var(--accent-glow)',
              color: 'var(--accent-light)',
              borderColor: 'var(--accent-border)'
            } : undefined}
          >
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}
