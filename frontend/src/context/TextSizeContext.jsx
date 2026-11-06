import React, { createContext, useContext, useState, useEffect } from 'react';

export const MIN_TEXT_SCALE = 75;  // 75% min
export const MAX_TEXT_SCALE = 140; // 140% max
export const DEFAULT_TEXT_SCALE = 100; // 100% default

const TextSizeContext = createContext({
  scalePercent: DEFAULT_TEXT_SCALE,
  setScalePercent: () => {},
  decreaseScale: () => {},
  increaseScale: () => {},
  resetScale: () => {},
  minScale: MIN_TEXT_SCALE,
  maxScale: MAX_TEXT_SCALE,
  defaultScale: DEFAULT_TEXT_SCALE,
  // Backwards compatibility helpers
  textSize: '100%',
  resetTextSize: () => {},
  decreaseTextSize: () => {},
  increaseTextSize: () => {},
});

export function TextSizeProvider({ children }) {
  const [scalePercent, setScalePercentState] = useState(() => {
    try {
      const saved = localStorage.getItem('techavenue_text_scale');
      if (saved) {
        const num = Number(saved);
        if (!isNaN(num) && num >= MIN_TEXT_SCALE && num <= MAX_TEXT_SCALE) {
          return num;
        }
      }
      // Also check legacy id
      const legacy = localStorage.getItem('techavenue_text_size');
      if (legacy === 'sm') return 88;
      if (legacy === 'md') return 100;
      if (legacy === 'lg') return 112;
      if (legacy === 'xl') return 125;
    } catch {
      // Ignore localStorage errors
    }
    return DEFAULT_TEXT_SCALE;
  });

  const applyScale = (percent) => {
    const root = document.documentElement;
    const clamped = Math.max(MIN_TEXT_SCALE, Math.min(MAX_TEXT_SCALE, Math.round(percent)));
    const decimal = (clamped / 100).toFixed(3);

    // Apply font-size to root document element
    root.style.setProperty('--root-font-size', `${clamped}%`);
    root.style.setProperty('--text-scale', decimal);
    root.style.fontSize = `${clamped}%`;

    try {
      localStorage.setItem('techavenue_text_scale', clamped.toString());
      localStorage.setItem('techavenue_text_size', `${clamped}%`);
    } catch {
      // Ignore localStorage errors
    }
  };

  useEffect(() => {
    applyScale(scalePercent);
  }, [scalePercent]);

  const setScalePercent = (val) => {
    const num = typeof val === 'number' ? val : Number(val);
    if (!isNaN(num)) {
      const clamped = Math.max(MIN_TEXT_SCALE, Math.min(MAX_TEXT_SCALE, Math.round(num)));
      setScalePercentState(clamped);
    }
  };

  const decreaseScale = (step = 5) => {
    setScalePercentState((prev) => Math.max(MIN_TEXT_SCALE, prev - step));
  };

  const increaseScale = (step = 5) => {
    setScalePercentState((prev) => Math.min(MAX_TEXT_SCALE, prev + step));
  };

  const resetScale = () => {
    setScalePercentState(DEFAULT_TEXT_SCALE);
  };

  return (
    <TextSizeContext.Provider
      value={{
        scalePercent,
        setScalePercent,
        decreaseScale,
        increaseScale,
        resetScale,
        minScale: MIN_TEXT_SCALE,
        maxScale: MAX_TEXT_SCALE,
        defaultScale: DEFAULT_TEXT_SCALE,
        // Backwards compatibility mappings
        textSize: `${scalePercent}%`,
        resetTextSize: resetScale,
        decreaseTextSize: () => decreaseScale(5),
        increaseTextSize: () => increaseScale(5),
      }}
    >
      {children}
    </TextSizeContext.Provider>
  );
}

export function useTextSize() {
  const context = useContext(TextSizeContext);
  if (!context) {
    throw new Error('useTextSize must be used within a TextSizeProvider');
  }
  return context;
}

export default TextSizeContext;
