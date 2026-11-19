import React, { useState, useRef, useEffect } from 'react';
import { Type, ZoomIn, ZoomOut, RotateCcw, SlidersHorizontal } from 'lucide-react';
import { useTextSize } from '../context/TextSizeContext';

/**
 * TextSizeControl Component
 * Continuous Horizontal Bar Slider allowing users to freely adjust
 * text size and system layout scaling from 75% to 140%.
 *
 * Variants:
 * - "banner": Full horizontal bar slider mounted at top of dashboard views
 * - "default": Compact slider for header or login bars
 */
export default function TextSizeControl({ variant = 'default', className = '' }) {
  const {
    scalePercent,
    setScalePercent,
    decreaseScale,
    increaseScale,
    resetScale,
    minScale,
    maxScale,
    defaultScale,
  } = useTextSize();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const isMin = scalePercent <= minScale;
  const isMax = scalePercent >= maxScale;
  const isDefault = scalePercent === defaultScale;

  // Calculate percentage of track filled (0% to 100%)
  const fillPercent = Math.max(
    0,
    Math.min(100, ((scalePercent - minScale) / (maxScale - minScale)) * 100)
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // =========================================================================
  // 1. BANNER VARIANT: Free Horizontal Bar Slider across dashboard top
  // =========================================================================
  if (variant === 'banner') {
    return (
      <div
        className={`w-full bg-white/90 dark:bg-darkbg-card/90 backdrop-blur-md border border-gray-200 dark:border-darkbg-border rounded-2xl p-3 sm:px-5 sm:py-3.5 shadow-sm transition-all duration-200 ${className}`}
        style={{ fontSize: '0.75rem' }} /* Preserve control base size */
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
          {/* Left: Icon & Title */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-navy/10 dark:bg-darkbg-hover text-navy dark:text-cyan-300 border border-navy/15 dark:border-cyan-500/30 flex items-center justify-center shrink-0 shadow-xs">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-gray-900 dark:text-white tracking-tight">
                  Text & Display Scale
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-gray-100 dark:bg-darkbg text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-darkbg-border">
                  Free Slider
                </span>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                Drag the slider freely to scale text, cards, tables, and spacing across the system
              </p>
            </div>
          </div>

          {/* Center: Continuous Horizontal Slider */}
          <div className="flex-1 max-w-xl flex flex-col gap-1 px-1 sm:px-4">
            <div className="flex items-center gap-3">
              {/* Stepper Decrement */}
              <button
                type="button"
                onClick={() => decreaseScale(5)}
                disabled={isMin}
                className={`p-1.5 rounded-lg border border-gray-200 dark:border-darkbg-border bg-gray-50 dark:bg-darkbg hover:bg-white dark:hover:bg-darkbg-hover text-gray-700 dark:text-gray-200 transition-all shadow-xs cursor-pointer ${
                  isMin ? 'opacity-35 cursor-not-allowed hover:bg-gray-50 dark:hover:bg-darkbg' : 'active:scale-95'
                }`}
                title="Decrease size by 5%"
                aria-label="Decrease text size"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>

              {/* Slider Bar Container */}
              <div className="relative flex-1 flex items-center py-1">
                {/* Visual Track with Fluid Fill */}
                <div className="absolute inset-x-0 h-2 rounded-full bg-gray-200 dark:bg-slate-700 overflow-hidden pointer-events-none">
                  <div
                    className="h-full bg-gradient-to-r from-navy to-cyan-500 dark:from-blue-600 dark:to-cyan-400 transition-all duration-75"
                    style={{ width: `${fillPercent}%` }}
                  />
                </div>

                {/* Free continuous Range Input */}
                <input
                  type="range"
                  min={minScale}
                  max={maxScale}
                  step="1"
                  value={scalePercent}
                  onChange={(e) => setScalePercent(Number(e.target.value))}
                  className="text-size-slider relative z-10 w-full"
                  aria-label="Continuous text scale slider"
                  title={`Adjust display scale: ${scalePercent}%`}
                />
              </div>

              {/* Stepper Increment */}
              <button
                type="button"
                onClick={() => increaseScale(5)}
                disabled={isMax}
                className={`p-1.5 rounded-lg border border-gray-200 dark:border-darkbg-border bg-gray-50 dark:bg-darkbg hover:bg-white dark:hover:bg-darkbg-hover text-gray-700 dark:text-gray-200 transition-all shadow-xs cursor-pointer ${
                  isMax ? 'opacity-35 cursor-not-allowed hover:bg-gray-50 dark:hover:bg-darkbg' : 'active:scale-95'
                }`}
                title="Increase size by 5%"
                aria-label="Increase text size"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Slider Range Orientation Guide */}
            <div className="flex justify-between px-7 text-[10px] text-gray-400 dark:text-gray-500 select-none">
              <span
                className="cursor-pointer hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                onClick={() => setScalePercent(minScale)}
                title={`Set to minimum (${minScale}%)`}
              >
                {minScale}% (Compact)
              </span>

              <button
                type="button"
                onClick={resetScale}
                className={`transition-colors cursor-pointer font-medium ${
                  isDefault
                    ? 'text-navy dark:text-cyan-400 font-bold'
                    : 'hover:text-gray-700 dark:hover:text-gray-300'
                }`}
                title="Click to reset to 100% Default"
              >
                100% (Default)
              </button>

              <span
                className="cursor-pointer hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                onClick={() => setScalePercent(maxScale)}
                title={`Set to maximum (${maxScale}%)`}
              >
                {maxScale}% (Large)
              </span>
            </div>
          </div>

          {/* Right: Real-time Value Chip & Quick Reset */}
          <div className="flex items-center gap-2 self-end md:self-center shrink-0">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-navy/10 dark:bg-cyan-500/15 border border-navy/20 dark:border-cyan-400/30 text-navy dark:text-cyan-300 font-bold text-xs shadow-xs">
              <Type className="w-3.5 h-3.5" />
              <span className="font-mono text-xs">{scalePercent}%</span>
              {isDefault && <span className="text-[10px] opacity-75 font-normal">(Default)</span>}
            </div>

            {/* Quick Reset Button (visible when not 100%) */}
            {!isDefault && (
              <button
                type="button"
                onClick={resetScale}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-gray-200 dark:border-darkbg-border bg-gray-50 dark:bg-darkbg hover:bg-gray-100 dark:hover:bg-darkbg-hover text-gray-700 dark:text-gray-200 text-xs font-semibold transition-all shadow-xs active:scale-95 cursor-pointer"
                title="Reset display scale to 100%"
              >
                <RotateCcw className="w-3 h-3 text-navy dark:text-cyan-400" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 2. COMPACT / DEFAULT VARIANT: Free horizontal slider with popover
  // =========================================================================
  return (
    <div ref={dropdownRef} className={`relative inline-flex items-center ${className}`}>
      {/* Compact Interactive Trigger with Quick Horizontal Slider Bar */}
      <div className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 dark:border-darkbg-border bg-gray-50/90 dark:bg-darkbg/90 backdrop-blur-md px-2 py-1 shadow-xs transition-colors">
        {/* Decrement Button */}
        <button
          type="button"
          onClick={() => decreaseScale(5)}
          disabled={isMin}
          className={`p-1 rounded-md text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-darkbg-hover hover:text-navy dark:hover:text-white transition-colors cursor-pointer ${
            isMin ? 'opacity-35 cursor-not-allowed hover:bg-transparent' : ''
          }`}
          title="Make smaller"
          aria-label="Decrease text size"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>

        {/* Mini Continuous Horizontal Slider */}
        <div className="relative w-16 sm:w-24 flex items-center py-1">
          <div className="absolute inset-x-0 h-1.5 rounded-full bg-gray-200 dark:bg-slate-700 overflow-hidden pointer-events-none">
            <div
              className="h-full bg-navy dark:bg-cyan-400 transition-all duration-75"
              style={{ width: `${fillPercent}%` }}
            />
          </div>
          <input
            type="range"
            min={minScale}
            max={maxScale}
            step="1"
            value={scalePercent}
            onChange={(e) => setScalePercent(Number(e.target.value))}
            className="text-size-slider relative z-10 w-full"
            aria-label="Continuous text scale slider"
            title={`Scale: ${scalePercent}%`}
          />
        </div>

        {/* Increment Button */}
        <button
          type="button"
          onClick={() => increaseScale(5)}
          disabled={isMax}
          className={`p-1 rounded-md text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-darkbg-hover hover:text-navy dark:hover:text-white transition-colors cursor-pointer ${
            isMax ? 'opacity-35 cursor-not-allowed hover:bg-transparent' : ''
          }`}
          title="Make larger"
          aria-label="Increase text size"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>

        {/* Current Size Label / Popover Opener */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs font-semibold text-gray-800 dark:text-gray-200 hover:bg-white dark:hover:bg-darkbg-hover transition-colors cursor-pointer border-l border-gray-200 dark:border-darkbg-border pl-1.5"
          title="Click to view detailed scale slider"
        >
          <span className="text-[11px] font-mono">{scalePercent}%</span>
        </button>
      </div>

      {/* Popover Menu with Continuous Horizontal Slider */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl bg-white dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-border shadow-2xl p-3.5 z-50 animate-in fade-in zoom-in-95 duration-100 select-none">
          <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-gray-100 dark:border-darkbg-border">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
              <SlidersHorizontal className="w-3 h-3 text-navy dark:text-cyan-400" /> Free Slider
            </span>
            <span className="text-xs font-mono font-bold text-navy dark:text-cyan-300">
              {scalePercent}%
            </span>
          </div>

          {/* Continuous Range Slider in Popover */}
          <div className="space-y-3 py-1">
            <div className="relative flex items-center py-1">
              <div className="absolute inset-x-0 h-2 rounded-full bg-gray-200 dark:bg-slate-700 overflow-hidden pointer-events-none">
                <div
                  className="h-full bg-gradient-to-r from-navy to-cyan-500 dark:from-blue-600 dark:to-cyan-400 transition-all duration-75"
                  style={{ width: `${fillPercent}%` }}
                />
              </div>
              <input
                type="range"
                min={minScale}
                max={maxScale}
                step="1"
                value={scalePercent}
                onChange={(e) => setScalePercent(Number(e.target.value))}
                className="text-size-slider relative z-10 w-full"
                aria-label="Text scale slider in popover"
              />
            </div>

            <div className="flex justify-between text-[10px] text-gray-400 dark:text-gray-500">
              <span>{minScale}%</span>
              <button
                type="button"
                onClick={resetScale}
                className="hover:text-navy dark:hover:text-cyan-300 font-medium cursor-pointer"
              >
                100% (Default)
              </button>
              <span>{maxScale}%</span>
            </div>
          </div>

          {/* Footer with Reset */}
          <div className="mt-3 pt-2 border-t border-gray-100 dark:border-darkbg-border flex items-center justify-between text-[10px]">
            <span className="text-gray-400">Continuous system scale</span>
            {!isDefault && (
              <button
                type="button"
                onClick={resetScale}
                className="text-navy dark:text-cyan-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-2.5 h-2.5" /> Reset to 100%
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
