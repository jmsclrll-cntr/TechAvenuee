import React, { useState } from 'react';
import {
  LayoutDashboard,
  Package,
  ArrowDownLeft,
  ArrowUpRight,
  History,
  AlertTriangle,
  Truck,
  ShoppingCart,
  PlusCircle,
  Receipt,
  Search,
  UserCheck,
  Users,
  BarChart3,
  Settings,
  User,
  LogOut,
  BrainCircuit,
  Database,
  Cpu,
  Award,
  GitCompare,
  Save,
  ChevronDown,
  ChevronRight,
  PackageCheck
} from 'lucide-react';
import logoImg from '../assets/logo.png';

export default function Sidebar({ role, activeTab, setActiveTab, onLogout, onSwitchRole }) {
  const [predictionExpanded, setPredictionExpanded] = useState(true);

  const getNavItems = () => {
    switch (role) {
      case 'inventory_clerk':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'inventory', label: 'Inventory', icon: Package },
          { id: 'stock_in', label: 'Stock In / Restocking', icon: ArrowDownLeft },
          { id: 'stock_out', label: 'Stock Out', icon: ArrowUpRight },
          { id: 'movements', label: 'Stock Movement History', icon: History },
          { id: 'low_stock', label: 'Low-Stock Alerts', icon: AlertTriangle },
          { id: 'suppliers', label: 'Suppliers', icon: Truck },
          { id: 'profile', label: 'My Profile', icon: User }
        ];

      case 'sales_personnel':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'pos', label: 'Market / Point of Sale', icon: ShoppingCart },
          { id: 'new_transaction', label: 'New Transaction', icon: PlusCircle },
          { id: 'sales_history', label: 'Sales History', icon: History },
          { id: 'receipts', label: 'Receipts', icon: Receipt },
          { id: 'product_lookup', label: 'Product Lookup', icon: Search },
          { id: 'shift_summary', label: 'Shift Summary', icon: UserCheck },
          { id: 'profile', label: 'My Profile', icon: User }
        ];

      case 'admin':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'inventory', label: 'Inventory', icon: Package },
          { id: 'sales', label: 'Sales Transactions', icon: Receipt },
          { id: 'users', label: 'User Management', icon: Users },
          { id: 'purchasing', label: 'Suppliers & Purchasing', icon: Truck },
          { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
          { 
            id: 'predictions', 
            label: 'Knowledge Analysis & Prediction', 
            icon: BrainCircuit,
            isParent: true,
            subItems: [
              { id: 'pred_demand', label: 'Product Demand Prediction' },
              { id: 'pred_sales', label: 'Sales Prediction' },
              { id: 'pred_slow_moving', label: 'Slow-Moving Products' },
              { id: 'pred_best_selling', label: 'Best-Selling Products' }
            ]
          },
          { id: 'settings', label: 'Settings', icon: Settings },
          { id: 'profile', label: 'My Profile', icon: User }
        ];

      case 'instructor':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'inventory_overview', label: 'Inventory Overview', icon: Package },
          { id: 'sales_overview', label: 'Sales Overview', icon: Receipt },
          { 
            id: 'predictions', 
            label: 'Knowledge Analysis & Prediction', 
            icon: BrainCircuit,
            isParent: true,
            subItems: [
              { id: 'pred_demand', label: 'Product Demand Prediction' },
              { id: 'pred_sales', label: 'Sales Prediction' },
              { id: 'pred_slow_moving', label: 'Slow-Moving Products' },
              { id: 'pred_best_selling', label: 'Best-Selling Products' }
            ]
          },
          { id: 'datasets', label: 'Dataset Explorer', icon: Database },
          { id: 'train', label: 'Model Training', icon: Cpu },
          { id: 'evaluate', label: 'Model Evaluation', icon: Award },
          { id: 'compare', label: 'Model Comparison', icon: GitCompare },
          { id: 'saved_models', label: 'Saved Models', icon: Save },
          { id: 'prediction_history', label: 'Prediction History', icon: History },
          { id: 'profile', label: 'My Profile', icon: User }
        ];

      default:
        return [{ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }];
    }
  };

  const navItems = getNavItems();

  const getRoleDisplayName = () => {
    switch (role) {
      case 'inventory_clerk': return 'Inventory Clerk';
      case 'sales_personnel': return 'Sales Personnel';
      case 'instructor': return 'Instructor Account';
      case 'admin': return 'Administrator';
      default: return 'User';
    }
  };

  return (
    <aside className="w-64 shrink-0 min-h-screen bg-navy dark:bg-darkbg-card border-r border-navy-dark dark:border-darkbg-border flex flex-col justify-between transition-colors shadow-lg text-white">
      {/* Brand Logo & Header */}
      <div>
        <div className="p-5 border-b border-navy-light/40 dark:border-darkbg-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 dark:bg-white/5 border border-white/20 flex items-center justify-center p-1.5 shrink-0 overflow-hidden shadow-inner">
            <img 
              src={logoImg} 
              alt="Tech Avenue Logo" 
              className="w-full h-full object-contain"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentNode.innerHTML = '<svg class="w-6 h-6 text-greige" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>';
              }}
            />
          </div>
          <div>
            <span className="font-extrabold text-base tracking-wider text-white flex items-center gap-1.5">
              TECH AVENUE
            </span>
            <p className="text-[10px] text-greige tracking-wide font-medium uppercase">
              Computer & Accessories
            </p>
          </div>
        </div>

        {/* Current Active Role Badge */}
        <div className="px-5 py-3 bg-navy-dark/40 dark:bg-darkbg/50 border-b border-navy-light/20 dark:border-darkbg-border flex items-center justify-between">
          <span className="text-[11px] text-greige uppercase font-semibold tracking-wider">
            Active Workspace
          </span>
          <span className="text-xs px-2 py-0.5 rounded font-bold bg-greige/20 text-greige border border-greige/30">
            {getRoleDisplayName()}
          </span>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-270px)]">
          {navItems.map((item) => {
            const Icon = item.icon;

            // Handle parent item with sub-items (Knowledge Analysis & Prediction)
            if (item.isParent) {
              const isChildActive = item.subItems.some(sub => sub.id === activeTab) || activeTab === item.id;
              
              return (
                <div key={item.id} className="space-y-1">
                  <button
                    onClick={() => {
                      setPredictionExpanded(!predictionExpanded);
                      setActiveTab(item.id);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all text-left ${
                      isChildActive
                        ? 'bg-navy-light/80 text-white font-bold'
                        : 'text-gray-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3 truncate">
                      <Icon className="w-4 h-4 shrink-0 text-greige" />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {predictionExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5 shrink-0 text-greige" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                    )}
                  </button>

                  {/* Collapsible Sub-Items */}
                  {predictionExpanded && (
                    <div className="pl-6 space-y-1 border-l-2 border-greige/30 ml-4 py-1">
                      {item.subItems.map((sub) => {
                        const isSubActive = activeTab === sub.id;
                        return (
                          <button
                            key={sub.id}
                            onClick={() => setActiveTab(sub.id)}
                            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[11px] transition-all text-left ${
                              isSubActive
                                ? 'bg-greige text-navy font-bold shadow-sm'
                                : 'text-gray-300 hover:text-white hover:bg-white/10'
                            }`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70"></span>
                            <span className="truncate">{sub.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all text-left ${
                  isActive
                    ? 'bg-greige text-navy font-bold shadow-sm'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-navy' : 'text-greige'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Role Switcher & Logout Footer */}
      <div className="p-4 border-t border-navy-light/40 dark:border-darkbg-border bg-navy-dark/60 dark:bg-darkbg/60 space-y-3">
        <div>
          <label className="block text-[10px] uppercase font-bold text-greige tracking-wider mb-1.5">
            Role Switcher (Demo / Testing)
          </label>
          <select
            value={role}
            onChange={(e) => onSwitchRole(e.target.value)}
            className="w-full text-xs bg-white/10 dark:bg-darkbg-card border border-white/20 dark:border-darkbg-border text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-greige cursor-pointer"
          >
            <option value="inventory_clerk" className="text-gray-900">Inventory Clerk</option>
            <option value="sales_personnel" className="text-gray-900">Sales Personnel</option>
            <option value="admin" className="text-gray-900">Admin</option>
            <option value="instructor" className="text-gray-900">Instructor Account</option>
          </select>
        </div>

        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-300 text-xs font-semibold border border-red-500/30 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
