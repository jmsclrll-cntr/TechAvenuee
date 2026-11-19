import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard,
  Package,
  Receipt,
  Users,
  Truck,
  BarChart3,
  BrainCircuit,
  ChevronUp
} from 'lucide-react';

export default function BottomDock({ activeTab, setActiveTab }) {
  const [hoveredId, setHoveredId] = useState(null);
  const [predictionDropdownOpen, setPredictionDropdownOpen] = useState(false);
  const predictionMenuRef = useRef(null);

  const adminNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'sales', label: 'Sales Transactions', icon: Receipt },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'purchasing', label: 'Suppliers & Purchasing', icon: Truck },
    { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 }
  ];

  const predictionSubItems = [
    { id: 'pred_demand', label: 'Product Demand Prediction' },
    { id: 'pred_sales', label: 'Sales Prediction' },
    { id: 'pred_slow_moving', label: 'Slow-Moving Products' },
    { id: 'pred_best_selling', label: 'Best-Selling Products' }
  ];

  const isPredictionActive = predictionSubItems.some(item => item.id === activeTab);

  // Close prediction dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (predictionMenuRef.current && !predictionMenuRef.current.contains(e.target)) {
        setPredictionDropdownOpen(false);
        setHoveredId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-[96vw] pointer-events-none select-none">
      <nav
        aria-label="Floating Navigation Dock"
        className="pointer-events-auto bg-[#15121E]/95 backdrop-blur-xl border border-[#252033] shadow-[0_16px_50px_rgba(0,0,0,0.75),0_0_0_1px_rgba(255,255,255,0.06)] rounded-full p-2.5 sm:p-3 flex items-center gap-4 overflow-visible"
      >
        {adminNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const isHovered = hoveredId === item.id;
          const isExpanded = isActive || isHovered;

          return (
            <button
              key={item.id}
              type="button"
              onMouseEnter={() => setHoveredId(item.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => {
                setActiveTab(item.id);
                setPredictionDropdownOpen(false);
              }}
              title={item.label}
              className={`relative flex items-center justify-center h-12 sm:h-13 rounded-full transition-all duration-300 ease-out cursor-pointer active:scale-95 ${isExpanded
                ? 'px-4 sm:px-5 shadow-lg'
                : 'w-12 sm:w-13 px-0'
                } ${isActive
                  ? 'bg-[#8B5CF6] text-white font-black shadow-lg shadow-purple-900/40 ring-2 ring-purple-400/40'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
            >
              {/* Icon: Always remains visible */}
              <Icon className="w-5 h-5 sm:w-6 sm:h-6 shrink-0 transition-transform duration-200" />

              {/* Text: When clicked/active, remains visible at the same time as the icon */}
              <span
                className={`whitespace-nowrap overflow-hidden transition-all duration-300 ease-out text-xs sm:text-sm font-extrabold leading-none select-none ${isExpanded
                  ? 'max-w-[260px] opacity-100 ml-2.5 inline-block'
                  : 'max-w-0 opacity-0 ml-0 pointer-events-none'
                  }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}

        {/* Separator Line with Spacing */}
        <div className="w-[1px] h-6 bg-[#252033] mx-2 shrink-0" />

        {/* Knowledge Analysis & Prediction Upward Dropdown */}
        <div ref={predictionMenuRef} className="relative shrink-0">
          {(() => {
            const isHovered = hoveredId === 'predictions';
            const isExpanded = isPredictionActive || isHovered || predictionDropdownOpen;

            return (
              <button
                type="button"
                onMouseEnter={() => setHoveredId('predictions')}
                onMouseLeave={() => {
                  if (!predictionDropdownOpen) {
                    setHoveredId(null);
                  }
                }}
                onClick={() => {
                  setPredictionDropdownOpen(!predictionDropdownOpen);
                  setHoveredId('predictions');
                }}
                title="Knowledge Analysis & Prediction"
                className={`relative flex items-center justify-center h-12 sm:h-13 rounded-full transition-all duration-300 ease-out cursor-pointer active:scale-95 ${isExpanded
                  ? 'px-4 sm:px-5 shadow-lg'
                  : 'w-12 sm:w-13 px-0'
                  } ${isPredictionActive
                    ? 'bg-[#8B5CF6] text-white font-black shadow-lg shadow-purple-900/40 ring-2 ring-purple-400/40'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
              >
                {/* Icon: Always remains visible */}
                <BrainCircuit className="w-5 h-5 sm:w-6 sm:h-6 shrink-0 transition-transform duration-200" />

                {/* Text & Chevron: Remains visible at the same time as the icon when active or hovered */}
                <span
                  className={`whitespace-nowrap overflow-hidden transition-all duration-300 ease-out text-xs sm:text-sm font-extrabold leading-none select-none flex items-center gap-2 ${isExpanded
                    ? 'max-w-[300px] opacity-100 ml-2.5 inline-flex'
                    : 'max-w-0 opacity-0 ml-0 pointer-events-none'
                    }`}
                >
                  <span>Knowledge Analysis &amp; Prediction</span>
                  <ChevronUp className={`w-4 h-4 transition-transform duration-200 ${predictionDropdownOpen ? 'rotate-180' : ''}`} />
                </span>
              </button>
            );
          })()}

          {/* Upward Submenu with Fade-in */}
          {predictionDropdownOpen && (
            <div className="absolute bottom-full mb-3 right-0 w-72 rounded-2xl bg-[#15121E]/98 backdrop-blur-xl border border-[#252033] shadow-[0_18px_45px_rgba(0,0,0,0.75),0_0_0_1px_rgba(255,255,255,0.08)] p-2.5 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="px-3.5 py-2 text-[11px] uppercase font-bold tracking-wider text-gray-400 border-b border-[#252033]/70 mb-1.5">
                Prediction Modules
              </div>
              {predictionSubItems.map((sub) => {
                const isSubActive = activeTab === sub.id;
                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(sub.id);
                      setPredictionDropdownOpen(false);
                      setHoveredId(null);
                    }}
                    className={`w-full text-left flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${isSubActive
                      ? 'bg-[#8B5CF6] text-white font-black shadow-sm'
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                      }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${isSubActive ? 'bg-white' : 'bg-gray-400'}`} />
                    <span>{sub.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </nav>
    </div>
  );
}
