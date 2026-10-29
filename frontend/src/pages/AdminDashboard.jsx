import React, { useState, useEffect } from 'react';
import { 
  CircleDollarSign, 
  TrendingUp, 
  Package, 
  Boxes, 
  AlertTriangle, 
  Receipt, 
  Users, 
  Sparkles, 
  Search, 
  Plus, 
  Edit2, 
  UserPlus, 
  CheckCircle2, 
  XCircle, 
  Download, 
  Truck, 
  Activity, 
  BrainCircuit, 
  FileSpreadsheet, 
  Settings as SettingsIcon,
  ShieldCheck,
  Eye
} from 'lucide-react';
import StatCard from '../components/StatCard';
import { ResponsiveLineChart, ResponsiveBarChart, ResponsiveDonutChart } from '../components/Charts';
import Modal from '../components/Modal';
import { api } from '../api';
import PurchasingManagement from './PurchasingManagement';
import ReportsAnalytics from './ReportsAnalytics';

export default function AdminDashboard({ activeTab, setActiveTab, user }) {
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [salesList, setSalesList] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [predictionHistory, setPredictionHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Modals
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [isEditProductModalOpen, setIsEditProductModalOpen] = useState(false);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState({});
  const [activeReceipt, setActiveReceipt] = useState(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // Forms
  const [newProduct, setNewProduct] = useState({
    sku: '', name: '', brand: '', category_id: 1, cost_price: '', selling_price: '', stock_quantity: 10, reorder_level: 5, description: ''
  });
  const [newUser, setNewUser] = useState({
    username: '', full_name: '', email: '', password: '', role: 'sales_personnel'
  });

  // Prediction Form State (Executive View)
  const [selectedTask, setSelectedTask] = useState('sales');
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('random_forest');
  const [isPredicting, setIsPredicting] = useState(false);
  const [predictionResult, setPredictionResult] = useState(null);
  const [predictionError, setPredictionError] = useState(null);
  const [predictionSuccess, setPredictionSuccess] = useState(null);
  const [predictionInputs, setPredictionInputs] = useState({
    category: 'Laptops & Ultrabooks',
    store_footfall: 220,
    marketing_spend: 3500,
    promotions_active: 1,
    unit_price: 45000,
    discount_pct: 10,
    competitor_price: 48000,
    current_stock: 15,
    monthly_demand: 25,
    rating: 4.8,
    conversion_rate: 0.28,
    page_views: 3500
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, invRes, salesRes, usersRes, supRes, predHistRes] = await Promise.all([
        api.getDashboardStats('admin'),
        api.getInventory({ search: searchTerm, category_id: categoryFilter }),
        api.getSalesHistory(),
        api.getUsers(),
        api.getSuppliers(),
        api.getPredictionHistory()
      ]);

      if (statsRes.status === 'success') setStats(statsRes.data);
      if (invRes.status === 'success') {
        setProducts(invRes.products);
        setCategories(invRes.categories);
      }
      if (salesRes.status === 'success') setSalesList(salesRes.transactions);
      if (usersRes.status === 'success') setUsersList(usersRes.users);
      if (supRes.status === 'success') setSuppliers(supRes.suppliers);
      if (predHistRes.status === 'success') setPredictionHistory(predHistRes.history);
    } catch (err) {
      console.error('Error loading admin dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [searchTerm, categoryFilter]);

  // Synchronize activeTab if it's one of the prediction tasks
  useEffect(() => {
    if (activeTab === 'pred_demand') setSelectedTask('demand');
    if (activeTab === 'pred_sales') setSelectedTask('sales');
    if (activeTab === 'pred_slow_moving') setSelectedTask('slow_moving');
    if (activeTab === 'pred_best_selling') setSelectedTask('best_selling');
  }, [activeTab]);

  // Handle Add Product
  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      await api.addProduct(newProduct);
      setIsAddProductModalOpen(false);
      setNewProduct({ sku: '', name: '', brand: '', category_id: 1, cost_price: '', selling_price: '', stock_quantity: 10, reorder_level: 5, description: '' });
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  // Handle Edit Product (Admin can edit both cost and retail selling price)
  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    try {
      await api.updateProduct(selectedProduct.id, selectedProduct);
      setIsEditProductModalOpen(false);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  // User Management
  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await api.createUser(newUser);
      setIsAddUserModalOpen(false);
      setNewUser({ username: '', full_name: '', email: '', password: '', role: 'sales_personnel' });
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleToggleUserStatus = async (uid, currentStatus) => {
    const nextStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      await api.updateUserStatus(uid, nextStatus);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUpdateRole = async (uid, newRole) => {
    try {
      await api.updateUserRole(uid, newRole);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  // Generate Prediction (Executive view: returns forecast & business recommendations, no raw training/metrics exposed!)
  const handleRunPrediction = async () => {
    setPredictionError(null);
    setPredictionSuccess(null);

    // Form parameter validation
    if (selectedTask === 'sales') {
      if (predictionInputs.store_footfall === '' || Number(predictionInputs.store_footfall) < 0) {
        setPredictionError('Please provide a valid non-negative number for Projected Store Footfall.');
        return;
      }
      if (predictionInputs.marketing_spend === '' || Number(predictionInputs.marketing_spend) < 0) {
        setPredictionError('Please provide a valid Marketing Spend amount.');
        return;
      }
    } else if (selectedTask === 'demand') {
      if (!predictionInputs.unit_price || Number(predictionInputs.unit_price) <= 0) {
        setPredictionError('Please specify a Unit Price greater than 0.');
        return;
      }
    } else if (selectedTask === 'slow_moving') {
      if (predictionInputs.current_stock === '' || Number(predictionInputs.current_stock) < 0) {
        setPredictionError('Please specify a valid Current Warehouse Stock quantity.');
        return;
      }
    } else if (selectedTask === 'best_selling') {
      if (predictionInputs.rating && (Number(predictionInputs.rating) < 1 || Number(predictionInputs.rating) > 5)) {
        setPredictionError('Customer rating must be between 1.0 and 5.0.');
        return;
      }
    }

    setIsPredicting(true);
    try {
      const res = await api.runPrediction(selectedTask, selectedAlgorithm, predictionInputs);
      if (res && res.status === 'success' && res.prediction) {
        setPredictionResult(res.prediction);
        setPredictionSuccess(`Prediction generated successfully using ${selectedAlgorithm === 'random_forest' ? 'Random Forest Regression' : 'Simple Linear Regression'}.`);
        loadData();
      } else {
        throw new Error(res?.message || 'The server returned an invalid response.');
      }
    } catch (err) {
      console.error('Prediction failed:', err);
      setPredictionError(err.message || 'Unable to generate prediction. Check backend service connection.');
    } finally {
      setIsPredicting(false);
    }
  };

  // Export Business Reports to CSV
  const handleExportReport = () => {
    const headers = ['Invoice Number', 'Customer Name', 'Total Amount', 'Payment Method', 'Date Time', 'Cashier'];
    const rows = salesList.map(s => [
      s.invoice_number,
      s.customer_name,
      s.total_amount,
      s.payment_method,
      s.created_at,
      s.cashier
    ]);

    let csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `TechAvenue_Sales_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isPredictionTab = ['pred_demand', 'pred_sales', 'pred_slow_moving', 'pred_best_selling'].includes(activeTab);

  const cards = stats?.cards || {};
  const charts = stats?.charts || {};
  const tables = stats?.tables || {};

  return (
    <div className="p-6 space-y-6">
      {/* VIEW: MAIN ADMIN DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Top 8 KPI Cards (Required for Admin) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4">
            <StatCard
              title="Daily Sales"
              value={`PHP ${(cards.total_daily_sales || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
              subtitle="Gross revenue today"
              icon={CircleDollarSign}
              badgeColor="green"
              trend="+12.4%"
            />
            <StatCard
              title="Monthly Revenue"
              value={`PHP ${(cards.monthly_revenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
              subtitle="Current month"
              icon={TrendingUp}
              badgeColor="green"
            />
            <StatCard
              title="Total Products"
              value={cards.total_products || 0}
              subtitle="Registered catalog"
              icon={Package}
              badgeColor="blue"
            />
            <StatCard
              title="Inventory Value"
              value={`PHP ${(cards.total_inventory_value || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
              subtitle="Total asset cost"
              icon={Boxes}
              badgeColor="green"
            />
            <StatCard
              title="Low-Stock Alerts"
              value={cards.low_stock_products || 0}
              subtitle="At/below threshold"
              icon={AlertTriangle}
              badgeColor="amber"
              trend="Attention"
            />
            <StatCard
              title="Transactions"
              value={cards.transactions_today || 0}
              subtitle="Completed today"
              icon={Receipt}
              badgeColor="blue"
            />
            <StatCard
              title="Active Staff"
              value={cards.active_employees || 0}
              subtitle="Operating staff"
              icon={Users}
              badgeColor="green"
            />
            <StatCard
              title="Sales Growth"
              value={cards.predicted_sales_growth || '+14.8%'}
              subtitle="ML projected trajectory"
              icon={Sparkles}
              badgeColor="blue"
            />
          </div>

          {/* Charts Row: 5 responsive charts for Admin */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 bg-white dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-border rounded-xl p-5 shadow-sm">
              <ResponsiveLineChart
                title="Daily & Monthly Sales Trend vs Projected (PHP)"
                data={charts.sales_trends || []}
                xKey="month"
                yKey="sales"
                yKey2="projected"
                strokeColor="#1E3A5F"
                strokeColor2="#10B981"
              />
            </div>
            <div className="lg:col-span-4 bg-white dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-border rounded-xl p-5 shadow-sm">
              <ResponsiveDonutChart
                title="Inventory Status Distribution"
                data={charts.inventory_status || []}
                valueKey="count"
                labelKey="status"
                centerLabel="Stock Status"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4 bg-white dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-border rounded-xl p-5 shadow-sm">
              <ResponsiveBarChart
                title="Category Stock Breakdown"
                data={charts.category_breakdown || []}
                xKey="name"
                yKey="stock"
                barColor="#1E3A5F"
              />
            </div>
            <div className="lg:col-span-4 bg-white dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-border rounded-xl p-5 shadow-sm">
              <ResponsiveBarChart
                title="Top-Selling Products (Volume)"
                data={charts.top_products || []}
                xKey="name"
                yKey="units"
                barColor="#10B981"
              />
            </div>
            <div className="lg:col-span-4 bg-white dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-border rounded-xl p-5 shadow-sm">
              <ResponsiveLineChart
                title="Predicted Demand Trends"
                data={charts.predicted_demand_trends || []}
                xKey="period"
                yKey="demand"
                yKey2="capacity"
                strokeColor="#3B82F6"
                strokeColor2="#6B7280"
              />
            </div>
          </div>

          {/* Tables Row: 4 required tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 1. Recent Sales Transactions */}
            <div className="bg-white dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-border rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-navy dark:text-blue-400" />
                  <h3 className="font-bold text-sm text-gray-900 dark:text-white">Recent Sales Transactions</h3>
                </div>
                <button
                  onClick={() => setActiveTab('sales')}
                  className="text-xs text-navy dark:text-greige hover:underline font-semibold"
                >
                  View All
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 dark:bg-darkbg text-gray-500 uppercase font-semibold border-b border-gray-100 dark:border-darkbg-border">
                    <tr>
                      <th className="py-2.5 px-3">Invoice #</th>
                      <th className="py-2.5 px-3">Customer</th>
                      <th className="py-2.5 px-3 text-right">Total</th>
                      <th className="py-2.5 px-3 text-center">Payment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-darkbg-border text-gray-700 dark:text-gray-300">
                    {(tables.recent_sales || []).slice(0, 4).map((t) => (
                      <tr key={t.id} className="hover:bg-gray-50/50 dark:hover:bg-darkbg-hover/50">
                        <td className="py-2.5 px-3 font-mono font-medium text-navy dark:text-blue-400">{t.invoice_number}</td>
                        <td className="py-2.5 px-3">{t.customer_name}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600">
                          PHP {Number(t.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-navy/10 text-navy dark:text-greige">
                            {t.payment_method}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 2. Low-Stock Products */}
            <div className="bg-white dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-border rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <h3 className="font-bold text-sm text-gray-900 dark:text-white">Low-Stock Alert Products</h3>
                </div>
                <button
                  onClick={() => setActiveTab('inventory')}
                  className="text-xs text-navy dark:text-greige hover:underline font-semibold"
                >
                  Manage Stock
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 dark:bg-darkbg text-gray-500 uppercase font-semibold border-b border-gray-100 dark:border-darkbg-border">
                    <tr>
                      <th className="py-2.5 px-3">Product Name</th>
                      <th className="py-2.5 px-3">SKU</th>
                      <th className="py-2.5 px-3 text-center">Stock</th>
                      <th className="py-2.5 px-3 text-center">Reorder</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-darkbg-border text-gray-700 dark:text-gray-300">
                    {(tables.low_stock_products || []).slice(0, 4).map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50/50 dark:hover:bg-darkbg-hover/50">
                        <td className="py-2.5 px-3 font-medium truncate max-w-[170px]">{p.name}</td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-navy dark:text-blue-400">{p.sku}</td>
                        <td className="py-2.5 px-3 text-center font-bold text-red-500">{p.current_stock}</td>
                        <td className="py-2.5 px-3 text-center text-gray-500">{p.reorder_level}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 3. Recent User Activity */}
            <div className="bg-white dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-border rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-navy dark:text-greige" />
                  <h3 className="font-bold text-sm text-gray-900 dark:text-white">Recent Store Activity Logs</h3>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                {(tables.user_activity || []).map((log) => (
                  <div key={log.id} className="p-2.5 rounded-lg bg-gray-50/70 dark:bg-darkbg/50 border border-gray-100 dark:border-darkbg-border flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{log.action}</p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">{log.details}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">By {log.user_name} ({log.role})</p>
                    </div>
                    <span className="text-[10px] text-gray-400 shrink-0 font-mono">{log.created_at?.substring(11, 16)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. Latest Prediction Results */}
            <div className="bg-white dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-border rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  <h3 className="font-bold text-sm text-gray-900 dark:text-white">Latest Executive Prediction Runs</h3>
                </div>
                <button
                  onClick={() => setActiveTab('pred_sales')}
                  className="text-xs text-navy dark:text-greige hover:underline font-semibold"
                >
                  Run Predictions
                </button>
              </div>

              <div className="space-y-2 text-xs">
                {(tables.latest_predictions || []).length === 0 ? (
                  <p className="text-gray-400 text-xs py-4 text-center">No predictions recorded yet. Launch one from the Prediction Workspace.</p>
                ) : (
                  (tables.latest_predictions || []).map((pred, i) => (
                    <div key={i} className="p-2.5 rounded-lg bg-purple-500/5 dark:bg-darkbg/50 border border-purple-500/15">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-purple-700 dark:text-purple-300 uppercase text-[10px]">
                          Task: {pred.task_type?.replace('_', ' ')}
                        </span>
                        <span className="font-mono text-[10px] text-gray-400">{pred.created_at?.substring(0, 16)}</span>
                      </div>
                      <p className="font-mono font-bold text-sm text-gray-900 dark:text-white mt-1">
                        Forecast: {Number(pred.predicted_value).toLocaleString()}
                      </p>
                      <p className="text-[11px] text-gray-600 dark:text-gray-300 mt-0.5 line-clamp-1">{pred.recommendation}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: INVENTORY MANAGEMENT */}
      {activeTab === 'inventory' && (
        <div className="bg-white dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-border rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Master Inventory Administration</h2>
              <p className="text-xs text-gray-500">Full administrative control over store inventory, pricing, and stock limits</p>
            </div>
            <button
              onClick={() => setIsAddProductModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-navy hover:bg-navy-light text-white text-xs font-semibold shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add New Product
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-gray-100 dark:border-darkbg-border">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search inventory..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-gray-200 dark:border-darkbg-border bg-gray-50 dark:bg-darkbg"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs px-3 py-2 rounded-lg border border-gray-200 dark:border-darkbg-border bg-gray-50 dark:bg-darkbg"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-darkbg text-gray-500 uppercase font-semibold border-b border-gray-200 dark:border-darkbg-border">
                <tr>
                  <th className="py-3 px-3">SKU</th>
                  <th className="py-3 px-3">Product Name</th>
                  <th className="py-3 px-3">Brand</th>
                  <th className="py-3 px-3 text-right">Cost (PHP)</th>
                  <th className="py-3 px-3 text-right">Retail (PHP)</th>
                  <th className="py-3 px-3 text-center">Stock</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-darkbg-border text-gray-800 dark:text-gray-200">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/50 dark:hover:bg-darkbg-hover/50">
                    <td className="py-2.5 px-3 font-mono font-bold text-navy dark:text-blue-400">{p.sku}</td>
                    <td className="py-2.5 px-3 font-medium">{p.name}</td>
                    <td className="py-2.5 px-3">{p.brand}</td>
                    <td className="py-2.5 px-3 text-right font-mono">PHP {Number(p.cost_price).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600">PHP {Number(p.selling_price).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td className="py-2.5 px-3 text-center font-bold">{p.stock_quantity}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        p.stock_quantity === 0 ? 'bg-red-500/10 text-red-500' : p.stock_quantity <= p.reorder_level ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-600'
                      }`}>
                        {p.status?.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => {
                          setSelectedProduct(p);
                          setIsEditProductModalOpen(true);
                        }}
                        className="px-2.5 py-1 rounded bg-navy text-white text-[11px] font-semibold hover:bg-navy-light inline-flex items-center gap-1"
                      >
                        <Edit2 className="w-3 h-3" />
                        Edit Item
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW: USER MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="bg-white dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-border rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Store Employee Accounts & RBAC</h2>
              <p className="text-xs text-gray-500">Create team accounts, assign dashboard roles, and configure system access</p>
            </div>
            <button
              onClick={() => setIsAddUserModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-navy hover:bg-navy-light text-white text-xs font-semibold shadow-sm"
            >
              <UserPlus className="w-4 h-4" />
              Create Employee Account
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-darkbg text-gray-500 uppercase font-semibold border-b border-gray-200 dark:border-darkbg-border">
                <tr>
                  <th className="py-3 px-3">Full Name</th>
                  <th className="py-3 px-3">Username</th>
                  <th className="py-3 px-3">Email Address</th>
                  <th className="py-3 px-3">Assigned Role</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3">Last Login</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-darkbg-border text-gray-800 dark:text-gray-200">
                {usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/50 dark:hover:bg-darkbg-hover/50">
                    <td className="py-2.5 px-3 font-semibold text-gray-900 dark:text-white">{u.full_name}</td>
                    <td className="py-2.5 px-3 font-mono text-gray-500">{u.username}</td>
                    <td className="py-2.5 px-3">{u.email}</td>
                    <td className="py-2.5 px-3">
                      <select
                        value={u.role}
                        onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                        className="text-xs px-2 py-1 rounded border border-gray-200 dark:border-darkbg-border bg-gray-50 dark:bg-darkbg font-semibold"
                      >
                        <option value="admin">Administrator</option>
                        <option value="inventory_clerk">Inventory Clerk</option>
                        <option value="sales_personnel">Sales Personnel</option>
                        <option value="instructor">Instructor Account</option>
                      </select>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        u.status === 'active' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-500'
                      }`}>
                        {u.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-gray-400 font-mono text-[11px]">{u.last_login || 'Never'}</td>
                    <td className="py-2.5 px-3 text-right">
                      {u.id !== user?.id && (
                        <button
                          onClick={() => handleToggleUserStatus(u.id, u.status)}
                          className={`px-2 py-1 rounded text-[11px] font-semibold ${
                            u.status === 'active' 
                              ? 'bg-red-500/10 text-red-600 hover:bg-red-500/20' 
                              : 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20'
                          }`}
                        >
                          {u.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW: SALES TRANSACTIONS MONITOR */}
      {activeTab === 'sales' && (
        <div className="bg-white dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-border rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Store Sales Transaction Audit</h2>
              <p className="text-xs text-gray-500">Comprehensive real-time register ledger from MySQL database</p>
            </div>
            <button
              onClick={handleExportReport}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm"
            >
              <Download className="w-4 h-4" />
              Export Transactions CSV
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-darkbg text-gray-500 uppercase font-semibold border-b border-gray-200 dark:border-darkbg-border">
                <tr>
                  <th className="py-3 px-3">Invoice #</th>
                  <th className="py-3 px-3">Date & Time</th>
                  <th className="py-3 px-3">Customer</th>
                  <th className="py-3 px-3">Cashier Station</th>
                  <th className="py-3 px-3 text-right">Subtotal</th>
                  <th className="py-3 px-3 text-right">12% VAT</th>
                  <th className="py-3 px-3 text-right">Gross Total</th>
                  <th className="py-3 px-3 text-center">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-darkbg-border text-gray-800 dark:text-gray-200">
                {salesList.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50/50 dark:hover:bg-darkbg-hover/50">
                    <td className="py-2.5 px-3 font-mono font-bold text-navy dark:text-blue-400">{s.invoice_number}</td>
                    <td className="py-2.5 px-3 text-gray-500">{s.created_at}</td>
                    <td className="py-2.5 px-3 font-medium">{s.customer_name}</td>
                    <td className="py-2.5 px-3">{s.cashier}</td>
                    <td className="py-2.5 px-3 text-right font-mono">PHP {Number(s.subtotal).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-gray-400">PHP {Number(s.vat_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600">PHP {Number(s.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-navy/10 text-navy dark:text-greige">
                        {s.payment_method}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW: SUPPLIER & PURCHASING MANAGEMENT */}
      {activeTab === 'purchasing' && (
        <PurchasingManagement user={user} />
      )}

      {/* VIEW: REPORTS & ANALYTICS */}
      {activeTab === 'reports' && (
        <ReportsAnalytics user={user} />
      )}

      {/* VIEW: ADMIN KNOWLEDGE ANALYSIS & PREDICTION (EXECUTIVE VIEW) */}
      {isPredictionTab && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-border rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <BrainCircuit className="w-5 h-5 text-purple-600" />
                  Executive Prediction & Business Forecasting
                </h2>
                <p className="text-xs text-gray-500">
                  Select a business task, configure input parameters, and receive predictive revenue models and recommendations.
                </p>
              </div>

              {/* Algorithm Selector for Admin */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">Model:</span>
                <select
                  value={selectedAlgorithm}
                  onChange={(e) => setSelectedAlgorithm(e.target.value)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-darkbg-border bg-gray-50 dark:bg-darkbg font-semibold"
                >
                  <option value="random_forest">Random Forest Regression (Ensemble)</option>
                  <option value="linear_regression">Simple Linear Regression</option>
                </select>
              </div>
            </div>

            {/* Prediction Task Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-gray-100 dark:border-darkbg-border">
              {[
                { id: 'sales', label: 'Sales Revenue Prediction' },
                { id: 'demand', label: 'Product Demand Prediction' },
                { id: 'slow_moving', label: 'Slow-Moving Products' },
                { id: 'best_selling', label: 'Best-Selling Products' }
              ].map((task) => (
                <button
                  key={task.id}
                  onClick={() => {
                    setSelectedTask(task.id);
                    setPredictionResult(null);
                    setPredictionError(null);
                    setPredictionSuccess(null);
                  }}
                  className={`p-3 rounded-xl text-xs font-bold text-left border transition-all ${
                    selectedTask === task.id
                      ? 'bg-navy text-white border-navy shadow-sm'
                      : 'bg-gray-50 dark:bg-darkbg text-gray-700 dark:text-gray-300 border-gray-200 dark:border-darkbg-border hover:bg-gray-100'
                  }`}
                >
                  {task.label}
                </button>
              ))}
            </div>

            {/* Inline Notifications */}
            {predictionError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-700 dark:text-red-400 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{predictionError}</span>
                </div>
                <button onClick={() => setPredictionError(null)} className="text-red-400 hover:text-red-600 font-bold ml-2">×</button>
              </div>
            )}

            {predictionSuccess && (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-300 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                  <span>{predictionSuccess}</span>
                </div>
                <button onClick={() => setPredictionSuccess(null)} className="text-emerald-400 hover:text-emerald-600 font-bold ml-2">×</button>
              </div>
            )}

            {/* Inputs Form */}
            <div className="p-4 rounded-xl bg-gray-50/60 dark:bg-darkbg/40 border border-gray-200 dark:border-darkbg-border space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Prediction Input Parameters
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                {selectedTask === 'sales' && (
                  <>
                    <div>
                      <label className="block font-semibold mb-1">Projected Daily Footfall</label>
                      <input
                        type="number"
                        value={predictionInputs.store_footfall}
                        onChange={(e) => setPredictionInputs({ ...predictionInputs, store_footfall: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded border border-gray-200 dark:border-darkbg-border bg-white dark:bg-darkbg-card"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Marketing Spend (PHP)</label>
                      <input
                        type="number"
                        value={predictionInputs.marketing_spend}
                        onChange={(e) => setPredictionInputs({ ...predictionInputs, marketing_spend: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded border border-gray-200 dark:border-darkbg-border bg-white dark:bg-darkbg-card"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Promotional Campaign Active?</label>
                      <select
                        value={predictionInputs.promotions_active}
                        onChange={(e) => setPredictionInputs({ ...predictionInputs, promotions_active: Number(e.target.value) })}
                        className="w-full px-2.5 py-1.5 rounded border border-gray-200 dark:border-darkbg-border bg-white dark:bg-darkbg-card"
                      >
                        <option value="1">Yes (Active Promotion / Sale)</option>
                        <option value="0">No (Standard Trading Day)</option>
                      </select>
                    </div>
                  </>
                )}

                {selectedTask === 'demand' && (
                  <>
                    <div>
                      <label className="block font-semibold mb-1">Target Category</label>
                      <select
                        value={predictionInputs.category}
                        onChange={(e) => setPredictionInputs({ ...predictionInputs, category: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded border border-gray-200 dark:border-darkbg-border bg-white dark:bg-darkbg-card"
                      >
                        {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Unit Price (PHP)</label>
                      <input
                        type="number"
                        value={predictionInputs.unit_price}
                        onChange={(e) => setPredictionInputs({ ...predictionInputs, unit_price: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded border border-gray-200 dark:border-darkbg-border bg-white dark:bg-darkbg-card"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Discount %</label>
                      <input
                        type="number"
                        value={predictionInputs.discount_pct}
                        onChange={(e) => setPredictionInputs({ ...predictionInputs, discount_pct: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded border border-gray-200 dark:border-darkbg-border bg-white dark:bg-darkbg-card"
                      />
                    </div>
                  </>
                )}

                {selectedTask === 'slow_moving' && (
                  <>
                    <div>
                      <label className="block font-semibold mb-1">Current Warehouse Stock</label>
                      <input
                        type="number"
                        value={predictionInputs.current_stock}
                        onChange={(e) => setPredictionInputs({ ...predictionInputs, current_stock: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded border border-gray-200 dark:border-darkbg-border bg-white dark:bg-darkbg-card"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Estimated Monthly Demand</label>
                      <input
                        type="number"
                        value={predictionInputs.monthly_demand}
                        onChange={(e) => setPredictionInputs({ ...predictionInputs, monthly_demand: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded border border-gray-200 dark:border-darkbg-border bg-white dark:bg-darkbg-card"
                      />
                    </div>
                  </>
                )}

                {selectedTask === 'best_selling' && (
                  <>
                    <div>
                      <label className="block font-semibold mb-1">Product Page Views</label>
                      <input
                        type="number"
                        value={predictionInputs.page_views}
                        onChange={(e) => setPredictionInputs({ ...predictionInputs, page_views: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded border border-gray-200 dark:border-darkbg-border bg-white dark:bg-darkbg-card"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Customer Rating (1-5)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={predictionInputs.rating}
                        onChange={(e) => setPredictionInputs({ ...predictionInputs, rating: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded border border-gray-200 dark:border-darkbg-border bg-white dark:bg-darkbg-card"
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleRunPrediction}
                  disabled={isPredicting}
                  className="px-5 py-2 rounded-lg bg-navy hover:bg-navy-light text-white text-xs font-bold shadow-md flex items-center gap-2"
                >
                  {isPredicting ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      Evaluating Business Algorithm...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-greige" />
                      Generate Prediction & Business Recommendation
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Prediction Output & Recommendations */}
            {predictionResult && (
              <div className="p-5 rounded-xl bg-purple-500/5 dark:bg-darkbg/50 border border-purple-500/20 space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-purple-500/20">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                      Forecast Outcome ({predictionResult.task_name})
                    </span>
                    <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white font-mono mt-0.5">
                      {predictionResult.units === 'PHP' ? 'PHP ' : ''}
                      {Number(predictionResult.predicted_value).toLocaleString()} {predictionResult.units !== 'PHP' ? predictionResult.units : ''}
                    </h3>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20">
                    Confidence: {predictionResult.confidence_level}
                  </span>
                </div>

                {/* Business Recommendation Box */}
                <div className="p-4 rounded-lg bg-white dark:bg-darkbg-card border border-purple-200 dark:border-darkbg-border space-y-1">
                  <h4 className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    Actionable Business Recommendation
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                    {predictionResult.recommendation}
                  </p>
                </div>

                {/* Projected Trajectory Chart */}
                {predictionResult.trend_data && predictionResult.trend_data.length > 0 && (
                  <div className="bg-white dark:bg-darkbg-card p-4 rounded-lg border border-gray-200 dark:border-darkbg-border">
                    <ResponsiveLineChart
                      title="Projected Trajectory Analysis"
                      data={predictionResult.trend_data}
                      xKey="period"
                      yKey={Object.keys(predictionResult.trend_data[0])[1]}
                      strokeColor="#8B5CF6"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW: MY PROFILE */}
      {activeTab === 'profile' && (
        <div className="bg-white dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-border rounded-xl p-6 shadow-sm max-w-xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-navy text-white text-2xl font-bold flex items-center justify-center shadow-md">
              {user?.full_name?.charAt(0) || 'A'}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{user?.full_name}</h2>
              <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-navy/10 text-navy dark:bg-darkbg-hover dark:text-greige border border-navy/20">
                ROLE: STORE ADMINISTRATOR (SUPERUSER)
              </span>
            </div>
          </div>

          <div className="space-y-3 text-xs border-t border-gray-100 dark:border-darkbg-border pt-4">
            <div className="flex justify-between py-2 border-b border-gray-50 dark:border-darkbg-border">
              <span className="text-gray-500">Username:</span>
              <span className="font-bold text-gray-900 dark:text-white">{user?.username}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-50 dark:border-darkbg-border">
              <span className="text-gray-500">Corporate Email:</span>
              <span className="font-bold text-gray-900 dark:text-white">{user?.email}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-500">Security Clearance:</span>
              <span className="font-semibold text-emerald-600">Level 4 (Full Operational & User Administration)</span>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD PRODUCT */}
      <Modal isOpen={isAddProductModalOpen} onClose={() => setIsAddProductModalOpen(false)} title="Add Product to Store Catalog">
        <form onSubmit={handleAddProduct} className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">SKU *</label>
              <input
                type="text"
                required
                value={newProduct.sku}
                onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 rounded border border-gray-200 dark:border-darkbg-border bg-gray-50 dark:bg-darkbg"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Brand *</label>
              <input
                type="text"
                required
                value={newProduct.brand}
                onChange={(e) => setNewProduct({ ...newProduct, brand: e.target.value })}
                className="w-full px-3 py-2 rounded border border-gray-200 dark:border-darkbg-border bg-gray-50 dark:bg-darkbg"
              />
            </div>
          </div>
          <div>
            <label className="block font-semibold mb-1">Product Name *</label>
            <input
              type="text"
              required
              value={newProduct.name}
              onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
              className="w-full px-3 py-2 rounded border border-gray-200 dark:border-darkbg-border bg-gray-50 dark:bg-darkbg"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Cost Price (PHP) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={newProduct.cost_price}
                onChange={(e) => setNewProduct({ ...newProduct, cost_price: e.target.value })}
                className="w-full px-3 py-2 rounded border border-gray-200 dark:border-darkbg-border bg-gray-50 dark:bg-darkbg"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Selling Price (PHP) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={newProduct.selling_price}
                onChange={(e) => setNewProduct({ ...newProduct, selling_price: e.target.value })}
                className="w-full px-3 py-2 rounded border border-gray-200 dark:border-darkbg-border bg-gray-50 dark:bg-darkbg"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-darkbg-border">
            <button type="button" onClick={() => setIsAddProductModalOpen(false)} className="px-3 py-1.5 rounded bg-gray-100 dark:bg-darkbg">Cancel</button>
            <button type="submit" className="px-4 py-1.5 rounded bg-navy text-white font-bold">Save Product</button>
          </div>
        </form>
      </Modal>

      {/* MODAL: EDIT PRODUCT */}
      <Modal isOpen={isEditProductModalOpen} onClose={() => setIsEditProductModalOpen(false)} title={`Edit Product: ${selectedProduct?.name}`}>
        <form onSubmit={handleUpdateProduct} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold mb-1">Product Name</label>
            <input
              type="text"
              value={selectedProduct?.name || ''}
              onChange={(e) => setSelectedProduct({ ...selectedProduct, name: e.target.value })}
              className="w-full px-3 py-2 rounded border border-gray-200 dark:border-darkbg-border bg-gray-50 dark:bg-darkbg"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Cost Price (PHP)</label>
              <input
                type="number"
                step="0.01"
                value={selectedProduct?.cost_price || 0}
                onChange={(e) => setSelectedProduct({ ...selectedProduct, cost_price: e.target.value })}
                className="w-full px-3 py-2 rounded border border-gray-200 dark:border-darkbg-border bg-gray-50 dark:bg-darkbg"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Selling Price (PHP) [Admin Authorized]</label>
              <input
                type="number"
                step="0.01"
                value={selectedProduct?.selling_price || 0}
                onChange={(e) => setSelectedProduct({ ...selectedProduct, selling_price: e.target.value })}
                className="w-full px-3 py-2 rounded border border-gray-200 dark:border-darkbg-border bg-gray-50 dark:bg-darkbg font-bold text-emerald-600"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-darkbg-border">
            <button type="button" onClick={() => setIsEditProductModalOpen(false)} className="px-3 py-1.5 rounded bg-gray-100 dark:bg-darkbg">Cancel</button>
            <button type="submit" className="px-4 py-1.5 rounded bg-navy text-white font-bold">Update Details</button>
          </div>
        </form>
      </Modal>

      {/* MODAL: CREATE USER */}
      <Modal isOpen={isAddUserModalOpen} onClose={() => setIsAddUserModalOpen(false)} title="Create Store Staff Account">
        <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold mb-1">Full Legal Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. John Doe"
              value={newUser.full_name}
              onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
              className="w-full px-3 py-2 rounded border border-gray-200 dark:border-darkbg-border bg-gray-50 dark:bg-darkbg"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Username *</label>
              <input
                type="text"
                required
                placeholder="johnd"
                value={newUser.username}
                onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                className="w-full px-3 py-2 rounded border border-gray-200 dark:border-darkbg-border bg-gray-50 dark:bg-darkbg"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Assigned Role *</label>
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                className="w-full px-3 py-2 rounded border border-gray-200 dark:border-darkbg-border bg-gray-50 dark:bg-darkbg font-semibold"
              >
                <option value="sales_personnel">Sales Personnel</option>
                <option value="inventory_clerk">Inventory Clerk</option>
                <option value="admin">Administrator</option>
                <option value="instructor">Instructor Account</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block font-semibold mb-1">Corporate Email *</label>
            <input
              type="email"
              required
              placeholder="johnd@techavenue.com"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              className="w-full px-3 py-2 rounded border border-gray-200 dark:border-darkbg-border bg-gray-50 dark:bg-darkbg"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Initial Password *</label>
            <input
              type="password"
              required
              placeholder="Min. 6 characters"
              value={newUser.password}
              onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              className="w-full px-3 py-2 rounded border border-gray-200 dark:border-darkbg-border bg-gray-50 dark:bg-darkbg"
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-darkbg-border">
            <button type="button" onClick={() => setIsAddUserModalOpen(false)} className="px-3 py-1.5 rounded bg-gray-100 dark:bg-darkbg">Cancel</button>
            <button type="submit" className="px-4 py-1.5 rounded bg-navy text-white font-bold">Register Account</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

