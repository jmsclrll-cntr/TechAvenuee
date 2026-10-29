import React, { useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  Package,
  Layers,
  AlertTriangle,
  Receipt,
  Users,
  BrainCircuit,
  ArrowUpRight,
  Play
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
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { useTheme } from '../../context/ThemeContext.jsx';

const SALES_TREND = [
  { day: 'Oct 24', sales: 48500, orders: 31 },
  { day: 'Oct 25', sales: 51200, orders: 35 },
  { day: 'Oct 26', sales: 63400, orders: 42 },
  { day: 'Oct 27', sales: 58900, orders: 39 },
  { day: 'Oct 28', sales: 72100, orders: 48 },
  { day: 'Oct 29', sales: 58450, orders: 34 },
  { day: 'Oct 30', sales: 64200, orders: 38 },
];

const INVENTORY_STATUS = [
  { name: 'Healthy Stock', value: 1240, color: '#10B981' },
  { name: 'Moderate Stock', value: 173, color: '#3B82F6' },
  { name: 'Low Stock Alert', value: 12, color: '#F59E0B' },
  { name: 'Out of Stock', value: 3, color: '#EF4444' },
];

const TOP_SELLING = [
  { name: 'RTX 4070 Ti Super 16GB', units: 168, revenue: 672000 },
  { name: 'AMD Ryzen 7 7800X3D', units: 142, revenue: 383400 },
  { name: 'Samsung 990 Pro 2TB NVMe', units: 129, revenue: 167700 },
  { name: 'Corsair Vengeance 32GB DDR5', units: 115, revenue: 97750 },
  { name: 'ASUS ROG Strix B650-A', units: 94, revenue: 159800 },
];

const PREDICTED_DEMAND_DATA = [
  { period: 'Wk 1', historical: 120, predicted: 120 },
  { period: 'Wk 2', historical: 135, predicted: 132 },
  { period: 'Wk 3', historical: 142, predicted: 145 },
  { period: 'Wk 4', historical: 158, predicted: 160 },
  { period: 'Wk 5 (Forecast)', historical: null, predicted: 184 },
  { period: 'Wk 6 (Forecast)', historical: null, predicted: 198 },
];

const RECENT_TRANSACTIONS = [
  { id: 'TXN-80941', customer: 'Walk-in (Gaming PC)', amount: 84500, method: 'GCash', status: 'Completed', time: '20 mins ago' },
  { id: 'TXN-80940', customer: 'Apex Solutions Inc.', amount: 142000, method: 'Bank Transfer', status: 'Completed', time: '1 hr ago' },
  { id: 'TXN-80939', customer: 'Kenneth Reyes', amount: 18400, method: 'Credit Card', status: 'Completed', time: '2 hrs ago' },
  { id: 'TXN-80938', customer: 'DevCraft Studios', amount: 215600, method: 'Cash', status: 'Completed', time: '3 hrs ago' },
];

const USER_ACTIVITY = [
  { user: 'Maria Santos', role: 'Sales Personnel', action: 'Completed transaction #INV-2026-8801 (₱28,900)', time: '10 mins ago' },
  { user: 'Marcus Brody', role: 'Inventory Clerk', action: 'Restocked +25 units of Samsung 990 Pro 2TB', time: '45 mins ago' },
  { user: 'Eleanor Vance', role: 'Admin', action: 'Executed Random Forest demand forecast for Q4', time: '2 hrs ago' },
  { user: 'Gabriel Reyes', role: 'Instructor', action: 'Evaluated SLR vs RF model metrics on 1,250 records', time: '4 hrs ago' },
];

export default function AdminDashboard() {
  const { isDarkMode } = useTheme();

  // Admin Prediction Form State
  const [selectedTask, setSelectedTask] = useState('demand');
  const [selectedModel, setSelectedModel] = useState('rf');
  const [predictionTarget, setPredictionTarget] = useState('NVIDIA RTX 4070 Ti Super 16GB');
  const [predictionOutput, setPredictionOutput] = useState({
    taskTitle: 'Product Demand Prediction',
    datasetUsed: 'product_demand.csv (1,200 records)',
    product: 'NVIDIA RTX 4070 Ti Super 16GB',
    model: 'Random Forest Regression',
    forecast: '+18.5% demand surge (198 units expected)',
    recommendation: 'Restock minimum 50 units before Nov 10 to prevent stockout during holiday promotions.',
    confidence: 'High (Business Decision Support)',
  });
  const [isPredicting, setIsPredicting] = useState(false);

  const handleRunPrediction = (e) => {
    e.preventDefault();
    setIsPredicting(true);
    setTimeout(() => {
      setIsPredicting(false);

      let taskTitle = 'Product Demand Prediction';
      let datasetUsed = 'product_demand.csv (1,200 records)';
      let forecast = '+22.4% projected demand (215 units) for next 30 days';
      let recommendation = `Increase purchase order allocations for ${predictionTarget} before next inventory cycle.`;

      if (selectedTask === 'sales') {
        taskTitle = 'Sales Revenue Prediction';
        datasetUsed = 'sales_prediction.csv (1,050 records)';
        forecast = '₱1,450,000 projected monthly revenue (+16.4% MoM)';
        recommendation = 'Store foot traffic conversion remains robust; expand promotional inventory.';
      } else if (selectedTask === 'slow') {
        taskTitle = 'Slow-Moving Products Analysis';
        datasetUsed = 'product_performance.csv (1,100 records)';
        forecast = 'Turnover rate: 0.12 units/week (Turnover cycle: 94 days)';
        recommendation = `Apply 15% clearance discount or bundle with fast-moving peripherals to liquidate slow-moving buffer.`;
      } else if (selectedTask === 'best') {
        taskTitle = 'Best-Selling Products Forecast';
        datasetUsed = 'product_performance.csv (1,100 records)';
        forecast = 'Projected top seller ranking with 185 units anticipated next month';
        recommendation = 'Maintain priority buffer of 40 safety stock units at warehouse.';
      }

      setPredictionOutput({
        taskTitle,
        datasetUsed,
        product: predictionTarget,
        model: selectedModel === 'rf' ? 'Random Forest Regression' : 'Simple Linear Regression',
        forecast,
        recommendation,
        confidence: 'High (Decision Verified)',
      });
    }, 600);
  };

  const cardBg = isDarkMode ? 'bg-[#2B3441] border-[#CFC8BE]/20' : 'bg-white border-[#E5E7EB]';

  return (
    <div className="space-y-6">
      {/* Title & Quick Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Executive Business Dashboard</h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Store operations overview, revenue velocity, user activity, and machine learning decision support.
          </p>
        </div>

        <div className="inline-flex items-center space-x-2 text-xs font-semibold">
          <span className="px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 flex items-center space-x-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Store Operations Live</span>
          </span>
        </div>
      </div>

      {/* ==================== 8 DASHBOARD CARDS ==================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Daily Sales */}
        <div className={`p-5 rounded-3xl border shadow-xs ${cardBg}`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Daily Sales
            </span>
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold">₱58,450</span>
            <div className="flex items-center space-x-1 text-xs text-emerald-500 font-semibold mt-1">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>34 orders completed</span>
            </div>
          </div>
        </div>

        {/* Card 2: Monthly Revenue */}
        <div className={`p-5 rounded-3xl border shadow-xs ${cardBg}`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Monthly Revenue
            </span>
            <div className="h-9 w-9 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold">₱1,245,800</span>
            <div className="flex items-center space-x-1 text-xs text-emerald-500 font-semibold mt-1">
              <ArrowUpRight className="h-3.5 w-3.5" />
              <span>+14.2% vs target (₱1.1M)</span>
            </div>
          </div>
        </div>

        {/* Card 3: Total Products */}
        <div className={`p-5 rounded-3xl border shadow-xs ${cardBg}`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Products
            </span>
            <div className="h-9 w-9 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
              <Package className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold">1,428</span>
            <p className="text-xs text-slate-400 mt-1">Active inventory SKUs</p>
          </div>
        </div>

        {/* Card 4: Total Inventory Value */}
        <div className={`p-5 rounded-3xl border shadow-xs ${cardBg}`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Inventory Value
            </span>
            <div className="h-9 w-9 rounded-xl bg-[#CFC8BE]/20 text-[#1E3A5F] dark:text-[#CFC8BE] flex items-center justify-center">
              <Layers className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold">₱4,820,500</span>
            <p className="text-xs text-slate-400 mt-1">Cost valuation: ₱3.95M</p>
          </div>
        </div>

        {/* Card 5: Low-Stock Products */}
        <div className={`p-5 rounded-3xl border shadow-xs ${cardBg}`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-500">
              Low-Stock Items
            </span>
            <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">12</span>
            <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold mt-1">
              4 critical items flagged
            </p>
          </div>
        </div>

        {/* Card 6: Transactions Today */}
        <div className={`p-5 rounded-3xl border shadow-xs ${cardBg}`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Transactions Today
            </span>
            <div className="h-9 w-9 rounded-xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center">
              <Receipt className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold">34</span>
            <p className="text-xs text-emerald-500 font-semibold mt-1">100% verified POS receipts</p>
          </div>
        </div>

        {/* Card 7: Active Employees */}
        <div className={`p-5 rounded-3xl border shadow-xs ${cardBg}`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Active Employees
            </span>
            <div className="h-9 w-9 rounded-xl bg-violet-500/10 text-violet-500 flex items-center justify-center">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold">16 Active</span>
            <p className="text-xs text-slate-400 mt-1">Across 3 daily shifts</p>
          </div>
        </div>

        {/* Card 8: Predicted Sales Growth */}
        <div className={`p-5 rounded-3xl border shadow-xs ${cardBg}`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-500">
              Predicted Growth
            </span>
            <div className="h-9 w-9 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <BrainCircuit className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">+14.2%</span>
            <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold mt-1">
              Random Forest Forecast
            </p>
          </div>
        </div>
      </div>

      {/* ==================== CHARTS ROW ==================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Daily Sales Trend */}
        <div className={`p-5 rounded-3xl border shadow-xs lg:col-span-2 ${cardBg}`}>
          <div className="pb-3 border-b border-inherit flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm">Daily Revenue & Order Volume</h3>
              <p className="text-[11px] text-slate-400">Gross sales revenue across the current operating week</p>
            </div>
            <span className="text-xs font-bold text-emerald-500">Avg ₱59.5k/day</span>
          </div>
          <div className="h-64 mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={SALES_TREND} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="adminSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1E3A5F" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#1E3A5F" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#374151' : '#E5E7EB'} />
                <XAxis dataKey="day" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#94A3B8"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(v) => [`₱${Number(v).toLocaleString()}`, 'Sales']}
                  contentStyle={{
                    borderRadius: '0.75rem',
                    backgroundColor: isDarkMode ? '#2B3441' : '#FFFFFF',
                    border: '1px solid #CFC8BE',
                  }}
                />
                <Area type="monotone" dataKey="sales" stroke="#1E3A5F" strokeWidth={3} fill="url(#adminSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Inventory Status Distribution */}
        <div className={`p-5 rounded-3xl border shadow-xs ${cardBg}`}>
          <div className="pb-3 border-b border-inherit">
            <h3 className="font-bold text-sm">Inventory Stock Safety</h3>
            <p className="text-[11px] text-slate-400">Current stock availability across warehouse</p>
          </div>
          <div className="h-64 mt-2 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={INVENTORY_STATUS}
                  dataKey="value"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                >
                  {INVENTORY_STATUS.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val) => [`${val} SKUs`, 'Count']}
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

      {/* Charts Row 2: Top Selling & Predicted Demand Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 3: Top Selling Hardware */}
        <div className={`p-5 rounded-3xl border shadow-xs ${cardBg}`}>
          <div className="pb-3 border-b border-inherit">
            <h3 className="font-bold text-sm">Top 5 Best-Selling Hardware</h3>
            <p className="text-[11px] text-slate-400">Ranked by volume and gross store contribution</p>
          </div>
          <div className="h-60 mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={TOP_SELLING} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={isDarkMode ? '#374151' : '#E5E7EB'} />
                <XAxis type="number" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis
                  dataKey="name"
                  type="category"
                  stroke="#94A3B8"
                  fontSize={10}
                  width={110}
                  tickLine={false}
                  tickFormatter={(n) => (n.length > 14 ? `${n.slice(0, 12)}...` : n)}
                />
                <Tooltip
                  formatter={(v) => [`${v} units sold`, 'Volume']}
                  contentStyle={{
                    borderRadius: '0.75rem',
                    backgroundColor: isDarkMode ? '#2B3441' : '#FFFFFF',
                    border: '1px solid #CFC8BE',
                  }}
                />
                <Bar dataKey="units" fill="#3B82F6" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Predicted Demand Trends */}
        <div className={`p-5 rounded-3xl border shadow-xs ${cardBg}`}>
          <div className="pb-3 border-b border-inherit flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm">Predicted Demand Trends (AI Forecast)</h3>
              <p className="text-[11px] text-slate-400">Historical velocity vs 2-week forecast trajectory</p>
            </div>
            <span className="text-[10px] font-bold bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded">
              Random Forest
            </span>
          </div>
          <div className="h-60 mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={PREDICTED_DEMAND_DATA} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#374151' : '#E5E7EB'} />
                <XAxis dataKey="period" stroke="#94A3B8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '0.75rem',
                    backgroundColor: isDarkMode ? '#2B3441' : '#FFFFFF',
                    border: '1px solid #CFC8BE',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Line
                  type="monotone"
                  dataKey="historical"
                  name="Historical Sales"
                  stroke="#64748B"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="predicted"
                  name="Predicted Demand"
                  stroke="#3B82F6"
                  strokeWidth={3}
                  strokeDasharray="4 4"
                  dot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ==================== SECTION 4 & 5: ADMIN PREDICTION WORKSPACE (INPUTS & OUTPUTS ONLY) ==================== */}
      <div
        className={`p-6 rounded-3xl border shadow-sm ${
          isDarkMode ? 'bg-[#2B3441] border-[#CFC8BE]/30' : 'bg-gradient-to-br from-white via-slate-50 to-blue-50/20 border-[#E5E7EB]'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-inherit gap-2">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-2xl bg-[#1E3A5F] text-white flex items-center justify-center shadow-md">
              <BrainCircuit className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-base">Knowledge Analysis & Prediction (Admin View)</h3>
              <p className="text-xs text-slate-400">
                Generate operational predictions for product demand and sales without technical model internals.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
            Business Decision Support Only
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-5">
          {/* Form Inputs for Admin */}
          <form onSubmit={handleRunPrediction} className="space-y-4 lg:col-span-1">
            <div>
              <label className="block text-xs font-bold mb-1.5">Prediction Task</label>
              <select
                value={selectedTask}
                onChange={(e) => setSelectedTask(e.target.value)}
                className={`w-full p-2.5 rounded-xl border text-xs font-semibold outline-none ${
                  isDarkMode ? 'bg-[#1F2632] border-[#CFC8BE]/20 text-white' : 'bg-white border-[#E5E7EB]'
                }`}
              >
                <option value="demand">Product Demand Prediction</option>
                <option value="sales">Sales Revenue Prediction</option>
                <option value="slow">Slow-Moving Products Analysis</option>
                <option value="best">Best-Selling Products Forecast</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1.5">Target Product</label>
              <input
                type="text"
                value={predictionTarget}
                onChange={(e) => setPredictionTarget(e.target.value)}
                className={`w-full p-2.5 rounded-xl border text-xs font-semibold outline-none ${
                  isDarkMode ? 'bg-[#1F2632] border-[#CFC8BE]/20 text-white' : 'bg-white border-[#E5E7EB]'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1.5">Model Selection</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedModel('rf')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                    selectedModel === 'rf'
                      ? 'bg-[#1E3A5F] text-white border-[#1E3A5F]'
                      : 'border-inherit hover:bg-black/5'
                  }`}
                >
                  Random Forest
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedModel('slr')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                    selectedModel === 'slr'
                      ? 'bg-[#1E3A5F] text-white border-[#1E3A5F]'
                      : 'border-inherit hover:bg-black/5'
                  }`}
                >
                  Linear Regression
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isPredicting}
              className="w-full py-3 rounded-xl bg-[#1E3A5F] hover:bg-blue-800 text-white font-bold text-xs uppercase tracking-wider shadow-md transition flex items-center justify-center space-x-2"
            >
              <Play className="h-3.5 w-3.5" />
              <span>{isPredicting ? 'Computing Forecast...' : 'Generate Prediction'}</span>
            </button>
          </form>

          {/* Prediction Output & Recommendations */}
          <div
            className={`p-5 rounded-2xl border flex flex-col justify-between lg:col-span-2 ${
              isDarkMode ? 'bg-[#1F2632] border-[#CFC8BE]/20' : 'bg-white border-[#E5E7EB]'
            }`}
          >
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-inherit">
                <span className="text-xs font-bold text-slate-400">
                  {predictionOutput.taskTitle || 'Generated Forecast Output'}
                </span>
                <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded">
                  {predictionOutput.confidence}
                </span>
              </div>

              <div className="mt-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
                    {predictionOutput.product}
                  </h4>
                  <span className="text-[10px] font-mono text-slate-400">
                    Source: {predictionOutput.datasetUsed}
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono mt-0.5">Model: {predictionOutput.model}</p>

                <div className="mt-3 p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-300">
                  <span className="text-xs font-bold uppercase tracking-wider block">Forecasted Value:</span>
                  <span className="text-base font-extrabold">{predictionOutput.forecast}</span>
                </div>

                <div className="mt-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs">
                  <span className="font-bold block mb-1">Business Recommendation:</span>
                  <p>{predictionOutput.recommendation}</p>
                </div>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 italic mt-4 pt-2 border-t border-inherit">
              *Technical loss metrics (MAE, RMSE, R²) and raw training datasets are restricted to the Instructor evaluation workspace.
            </p>
          </div>
        </div>
      </div>

      {/* ==================== RECENT TRANSACTIONS & USER ACTIVITY TABLES ==================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Table 1: Recent Store Transactions */}
        <div className={`p-5 rounded-3xl border shadow-xs flex flex-col ${cardBg}`}>
          <div className="pb-3 border-b border-inherit flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm">Recent Store Transactions</h3>
              <p className="text-[11px] text-slate-400">Live POS checkout records</p>
            </div>
            <span className="text-xs font-bold text-blue-500">Live Feed</span>
          </div>

          <div className="overflow-x-auto flex-1 mt-2">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-inherit text-slate-400 font-semibold uppercase text-[10px]">
                  <th className="py-2.5 px-3">TXN ID</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Method</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-inherit">
                {RECENT_TRANSACTIONS.map((tx) => (
                  <tr key={tx.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition">
                    <td className="py-3 px-3 font-mono font-bold text-blue-500">{tx.id}</td>
                    <td className="py-3 px-3 font-medium">{tx.customer}</td>
                    <td className="py-3 px-3 text-slate-400">{tx.method}</td>
                    <td className="py-3 px-3 text-right font-extrabold">₱{tx.amount.toLocaleString()}</td>
                    <td className="py-3 px-3 text-center">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500">
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Table 2: Recent User Activity */}
        <div className={`p-5 rounded-3xl border shadow-xs flex flex-col ${cardBg}`}>
          <div className="pb-3 border-b border-inherit flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm">Employee & System Activity</h3>
              <p className="text-[11px] text-slate-400">Role-based audit log of store actions</p>
            </div>
            <span className="text-xs font-bold text-slate-400">Security Audit</span>
          </div>

          <div className="space-y-3 mt-3 overflow-y-auto max-h-60">
            {USER_ACTIVITY.map((act, i) => (
              <div key={i} className="flex items-start space-x-3 text-xs pb-2.5 border-b border-inherit last:border-0">
                <div className="h-7 w-7 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  {act.user.split(' ').map((n) => n[0]).join('')}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold">{act.user}</span>
                    <span className="text-[10px] text-slate-400">{act.time}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-300 mt-0.5">{act.action}</p>
                  <span className="text-[10px] font-semibold text-slate-400">{act.role}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
