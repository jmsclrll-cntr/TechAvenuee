import React, { useState, useMemo } from 'react';
import {
  Package,
  Layers,
  AlertTriangle,
  AlertOctagon,
  Truck,
  DollarSign,
  Search,
  ArrowDownToLine,
  CheckCircle2,
  RefreshCw,
  X
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { useTheme } from '../../context/ThemeContext.jsx';

// Mock Data for Inventory Operations
const CATEGORY_DISTRIBUTION = [
  { name: 'Graphics Cards', count: 320, color: '#1E3A5F' },
  { name: 'Processors', count: 280, color: '#3B82F6' },
  { name: 'Storage & RAM', count: 390, color: '#60A5FA' },
  { name: 'Motherboards', count: 195, color: '#93C5FD' },
  { name: 'Peripherals', count: 160, color: '#CFC8BE' },
  { name: 'Power Supplies', count: 83, color: '#64748B' },
];

const MOVEMENT_TRENDS = [
  { date: 'Oct 24', stockIn: 45, stockOut: 38 },
  { date: 'Oct 25', stockIn: 60, stockOut: 52 },
  { date: 'Oct 26', stockIn: 30, stockOut: 48 },
  { date: 'Oct 27', stockIn: 85, stockOut: 42 },
  { date: 'Oct 28', stockIn: 55, stockOut: 64 },
  { date: 'Oct 29', stockIn: 70, stockOut: 58 },
  { date: 'Oct 30', stockIn: 40, stockOut: 35 },
];

const STOCK_STATUS_RATIO = [
  { status: 'In Stock (>20)', count: 1240, fill: '#10B981' },
  { status: 'Moderate (11-20)', count: 173, fill: '#3B82F6' },
  { status: 'Low Stock (1-10)', count: 12, fill: '#F59E0B' },
  { status: 'Out of Stock (0)', count: 3, fill: '#EF4444' },
];

const INITIAL_LOW_STOCK = [
  {
    sku: 'GPU-NV-4060-8G',
    name: 'NVIDIA RTX 4060 Dual OC 8GB',
    category: 'Graphics Cards',
    brand: 'ASUS',
    currentStock: 3,
    reorderLevel: 10,
    unitCost: 18500,
    status: 'Critical Low',
    supplier: 'TechLink Distribution',
  },
  {
    sku: 'RAM-KG-16G-5600',
    name: 'Kingston Fury Beast 16GB DDR5',
    category: 'Storage & RAM',
    brand: 'Kingston',
    currentStock: 5,
    reorderLevel: 15,
    unitCost: 2800,
    status: 'Low Stock',
    supplier: 'Macro Memory Corp',
  },
  {
    sku: 'PSU-SS-750G',
    name: 'Seasonic Focus GX-750W 80+ Gold',
    category: 'Power Supplies',
    brand: 'Seasonic',
    currentStock: 4,
    reorderLevel: 12,
    unitCost: 5200,
    status: 'Critical Low',
    supplier: 'Global Components Hub',
  },
  {
    sku: 'PER-LG-GPX2-BLK',
    name: 'Logitech G Pro X Superlight 2',
    category: 'Peripherals',
    brand: 'Logitech',
    currentStock: 6,
    reorderLevel: 15,
    unitCost: 6100,
    status: 'Low Stock',
    supplier: 'LogiTech Direct PH',
  },
];

const INITIAL_MOVEMENTS = [
  {
    ref: 'MOV-2026-1049',
    product: 'Samsung 990 Pro 2TB NVMe',
    type: 'Stock-In',
    qty: '+25',
    timestamp: '2026-10-30 09:15',
    user: 'Marcus Brody',
  },
  {
    ref: 'MOV-2026-1048',
    product: 'AMD Ryzen 7 7800X3D',
    type: 'Stock-Out',
    qty: '-6',
    timestamp: '2026-10-30 08:40',
    user: 'Maria Santos',
  },
  {
    ref: 'MOV-2026-1047',
    product: 'Corsair Vengeance 32GB DDR5',
    type: 'Stock-In',
    qty: '+40',
    timestamp: '2026-10-29 17:30',
    user: 'Marcus Brody',
  },
  {
    ref: 'MOV-2026-1046',
    product: 'NVIDIA RTX 4070 Ti Super',
    type: 'Stock-Out',
    qty: '-4',
    timestamp: '2026-10-29 16:10',
    user: 'Maria Santos',
  },
  {
    ref: 'MOV-2026-1045',
    product: 'Logitech G502 X Plus',
    type: 'Adjustment',
    qty: '-1',
    timestamp: '2026-10-29 14:00',
    user: 'Marcus Brody',
  },
];

export default function InventoryClerkDashboard() {
  const { isDarkMode } = useTheme();

  // Search & filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [restockModalItem, setRestockModalItem] = useState(null);
  const [restockQty, setRestockQty] = useState(20);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [lowStockItems, setLowStockItems] = useState(INITIAL_LOW_STOCK);
  const [movements, setMovements] = useState(INITIAL_MOVEMENTS);

  // Filter low-stock table
  const filteredLowStock = useMemo(() => {
    return lowStockItems.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.brand.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === 'All' || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [lowStockItems, searchQuery, selectedCategory]);

  // Handle Restock Confirmation
  const handleConfirmRestock = () => {
    if (!restockModalItem) return;

    const addedQty = parseInt(restockQty, 10) || 10;
    // Update local stock
    setLowStockItems((prev) =>
      prev.map((i) =>
        i.sku === restockModalItem.sku
          ? {
              ...i,
              currentStock: i.currentStock + addedQty,
              status: i.currentStock + addedQty >= i.reorderLevel ? 'In Stock' : 'Low Stock',
            }
          : i
      )
    );

    // Add movement entry
    const newMovement = {
      ref: `MOV-2026-${Math.floor(1050 + Math.random() * 900)}`,
      product: restockModalItem.name,
      type: 'Stock-In',
      qty: `+${addedQty}`,
      timestamp: 'Just now',
      user: 'Marcus Brody (Inventory Clerk)',
    };
    setMovements((prev) => [newMovement, ...prev]);

    setFeedbackMsg(`Stock updated! Restocked +${addedQty} units for ${restockModalItem.name}.`);
    setRestockModalItem(null);
    setRestockQty(20);
    setTimeout(() => setFeedbackMsg(''), 4000);
  };

  const cardBg = isDarkMode ? 'bg-[#2B3441] border-[#CFC8BE]/20' : 'bg-white border-[#E5E7EB]';

  return (
    <div className="space-y-6">
      {/* Top Banner / Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            Inventory & Warehouse Operations
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Monitor real-time stock levels, category distribution, and process incoming restocking orders.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setFeedbackMsg('Product inventory cache refreshed.');
              setTimeout(() => setFeedbackMsg(''), 3000);
            }}
            className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition ${
              isDarkMode
                ? 'bg-[#2B3441] border-[#CFC8BE]/20 hover:bg-slate-700'
                : 'bg-white border-[#E5E7EB] hover:bg-slate-50 text-[#1E3A5F]'
            }`}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh Stock</span>
          </button>
        </div>
      </div>

      {/* Confirmation / Alert Feedback */}
      {feedbackMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span className="font-semibold">{feedbackMsg}</span>
          </div>
          <button onClick={() => setFeedbackMsg('')} className="font-bold">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* ==================== 6 DASHBOARD CARDS ==================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Card 1: Total Products */}
        <div className={`p-4 rounded-2xl border shadow-xs ${cardBg}`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Products
            </span>
            <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Package className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-extrabold">1,428</span>
            <p className="text-[11px] text-emerald-500 font-semibold mt-0.5">+18 this month</p>
          </div>
        </div>

        {/* Card 2: Total Units in Stock */}
        <div className={`p-4 rounded-2xl border shadow-xs ${cardBg}`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Units
            </span>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-extrabold">14,850</span>
            <p className="text-[11px] text-slate-400 mt-0.5">Across 6 categories</p>
          </div>
        </div>

        {/* Card 3: Low-Stock Products */}
        <div className={`p-4 rounded-2xl border shadow-xs ${cardBg}`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-500">
              Low Stock
            </span>
            <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">
              12
            </span>
            <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold mt-0.5">
              Requires Reorder
            </p>
          </div>
        </div>

        {/* Card 4: Out-of-Stock Products */}
        <div className={`p-4 rounded-2xl border shadow-xs ${cardBg}`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-500">
              Out of Stock
            </span>
            <div className="h-8 w-8 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <AlertOctagon className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-extrabold text-rose-600 dark:text-rose-400">3</span>
            <p className="text-[11px] text-rose-500 font-semibold mt-0.5">Zero availability</p>
          </div>
        </div>

        {/* Card 5: Pending Restocks */}
        <div className={`p-4 rounded-2xl border shadow-xs ${cardBg}`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Pending Restocks
            </span>
            <div className="h-8 w-8 rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center">
              <Truck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-extrabold">8 Orders</span>
            <p className="text-[11px] text-slate-400 mt-0.5">In transit from vendors</p>
          </div>
        </div>

        {/* Card 6: Inventory Value */}
        <div className={`p-4 rounded-2xl border shadow-xs ${cardBg}`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Inventory Value
            </span>
            <div className="h-8 w-8 rounded-lg bg-[#CFC8BE]/20 text-[#1E3A5F] dark:text-[#CFC8BE] flex items-center justify-center">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl font-extrabold truncate block">₱4.82M</span>
            <p className="text-[11px] text-slate-400 mt-0.5">Cost: ₱3.95M</p>
          </div>
        </div>
      </div>

      {/* ==================== 3 CHARTS ==================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Stock Distribution by Category */}
        <div className={`p-5 rounded-3xl border shadow-xs ${cardBg}`}>
          <div className="pb-3 border-b border-inherit">
            <h3 className="font-bold text-sm">Stock Distribution by Category</h3>
            <p className="text-[11px] text-slate-400">Number of SKUs per hardware department</p>
          </div>
          <div className="h-60 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={CATEGORY_DISTRIBUTION}
                  dataKey="count"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                >
                  {CATEGORY_DISTRIBUTION.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val) => [`${val} SKUs`, 'Inventory Count']}
                  contentStyle={{
                    borderRadius: '0.75rem',
                    backgroundColor: isDarkMode ? '#2B3441' : '#FFFFFF',
                    border: '1px solid #CFC8BE',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[10px] pt-2 border-t border-inherit">
            {CATEGORY_DISTRIBUTION.slice(0, 4).map((c) => (
              <div key={c.name} className="flex items-center space-x-1.5 truncate">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: c.color }} />
                <span className="truncate">{c.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 2: Inventory Movement Trends (Stock In vs Stock Out) */}
        <div className={`p-5 rounded-3xl border shadow-xs ${cardBg}`}>
          <div className="pb-3 border-b border-inherit">
            <h3 className="font-bold text-sm">Weekly Movement Trends</h3>
            <p className="text-[11px] text-slate-400">Inbound restocks vs outbound POS dispatches</p>
          </div>
          <div className="h-60 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MOVEMENT_TRENDS} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="inGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="outGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#374151' : '#E5E7EB'} />
                <XAxis dataKey="date" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '0.75rem',
                    backgroundColor: isDarkMode ? '#2B3441' : '#FFFFFF',
                    border: '1px solid #CFC8BE',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Area type="monotone" dataKey="stockIn" name="Stock-In" stroke="#10B981" fill="url(#inGrad)" />
                <Area type="monotone" dataKey="stockOut" name="Stock-Out" stroke="#3B82F6" fill="url(#outGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Stock Health / Low-Stock vs In-Stock */}
        <div className={`p-5 rounded-3xl border shadow-xs ${cardBg}`}>
          <div className="pb-3 border-b border-inherit">
            <h3 className="font-bold text-sm">Stock Health Ratio</h3>
            <p className="text-[11px] text-slate-400">Inventory levels categorized by availability safety</p>
          </div>
          <div className="h-60 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={STOCK_STATUS_RATIO} layout="vertical" margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={isDarkMode ? '#374151' : '#E5E7EB'} />
                <XAxis type="number" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis dataKey="status" type="category" stroke="#94A3B8" fontSize={10} width={90} tickLine={false} />
                <Tooltip
                  formatter={(val) => [`${val} items`, 'Count']}
                  contentStyle={{
                    borderRadius: '0.75rem',
                    backgroundColor: isDarkMode ? '#2B3441' : '#FFFFFF',
                    border: '1px solid #CFC8BE',
                  }}
                />
                <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                  {STOCK_STATUS_RATIO.map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ==================== 2 TABLES (LOW-STOCK & RECENT MOVEMENTS) ==================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Table 1: Low-Stock Alerts */}
        <div className={`p-5 rounded-3xl border shadow-xs flex flex-col ${cardBg}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-inherit gap-2">
            <div>
              <h3 className="font-bold text-sm text-amber-600 dark:text-amber-400 flex items-center space-x-1.5">
                <AlertTriangle className="h-4 w-4" />
                <span>Low-Stock Alerts</span>
              </h3>
              <p className="text-[11px] text-slate-400">Items requiring immediate reordering</p>
            </div>

            {/* Table Search & Filter */}
            <div className="flex items-center space-x-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className={`py-1 px-2 rounded-lg text-xs border outline-none ${
                  isDarkMode
                    ? 'bg-[#1F2632] border-[#CFC8BE]/20 text-white'
                    : 'bg-slate-50 border-[#E5E7EB] text-[#374151]'
                }`}
              >
                <option value="All">All Categories</option>
                <option value="Graphics Cards">Graphics Cards</option>
                <option value="Storage & RAM">Storage & RAM</option>
                <option value="Power Supplies">Power Supplies</option>
                <option value="Peripherals">Peripherals</option>
              </select>
              <div className="relative">
                <Search className="h-3 w-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter alerts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`pl-8 pr-2.5 py-1 rounded-lg text-xs border outline-none ${
                    isDarkMode
                      ? 'bg-[#1F2632] border-[#CFC8BE]/20 text-white'
                      : 'bg-slate-50 border-[#E5E7EB] text-[#374151]'
                  }`}
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto flex-1 mt-2">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-inherit text-slate-400 font-semibold uppercase text-[10px]">
                  <th className="py-2.5 px-3">SKU / Product</th>
                  <th className="py-2.5 px-3 text-center">Stock</th>
                  <th className="py-2.5 px-3 text-center">Reorder Lvl</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-inherit">
                {filteredLowStock.map((item) => (
                  <tr key={item.sku} className="hover:bg-black/5 dark:hover:bg-white/5 transition">
                    <td className="py-3 px-3">
                      <p className="font-bold truncate max-w-[150px]">{item.name}</p>
                      <span className="text-[10px] text-slate-400 font-mono">{item.sku}</span>
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-rose-500">
                      {item.currentStock} pcs
                    </td>
                    <td className="py-3 px-3 text-center text-slate-400">
                      {item.reorderLevel} pcs
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/30">
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => setRestockModalItem(item)}
                        className="px-2.5 py-1 rounded-lg bg-[#1E3A5F] text-white hover:bg-blue-700 text-[11px] font-bold transition shadow-xs"
                      >
                        Restock
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Table 2: Recent Inventory Movements */}
        <div className={`p-5 rounded-3xl border shadow-xs flex flex-col ${cardBg}`}>
          <div className="pb-3 border-b border-inherit flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm">Recent Stock Movements</h3>
              <p className="text-[11px] text-slate-400">Real-time log of warehouse entries and dispatches</p>
            </div>
            <span className="text-[11px] font-semibold text-slate-400">Live Log</span>
          </div>

          <div className="overflow-x-auto flex-1 mt-2">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-inherit text-slate-400 font-semibold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Ref #</th>
                  <th className="py-2.5 px-3">Product</th>
                  <th className="py-2.5 px-3 text-center">Type</th>
                  <th className="py-2.5 px-3 text-center">Qty</th>
                  <th className="py-2.5 px-3">Time & Clerk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-inherit">
                {movements.map((m) => (
                  <tr key={m.ref} className="hover:bg-black/5 dark:hover:bg-white/5 transition">
                    <td className="py-3 px-3 font-mono font-bold text-blue-500 text-[11px]">
                      {m.ref}
                    </td>
                    <td className="py-3 px-3 font-medium truncate max-w-[140px]">{m.product}</td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          m.type === 'Stock-In'
                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                            : m.type === 'Stock-Out'
                            ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                            : 'bg-slate-500/10 text-slate-400'
                        }`}
                      >
                        {m.type}
                      </span>
                    </td>
                    <td
                      className={`py-3 px-3 text-center font-bold ${
                        m.qty.startsWith('+') ? 'text-emerald-500' : 'text-rose-500'
                      }`}
                    >
                      {m.qty}
                    </td>
                    <td className="py-3 px-3 text-slate-400 text-[11px]">
                      <p>{m.timestamp}</p>
                      <span className="text-[10px] opacity-80">{m.user}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ==================== RESTOCK CONFIRMATION DIALOG ==================== */}
      {restockModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div
            className={`w-full max-w-md rounded-3xl p-6 shadow-2xl border animate-in fade-in zoom-in-95 ${
              isDarkMode ? 'bg-[#2B3441] border-[#CFC8BE]/30 text-white' : 'bg-white border-[#E5E7EB] text-[#374151]'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-inherit">
              <div className="flex items-center space-x-2.5">
                <div className="h-9 w-9 rounded-xl bg-blue-500/10 text-[#1E3A5F] dark:text-blue-400 flex items-center justify-center">
                  <ArrowDownToLine className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm">Process Stock In</h4>
                  <p className="text-[11px] text-slate-400">Confirm inventory delivery</p>
                </div>
              </div>
              <button
                onClick={() => setRestockModalItem(null)}
                className="p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs bg-black/5 dark:bg-black/20 p-3.5 rounded-2xl border border-inherit">
              <p>
                <span className="font-bold text-slate-400">Product:</span>{' '}
                <span className="font-semibold">{restockModalItem.name}</span>
              </p>
              <p>
                <span className="font-bold text-slate-400">SKU:</span>{' '}
                <span className="font-mono">{restockModalItem.sku}</span>
              </p>
              <p>
                <span className="font-bold text-slate-400">Supplier:</span> {restockModalItem.supplier}
              </p>
              <p>
                <span className="font-bold text-slate-400">Current Stock:</span>{' '}
                <span className="text-rose-500 font-bold">{restockModalItem.currentStock} units</span>
              </p>
            </div>

            <div className="mt-4">
              <label className="block text-xs font-bold mb-1.5">Quantity Received</label>
              <input
                type="number"
                min="1"
                value={restockQty}
                onChange={(e) => setRestockQty(e.target.value)}
                className={`w-full p-2.5 rounded-xl border text-sm font-bold outline-none ${
                  isDarkMode
                    ? 'bg-[#1F2632] border-[#CFC8BE]/30 text-white'
                    : 'bg-white border-[#E5E7EB] text-[#374151]'
                }`}
              />
            </div>

            <div className="mt-6 flex items-center justify-end space-x-3">
              <button
                onClick={() => setRestockModalItem(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-inherit hover:bg-black/5"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRestock}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-[#1E3A5F] text-white hover:bg-blue-700 shadow-md transition"
              >
                Confirm Restock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
