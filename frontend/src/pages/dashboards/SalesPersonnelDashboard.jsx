import React, { useState } from 'react';
import {
  ShoppingCart,
  Receipt,
  Layers,
  DollarSign,
  TrendingUp,
  Clock,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  Printer,
  X,
  Eye,
  ShoppingBag
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';
import { useTheme } from '../../context/ThemeContext.jsx';

const HOURLY_SALES = [
  { hour: '09:00', sales: 4200, count: 3 },
  { hour: '11:00', sales: 9800, count: 6 },
  { hour: '13:00', sales: 14500, count: 9 },
  { hour: '15:00', sales: 12200, count: 7 },
  { hour: '17:00', sales: 17750, count: 9 },
];

const DAILY_CATEGORY_SALES = [
  { name: 'Graphics Cards', value: 24500, color: '#1E3A5F' },
  { name: 'Storage & RAM', value: 14200, color: '#3B82F6' },
  { name: 'Processors', value: 12100, color: '#60A5FA' },
  { name: 'Peripherals', value: 7650, color: '#CFC8BE' },
];

const INITIAL_TRANSACTIONS = [
  {
    invoice: 'INV-2026-8801',
    timestamp: '2026-10-30 16:45',
    items: ['RTX 4060 Dual OC 8GB (x1)', 'Kingston 16GB DDR5 (x2)'],
    itemsCount: 3,
    total: 28900,
    method: 'GCash',
    status: 'Completed',
    cashier: 'Maria Santos',
  },
  {
    invoice: 'INV-2026-8800',
    timestamp: '2026-10-30 15:20',
    items: ['Samsung 990 Pro 2TB (x1)'],
    itemsCount: 1,
    total: 8900,
    method: 'Credit Card',
    status: 'Completed',
    cashier: 'Maria Santos',
  },
  {
    invoice: 'INV-2026-8799',
    timestamp: '2026-10-30 14:10',
    items: ['Logitech G Pro X Superlight 2 (x1)', 'G502 Mousepad (x1)'],
    itemsCount: 2,
    total: 9499,
    method: 'Cash',
    status: 'Completed',
    cashier: 'Maria Santos',
  },
  {
    invoice: 'INV-2026-8798',
    timestamp: '2026-10-30 11:35',
    items: ['AMD Ryzen 7 7800X3D (x1)'],
    itemsCount: 1,
    total: 24500,
    method: 'GCash',
    status: 'Completed',
    cashier: 'Juan Dela Cruz',
  },
];

const BEST_SELLING_TODAY = [
  {
    name: 'Samsung 990 Pro 2TB NVMe',
    sku: 'SSD-SM-990P-2T',
    unitsSold: 6,
    revenue: 53400,
  },
  {
    name: 'Kingston Fury Beast 16GB DDR5',
    sku: 'RAM-KG-16G-5600',
    unitsSold: 12,
    revenue: 41400,
  },
  {
    name: 'Logitech G Pro X Superlight 2',
    sku: 'PER-LG-GPX2-BLK',
    unitsSold: 5,
    revenue: 39950,
  },
  {
    name: 'NVIDIA RTX 4070 Ti Super',
    sku: 'GPU-NV-4070TIS',
    unitsSold: 2,
    revenue: 84000,
  },
];

// POS Catalog for Live Checkout simulation
const POS_CATALOG = [
  { id: 1, name: 'Samsung 990 Pro 2TB NVMe', sku: 'SSD-SM-990P-2T', price: 8900, stock: 18, category: 'Storage' },
  { id: 2, name: 'Kingston Fury Beast 16GB DDR5', sku: 'RAM-KG-16G-5600', price: 3450, stock: 24, category: 'RAM' },
  { id: 3, name: 'Logitech G Pro X Superlight 2', sku: 'PER-LG-GPX2-BLK', price: 7990, stock: 6, category: 'Peripherals' },
  { id: 4, name: 'NVIDIA RTX 4060 Dual OC 8GB', sku: 'GPU-NV-4060-8G', price: 22000, stock: 3, category: 'GPU' },
  { id: 5, name: 'AMD Ryzen 7 7800X3D Processor', sku: 'CPU-AMD-7800X3D', price: 24500, stock: 8, category: 'CPU' },
];

export default function SalesPersonnelDashboard() {
  const { isDarkMode } = useTheme();

  // POS State
  const [showPosModal, setShowPosModal] = useState(false);
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [transactions, setTransactions] = useState(INITIAL_TRANSACTIONS);
  const [checkoutSuccessMsg, setCheckoutSuccessMsg] = useState('');

  // Cart operations
  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const updateCartQty = (id, delta) => {
    setCart((prev) =>
      prev
        .map((item) => (item.id === id ? { ...item, qty: item.qty + delta } : item))
        .filter((item) => item.qty > 0)
    );
  };

  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  // Subtotal & VAT
  const cartSubtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const vatAmount = Math.round(cartSubtotal * 0.12);
  const grandTotal = cartSubtotal + vatAmount;

  // Complete Checkout
  const handleCheckout = () => {
    if (cart.length === 0) return;

    const newInvoice = {
      invoice: `INV-2026-${Math.floor(8810 + Math.random() * 500)}`,
      timestamp: '2026-10-30 ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      items: cart.map((i) => `${i.name} (x${i.qty})`),
      itemsCount: cart.reduce((acc, curr) => acc + curr.qty, 0),
      total: grandTotal,
      method: paymentMethod,
      status: 'Completed',
      cashier: 'Maria Santos',
    };

    setTransactions((prev) => [newInvoice, ...prev]);
    setSelectedReceipt(newInvoice);
    setCart([]);
    setShowPosModal(false);
    setCheckoutSuccessMsg(`Transaction successful! ${newInvoice.invoice} generated.`);
    setTimeout(() => setCheckoutSuccessMsg(''), 4000);
  };

  const cardBg = isDarkMode ? 'bg-[#2B3441] border-[#CFC8BE]/20' : 'bg-white border-[#E5E7EB]';

  return (
    <div className="space-y-6">
      {/* Top Controls & Shift Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Point of Sale & Register</h2>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              Shift #04 Active
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Cashier: <span className="font-semibold text-slate-700 dark:text-slate-200">Maria Santos</span> | Terminal POS-01 (08:00 - 17:00)
          </p>
        </div>

        {/* Action Button: Launch New Sale Checkout */}
        <button
          onClick={() => setShowPosModal(true)}
          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-2xl bg-[#1E3A5F] text-white hover:bg-blue-700 font-bold text-xs sm:text-sm shadow-md transition"
        >
          <ShoppingBag className="h-4 w-4" />
          <span>New Sale / POS Checkout</span>
        </button>
      </div>

      {checkoutSuccessMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span className="font-semibold">{checkoutSuccessMsg}</span>
          </div>
          <button onClick={() => setCheckoutSuccessMsg('')} className="font-bold">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* ==================== 6 DASHBOARD CARDS ==================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Card 1: Sales Today */}
        <div className={`p-4 rounded-2xl border shadow-xs ${cardBg}`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Sales Today
            </span>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-extrabold">₱58,450</span>
            <p className="text-[11px] text-emerald-500 font-semibold mt-0.5">+12.4% vs yesterday</p>
          </div>
        </div>

        {/* Card 2: Transactions Today */}
        <div className={`p-4 rounded-2xl border shadow-xs ${cardBg}`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Transactions
            </span>
            <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Receipt className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-extrabold">34</span>
            <p className="text-[11px] text-slate-400 mt-0.5">Average ₱1,719 / bill</p>
          </div>
        </div>

        {/* Card 3: Average Transaction Value */}
        <div className={`p-4 rounded-2xl border shadow-xs ${cardBg}`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Avg Basket
            </span>
            <div className="h-8 w-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-extrabold">₱1,719</span>
            <p className="text-[11px] text-slate-400 mt-0.5">2.5 items per receipt</p>
          </div>
        </div>

        {/* Card 4: Items Sold Today */}
        <div className={`p-4 rounded-2xl border shadow-xs ${cardBg}`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Items Sold
            </span>
            <div className="h-8 w-8 rounded-lg bg-cyan-500/10 text-cyan-500 flex items-center justify-center">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-extrabold">86</span>
            <p className="text-[11px] text-slate-400 mt-0.5">Hardware & peripherals</p>
          </div>
        </div>

        {/* Card 5: Current Shift Sales */}
        <div className={`p-4 rounded-2xl border shadow-xs ${cardBg}`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-500">
              Shift Sales
            </span>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
              ₱32,800
            </span>
            <p className="text-[11px] text-slate-400 mt-0.5">18 transactions in shift</p>
          </div>
        </div>

        {/* Card 6: Recent Transactions Count */}
        <div className={`p-4 rounded-2xl border shadow-xs ${cardBg}`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Recent Log
            </span>
            <div className="h-8 w-8 rounded-lg bg-[#CFC8BE]/20 text-[#1E3A5F] dark:text-[#CFC8BE] flex items-center justify-center">
              <ShoppingCart className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-extrabold">{transactions.length}</span>
            <p className="text-[11px] text-emerald-500 font-semibold mt-0.5">100% verified</p>
          </div>
        </div>
      </div>

      {/* ==================== 3 CHARTS ==================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Hourly Sales Trend */}
        <div className={`p-5 rounded-3xl border shadow-xs lg:col-span-2 ${cardBg}`}>
          <div className="pb-3 border-b border-inherit flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm">Hourly Sales Trend (Today)</h3>
              <p className="text-[11px] text-slate-400">Peak checkout activity throughout the day</p>
            </div>
            <span className="text-xs font-bold text-emerald-500">Peak: 17:00 (₱17.7k)</span>
          </div>
          <div className="h-60 mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={HOURLY_SALES} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesHrGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1E3A5F" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#1E3A5F" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#374151' : '#E5E7EB'} />
                <XAxis dataKey="hour" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#94A3B8"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => `₱${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(val) => [`₱${Number(val).toLocaleString()}`, 'Sales (₱)']}
                  contentStyle={{
                    borderRadius: '0.75rem',
                    backgroundColor: isDarkMode ? '#2B3441' : '#FFFFFF',
                    border: '1px solid #CFC8BE',
                  }}
                />
                <Area type="monotone" dataKey="sales" stroke="#1E3A5F" strokeWidth={3} fill="url(#salesHrGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Category Breakdown */}
        <div className={`p-5 rounded-3xl border shadow-xs ${cardBg}`}>
          <div className="pb-3 border-b border-inherit">
            <h3 className="font-bold text-sm">Today's Category Revenue</h3>
            <p className="text-[11px] text-slate-400">Share of receipts by product type</p>
          </div>
          <div className="h-60 mt-2 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={DAILY_CATEGORY_SALES}
                  dataKey="value"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                >
                  {DAILY_CATEGORY_SALES.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val) => [`₱${Number(val).toLocaleString()}`, 'Category Sales']}
                  contentStyle={{
                    borderRadius: '0.75rem',
                    backgroundColor: isDarkMode ? '#2B3441' : '#FFFFFF',
                    border: '1px solid #CFC8BE',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ==================== 2 TABLES (RECENT TRANSACTIONS & BEST SELLERS) ==================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Table 1: Recent Transactions */}
        <div className={`p-5 rounded-3xl border shadow-xs flex flex-col ${cardBg}`}>
          <div className="pb-3 border-b border-inherit flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm">Recent POS Transactions</h3>
              <p className="text-[11px] text-slate-400">Sales invoices processed on this terminal</p>
            </div>
            <span className="text-[11px] font-bold text-blue-500">Terminal #01</span>
          </div>

          <div className="overflow-x-auto flex-1 mt-2">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-inherit text-slate-400 font-semibold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Invoice #</th>
                  <th className="py-2.5 px-3">Items</th>
                  <th className="py-2.5 px-3">Method</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                  <th className="py-2.5 px-3 text-center">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-inherit">
                {transactions.map((tx) => (
                  <tr key={tx.invoice} className="hover:bg-black/5 dark:hover:bg-white/5 transition">
                    <td className="py-3 px-3">
                      <p className="font-bold font-mono text-blue-500">{tx.invoice}</p>
                      <span className="text-[10px] text-slate-400">{tx.timestamp}</span>
                    </td>
                    <td className="py-3 px-3">
                      <p className="truncate max-w-[150px] font-medium">{tx.items[0]}</p>
                      {tx.itemsCount > 1 && (
                        <span className="text-[10px] text-slate-400">+{tx.itemsCount - 1} more items</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-500/10 text-slate-700 dark:text-slate-300">
                        {tx.method}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-extrabold text-slate-900 dark:text-white">
                      ₱{tx.total.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => setSelectedReceipt(tx)}
                        className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 transition"
                        title="View Official Receipt"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Table 2: Best-Selling Items Today */}
        <div className={`p-5 rounded-3xl border shadow-xs flex flex-col ${cardBg}`}>
          <div className="pb-3 border-b border-inherit flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm">Best-Selling Items Today</h3>
              <p className="text-[11px] text-slate-400">High turnover products ranked by volume</p>
            </div>
          </div>

          <div className="overflow-x-auto flex-1 mt-2">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-inherit text-slate-400 font-semibold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Product / SKU</th>
                  <th className="py-2.5 px-3 text-center">Units Sold</th>
                  <th className="py-2.5 px-3 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-inherit">
                {BEST_SELLING_TODAY.map((item) => (
                  <tr key={item.sku} className="hover:bg-black/5 dark:hover:bg-white/5 transition">
                    <td className="py-3 px-3">
                      <p className="font-bold truncate max-w-[170px]">{item.name}</p>
                      <span className="text-[10px] text-slate-400 font-mono">{item.sku}</span>
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-emerald-500">
                      {item.unitsSold} pcs
                    </td>
                    <td className="py-3 px-3 text-right font-extrabold">
                      ₱{item.revenue.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ==================== POINT OF SALE MODAL / CHECKOUT ==================== */}
      {showPosModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div
            className={`w-full max-w-3xl rounded-3xl p-6 shadow-2xl border flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 ${
              isDarkMode ? 'bg-[#2B3441] border-[#CFC8BE]/30 text-white' : 'bg-white border-[#E5E7EB] text-[#374151]'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-inherit">
              <div className="flex items-center space-x-2.5">
                <div className="h-9 w-9 rounded-xl bg-blue-500/10 text-[#1E3A5F] dark:text-blue-400 flex items-center justify-center">
                  <ShoppingCart className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm sm:text-base">Point of Sale (POS) New Sale</h4>
                  <p className="text-[11px] text-slate-400">Select hardware products and process payment</p>
                </div>
              </div>
              <button onClick={() => setShowPosModal(false)} className="p-1 rounded-lg hover:bg-black/10">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4 flex-1 overflow-y-auto">
              {/* Left Column: Product Catalog */}
              <div className="space-y-2 pr-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Product Catalog
                </span>
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {POS_CATALOG.map((p) => (
                    <div
                      key={p.id}
                      className={`p-3 rounded-2xl border flex items-center justify-between transition ${
                        isDarkMode ? 'bg-[#1F2632] border-[#CFC8BE]/20' : 'bg-slate-50 border-[#E5E7EB]'
                      }`}
                    >
                      <div>
                        <p className="font-bold text-xs truncate max-w-[180px]">{p.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {p.sku} | In Stock: <span className="text-emerald-500 font-bold">{p.stock}</span>
                        </p>
                        <p className="text-xs font-bold text-[#1E3A5F] dark:text-blue-400 mt-0.5">
                          ₱{p.price.toLocaleString()}
                        </p>
                      </div>
                      <button
                        onClick={() => addToCart(p)}
                        className="px-2.5 py-1.5 rounded-xl bg-[#1E3A5F] text-white hover:bg-blue-700 text-xs font-bold transition flex items-center space-x-1"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Add</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Shopping Cart & Totals */}
              <div
                className={`p-4 rounded-2xl border flex flex-col justify-between ${
                  isDarkMode ? 'bg-[#1F2632] border-[#CFC8BE]/20' : 'bg-slate-50 border-[#E5E7EB]'
                }`}
              >
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                    Current Cart ({cart.length} items)
                  </span>

                  {cart.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 text-xs">
                      <ShoppingBag className="h-8 w-8 mx-auto opacity-30 mb-2" />
                      <p>Your shopping cart is currently empty.</p>
                      <p className="text-[10px]">Add items from the catalog.</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {cart.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between text-xs pb-2 border-b border-inherit"
                        >
                          <div className="truncate max-w-[130px]">
                            <p className="font-bold truncate">{item.name}</p>
                            <span className="text-[10px] text-slate-400">₱{item.price.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => updateCartQty(item.id, -1)}
                              className="p-1 rounded bg-black/10 dark:bg-white/10"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="font-bold w-4 text-center">{item.qty}</span>
                            <button
                              onClick={() => updateCartQty(item.id, 1)}
                              className="p-1 rounded bg-black/10 dark:bg-white/10"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="p-1 text-rose-500 hover:text-rose-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Calculation Summary & Payment */}
                <div className="mt-4 pt-3 border-t border-inherit space-y-2 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Subtotal:</span>
                    <span>₱{cartSubtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>12% VAT:</span>
                    <span>₱{vatAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-extrabold text-sm border-t border-inherit pt-1.5">
                    <span>Total Due:</span>
                    <span className="text-emerald-500">₱{grandTotal.toLocaleString()}</span>
                  </div>

                  {/* Payment Method Pills */}
                  <div className="pt-2">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                      Payment Mode
                    </span>
                    <div className="grid grid-cols-3 gap-1.5">
                      {['Cash', 'Credit Card', 'GCash'].map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setPaymentMethod(mode)}
                          className={`py-1.5 px-2 rounded-xl text-xs font-bold transition text-center ${
                            paymentMethod === mode
                              ? 'bg-[#1E3A5F] text-white shadow-xs'
                              : 'bg-black/5 dark:bg-white/5 border border-inherit hover:bg-black/10'
                          }`}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    disabled={cart.length === 0}
                    onClick={handleCheckout}
                    className="w-full mt-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold text-xs uppercase tracking-wider transition shadow-md"
                  >
                    Confirm & Complete Checkout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== OFFICIAL RECEIPT MODAL ==================== */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl bg-white text-slate-900 p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 font-mono text-xs">
            {/* Receipt Header */}
            <div className="text-center pb-3 border-b border-dashed border-slate-300">
              <h3 className="font-bold text-base tracking-wider font-sans text-[#1E3A5F]">TECH AVENUE</h3>
              <p className="text-[10px] text-slate-500">Computer & Accessories Store</p>
              <p className="text-[10px] text-slate-400 mt-1">Official Sales Receipt</p>
            </div>

            {/* Receipt Info */}
            <div className="my-3 space-y-1 text-[11px] text-slate-600">
              <div className="flex justify-between">
                <span>Invoice:</span>
                <span className="font-bold">{selectedReceipt.invoice}</span>
              </div>
              <div className="flex justify-between">
                <span>Date & Time:</span>
                <span>{selectedReceipt.timestamp}</span>
              </div>
              <div className="flex justify-between">
                <span>Cashier:</span>
                <span>{selectedReceipt.cashier}</span>
              </div>
              <div className="flex justify-between">
                <span>Payment:</span>
                <span className="font-bold text-blue-600">{selectedReceipt.method}</span>
              </div>
            </div>

            {/* Item list */}
            <div className="border-t border-b border-dashed border-slate-300 py-3 my-2 space-y-1.5">
              {selectedReceipt.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-[11px]">
                  <span className="truncate max-w-[200px]">{item}</span>
                  <span className="font-semibold">₱{(selectedReceipt.total / selectedReceipt.itemsCount).toFixed(0)}</span>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="pt-2 text-right">
              <span className="text-[10px] text-slate-500 uppercase block">Grand Total Paid</span>
              <span className="text-xl font-extrabold text-[#1E3A5F]">₱{selectedReceipt.total.toLocaleString()}</span>
            </div>

            {/* Footer buttons */}
            <div className="mt-5 flex items-center justify-between font-sans">
              <button
                onClick={() => setSelectedReceipt(null)}
                className="px-4 py-1.5 rounded-xl border border-slate-300 text-xs font-bold hover:bg-slate-50"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-1.5 rounded-xl bg-[#1E3A5F] text-white text-xs font-bold hover:bg-blue-800 flex items-center space-x-1.5"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Print Receipt</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
