import React from 'react';
import { Laptop, TrendingUp } from 'lucide-react';

export default function TechAvenueLogo({ isDarkMode }) {
  return (
    <div className="flex flex-col items-center text-center">
      {/* Laptop Icon with chart-line badge detail */}
      <div className="relative mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1E3A5F] text-white shadow-md">
        <Laptop className="h-7 w-7 text-white" />
        <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#CFC8BE] text-[#1E3A5F] shadow">
          <TrendingUp className="h-3.5 w-3.5 stroke-[2.5]" />
        </span>
      </div>

      {/* Brand Title */}
      <h1
        className={`text-2xl font-extrabold tracking-wider ${
          isDarkMode ? 'text-white' : 'text-[#1E3A5F]'
        }`}
      >
        TECH AVENUE
      </h1>

      {/* Subtitle */}
      <p
        className={`mt-0.5 text-xs font-medium italic tracking-wide ${
          isDarkMode ? 'text-[#CFC8BE]' : 'text-slate-500'
        }`}
      >
        Computer & Accessories
      </p>
    </div>
  );
}

