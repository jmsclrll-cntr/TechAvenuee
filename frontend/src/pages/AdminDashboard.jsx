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
  Trash2,
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
  Eye,
  LayoutGrid,
  X,
  Inbox,
  Printer
} from 'lucide-react';
import StatCard from '../components/StatCard';
import { ResponsiveLineChart, ResponsiveBarChart, ResponsiveDonutChart } from '../components/Charts';
import Modal from '../components/Modal';
import { api } from '../api';
import { printInventory } from '../utils/printInventory';
import PurchasingManagement from './PurchasingManagement';
import ReportsAnalytics from './ReportsAnalytics';
import logoImg from '../assets/logo.png';
import ProductDetailModal from '../components/ProductDetailModal';

export default function AdminDashboard({ activeTab, setActiveTab, user }) {
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [salesList, setSalesList] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [predictionHistory, setPredictionHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null); // { message, type: 'success' | 'error' }

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };
  const [dashView, setDashView] = useState('all'); // 'all', 'sales', 'inventory', 'predictions', 'activity'

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Modals
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [isEditProductModalOpen, setIsEditProductModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewProduct, setViewProduct] = useState(null);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState({});
  const [activeReceipt, setActiveReceipt] = useState(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // Forms
  const [newProduct, setNewProduct] = useState({
    sku: '', name: '', brand: '', category_id: 1, cost_price: '', selling_price: '', stock_quantity: 10, description: ''
  });
  const [productImageFile, setProductImageFile] = useState(null);
  const [productImagePreview, setProductImagePreview] = useState(null);
  const [newUser, setNewUser] = useState({
    username: '', full_name: '', email: '', password: '', role: 'sales_personnel'
  });

  // Store Settings (Individual Settings Panel)
  const [storeSettings, setStoreSettings] = useState({
    storeName: 'Tech Avenue Smart Solutions',
    branchName: 'Main HQ - Flagship',
    vatRate: 12,
    currency: 'PHP (₱)',
    reorderThreshold: 10,
    receiptFooter: 'Thank you for shopping at Tech Avenue! Official warranty valid with this receipt.',
    autoDeductStock: true
  });
  const [settingsSavedToast, setSettingsSavedToast] = useState(false);

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
    const qty = Number(newProduct.stock_quantity);
    if (qty > 100) {
      showToast("Initial stock quantity cannot exceed the maximum limit of 100 units.", "error");
      return;
    }
    if (qty < 0) {
      showToast("Initial stock quantity cannot be negative.", "error");
      return;
    }
    try {
      const res = await api.addProduct({
        ...newProduct,
        stock_quantity: qty,
        image_url: productImagePreview ? undefined : '/products/desktop.svg'
      });
      if (productImageFile && res?.product_id) {
        const formData = new FormData();
        formData.append('image', productImageFile);
        try {
          await api.uploadProductImage(res.product_id, formData);
        } catch (uploadErr) {
          console.warn("Image upload warning:", uploadErr);
        }
      }
      setIsAddProductModalOpen(false);
      setNewProduct({ sku: '', name: '', brand: '', category_id: categories[0]?.id || 1, cost_price: '', selling_price: '', stock_quantity: 10, description: '' });
      setProductImageFile(null);
      setProductImagePreview(null);
      showToast(`Product "${newProduct.name}" created successfully!`, 'success');
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Handle Edit Product (Admin can edit both cost and retail selling price)
  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    try {
      await api.updateProduct(selectedProduct.id, selectedProduct);
      setIsEditProductModalOpen(false);
      showToast(`Product "${selectedProduct.name}" updated successfully!`, 'success');
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Handle Delete Product with confirmation
  const handleDeleteProduct = async (product) => {
    const target = product || selectedProduct;
    if (!target) return;
    const confirmed = window.confirm(`Are you sure you want to delete "${target.name}" (${target.sku})? This will permanently remove the item from the catalog.`);
    if (!confirmed) return;

    try {
      await api.deleteProduct(target.id);
      setIsEditProductModalOpen(false);
      showToast(`Product "${target.name}" deleted successfully!`, 'success');
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to delete product', 'error');
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
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-[1700px] mx-auto transition-colors bg-[#141210] min-h-full text-[#FAFAF9]">
      {/* VIEW: MAIN ADMIN DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6 sm:space-y-8">
          {/* Dashboard View Mode Selector — Centered Underline Tab Bar with Medium Text */}
          <div className="flex items-center justify-center gap-1 sm:gap-3 overflow-x-auto scrollbar-none border-b border-[#292524] py-1">
            {[
              { id: 'all', label: 'All Overview', icon: LayoutGrid, count: 'Compact' },
              { id: 'sales', label: 'Sales & Revenue', icon: CircleDollarSign, count: `PHP ${(cards.total_daily_sales || 0).toLocaleString()}` },
              { id: 'inventory', label: 'Inventory & Stock', icon: Package, count: `${cards.total_products || 0} items` },
              { id: 'predictions', label: 'AI Predictions', icon: Sparkles, count: cards.predicted_sales_growth || '+14.8%' },
              { id: 'activity', label: 'Store Activity', icon: Activity, count: `${(tables.user_activity || []).length} logs` }
            ].map((btn) => {
              const Icon = btn.icon;
              const isActive = dashView === btn.id;
              return (
                <button
                  key={btn.id}
                  type="button"
                  onClick={() => setDashView(btn.id)}
                  style={{ transition: 'all 0.45s cubic-bezier(0.22, 1, 0.36, 1)' }}
                  className={`relative flex items-center gap-2 px-4 sm:px-6 py-2.5 text-sm sm:text-base font-semibold shrink-0 cursor-pointer select-none ${
                    isActive
                      ? 'text-[#F97316] font-bold'
                      : 'text-stone-400 hover:text-white'
                  }`}
                >
                  <Icon
                    style={{ transition: 'all 0.45s cubic-bezier(0.22, 1, 0.36, 1)' }}
                    className={`w-4 h-4 ${isActive ? 'text-[#F97316]' : 'text-stone-400'}`}
                  />
                  <span style={{ transition: 'all 0.45s cubic-bezier(0.22, 1, 0.36, 1)' }}>{btn.label}</span>
                  <span
                    style={{ transition: 'all 0.45s cubic-bezier(0.22, 1, 0.36, 1)' }}
                    className={`text-xs px-2 py-0.5 rounded-md font-mono ${
                    isActive
                      ? 'bg-[#F97316]/20 text-[#FDBA74] font-bold border border-[#F97316]/30'
                      : 'bg-[#292524] text-stone-400'
                  }`}>
                    {btn.count}
                  </span>
                  {isActive && (
                    <span
                      style={{ transition: 'all 0.45s cubic-bezier(0.22, 1, 0.36, 1)' }}
                      className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full bg-[#F97316]"
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Back button if user drilled down into a specific telemetry or sub-view */}
          {dashView !== 'all' && (
            <div className="flex items-center justify-between bg-[#1C1917] border border-[#292524] rounded-2xl px-5 py-3 text-white shadow-lg">
              <button
                type="button"
                onClick={() => setDashView('all')}
                className="flex items-center gap-2 text-xs font-bold text-[#F97316] hover:text-[#FB923C] cursor-pointer active:scale-95 transition-transform"
              >
                &larr; Back to Dashboard Overview
              </button>
              <span className="text-xs text-stone-400 font-semibold uppercase tracking-wider">
                Viewing: {dashView.toUpperCase()}
              </span>
            </div>
          )}

          {/* ========================================================================= */}
          {/* GROUP 1: ALL OVERVIEW (Warm Neutral + Orange Layout - Compact & Balanced)  */}
          {/* ========================================================================= */}
          {dashView === 'all' && (
            <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-150">
              {/* Top Hero Section: Welcome & Sales Trend Side-by-Side (Compact) */}
              <div className="bg-[#1C1917] text-[#FAFAF9] border border-[#292524] rounded-xl p-4 sm:p-5 shadow-lg">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-stretch">
                  
                  {/* Left Column: Greeting, Live Badge, KPI Metrics & Action Buttons */}
                  <div className="lg:col-span-5 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#F97316] animate-pulse"></span>
                        <span className="text-[10px] uppercase font-extrabold tracking-wider text-orange-400">
                          Live Store Operations
                        </span>
                      </div>

                      <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white leading-tight">
                        Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'},
                        <br />
                        <span className="text-[#F97316]">{(user?.full_name || user?.username || 'Carl').split(' ')[0]}</span>
                      </h1>
                    </div>

                    {/* Sales Metric Display */}
                    <div className="space-y-2 pt-0.5">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-[9px] font-extrabold uppercase tracking-widest text-stone-400">
                            Daily Sales &bull; Gross Revenue Today
                          </p>
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-[#292524] text-[#FB923C] border border-[#44403C]">
                            +12.4%
                          </span>
                        </div>
                        <h2 className="text-lg sm:text-xl font-black font-mono text-white mt-0.5">
                          PHP {(cards.total_daily_sales || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </h2>
                      </div>

                      <div>
                        <p className="text-[9px] font-extrabold uppercase tracking-widest text-stone-400">
                          Monthly Revenue &bull; Current Month
                        </p>
                        <h3 className="text-sm sm:text-base font-black font-mono text-stone-200 mt-0.5">
                          PHP {(cards.monthly_revenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </h3>
                      </div>
                    </div>

                    {/* Main Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2 pt-0.5">
                      <button
                        type="button"
                        onClick={handleExportReport}
                        className="px-3 py-1.5 rounded-lg bg-[#F97316] hover:bg-[#EA580C] text-white text-[11px] font-black shadow-sm transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                      >
                        <Download className="w-3 h-3" />
                        <span>Export Sales CSV</span>
                      </button>

                      <button
                        type="button"
                        onClick={loadData}
                        disabled={loading}
                        className="px-3 py-1.5 rounded-lg bg-[#292524] hover:bg-[#342F2D] text-stone-200 border border-[#44403C] text-[11px] font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer active:scale-95"
                        title="Sync with database"
                      >
                        <Activity className={`w-3 h-3 ${loading ? 'animate-spin text-[#F97316]' : 'text-stone-400'}`} />
                        <span>{loading ? 'Syncing...' : 'Sync Data'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Right Column: Compact Sales Trend Chart */}
                  <div className="lg:col-span-7 bg-[#141210] border border-[#292524] rounded-lg p-3 flex flex-col justify-between">
                    <ResponsiveLineChart
                      title="Sales trend vs projected"
                      data={charts.sales_trends || []}
                      xKey="month"
                      yKey="sales"
                      yKey2="projected"
                      strokeColor="#F97316"
                      strokeColor2="#78716C"
                      height={175}
                    />
                  </div>

                </div>
              </div>

              {/* Three-Column Bottom Grid: Total/Low-Stock Cards | Inventory Donut | AI Predictions Card */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-stretch">
                
                {/* Left 3 cols: Total Products & Low-Stock Alerts Stack */}
                <div className="lg:col-span-3 flex flex-col justify-between gap-3.5">
                  {/* Total Products (Deep Warm Slate/Stone Card) */}
                  <div 
                    onClick={() => setActiveTab('inventory')}
                    className="flex-1 bg-[#1C1917] border border-[#292524] rounded-xl p-3.5 sm:p-4 shadow-sm flex flex-col justify-between hover:border-[#F97316]/40 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-black uppercase tracking-wider text-[#FB923C]">
                        Total Products
                      </p>
                      <Package className="w-4 h-4 text-[#F97316] group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="my-1.5">
                      <span className="text-2xl sm:text-3xl font-black font-mono text-[#FAFAF9]">
                        {cards.total_products || 0}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-400 font-medium">
                      Registered catalog
                    </p>
                  </div>

                  {/* Low-Stock Alerts (Deep Warm Amber/Orange Card) */}
                  <div 
                    onClick={() => setActiveTab('inventory')}
                    className="flex-1 bg-[#1C1917] border border-[#292524] rounded-xl p-3.5 sm:p-4 shadow-sm flex flex-col justify-between hover:border-[#EA580C]/40 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-black uppercase tracking-wider text-[#FDBA74]">
                        Low-Stock Alerts
                      </p>
                      <AlertTriangle className="w-4 h-4 text-[#F97316] group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="my-1.5">
                      <span className="text-2xl sm:text-3xl font-black font-mono text-[#FFFBEB]">
                        {cards.low_stock_products || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] text-stone-400 font-medium">
                        At/below threshold
                      </p>
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-[#292524] text-[#FB923C] border border-[#44403C]">
                        Attention
                      </span>
                    </div>
                  </div>
                </div>

                {/* Middle 5 cols: Inventory Status Distribution Donut */}
                <div className="lg:col-span-5 bg-[#1C1917] border border-[#292524] hover:border-[#F97316]/30 rounded-xl p-4 shadow-sm flex flex-col justify-between transition-colors">
                  <ResponsiveDonutChart
                    title="Inventory status distribution"
                    data={(charts.inventory_status || []).map((item) => {
                      let color = '#F97316'; // Vibrant Orange for In Stock
                      if (item.status === 'Low Stock') color = '#FB923C'; // Lighter Warm Amber/Orange for Low Stock
                      if (item.status === 'Out of Stock') color = '#78716C'; // Neutral Stone for Out of Stock
                      return { ...item, color };
                    })}
                    valueKey="count"
                    labelKey="status"
                    centerLabel="Stock Status"
                  />
                </div>

                {/* Right 4 cols: Warm Orange AI Predictions Card */}
                <div className="lg:col-span-4 bg-gradient-to-br from-[#EA580C] to-[#C2410C] text-white rounded-xl p-4 sm:p-5 shadow-lg shadow-orange-950/30 flex flex-col justify-between relative overflow-hidden">
                  {/* Background ambient pattern */}
                  <div className="absolute -right-8 -top-8 w-28 h-28 rounded-full bg-white/10 blur-lg pointer-events-none"></div>

                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-white/90" />
                        <p className="text-[10px] font-black uppercase tracking-wider text-orange-100">
                          AI Predictions
                        </p>
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/20 text-white backdrop-blur-2xs">
                        ML Models
                      </span>
                    </div>

                    <div className="mt-2.5 mb-1">
                      <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-mono">
                        {cards.predicted_sales_growth || '+14.8%'}
                      </h3>
                      <p className="text-[11px] font-semibold text-orange-100 mt-0.5">
                        Projected growth
                      </p>
                    </div>
                  </div>

                  {/* 4 Interactive Quick Links */}
                  <div className="space-y-1.5 mt-3">
                    {[
                      { id: 'pred_demand', label: 'Product Demand Prediction' },
                      { id: 'pred_sales', label: 'Sales Prediction' },
                      { id: 'pred_slow_moving', label: 'Slow-Moving Products' },
                      { id: 'pred_best_selling', label: 'Best-Selling Products' }
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setActiveTab(item.id)}
                        className="w-full text-left px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 border border-white/20 text-white text-[11px] font-bold transition-all flex items-center justify-between cursor-pointer group active:scale-[0.98]"
                      >
                        <span>{item.label}</span>
                        <span className="text-[10px] text-white/70 group-hover:text-white font-mono transition-transform group-hover:translate-x-0.5">&rarr;</span>
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              {/* Bottom Store Activity Footer Bar */}
              <div className="bg-[#1C1917] border border-[#292524] rounded-xl p-3 sm:p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-[#F97316]" />
                    <h4 className="text-xs font-black text-white">Store Activity</h4>
                  </div>
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-[#292524] text-[#FB923C] border border-[#44403C]">
                    {(tables.user_activity || []).length} logs
                  </span>
                  <p className="hidden md:inline text-[11px] text-stone-400 truncate max-w-md">
                    Latest: {(tables.user_activity?.[0]?.action) || 'System operations running smoothly'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setDashView('activity')}
                    className="text-[11px] font-bold text-[#F97316] hover:text-[#FB923C] hover:underline cursor-pointer"
                  >
                    View Telemetry Logs &rarr;
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* GROUP 2: SALES & REVENUE (Connected sales metrics, trends & top products) */}
          {/* ========================================================================= */}
          {dashView === 'sales' && (
            <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-150">
              {/* Sales KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
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
                  title="Transactions Today"
                  value={cards.transactions_today || 0}
                  subtitle="Completed today"
                  icon={Receipt}
                  badgeColor="blue"
                />
              </div>

              {/* Sales Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7 bg-[#1C1917] border border-[#292524] rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                  <ResponsiveLineChart
                    title="Daily & Monthly Sales Trend vs Projected (PHP)"
                    data={charts.sales_trends || []}
                    xKey="month"
                    yKey="sales"
                    yKey2="projected"
                    strokeColor="#F97316"
                    strokeColor2="#10B981"
                  />
                </div>
                <div className="lg:col-span-5 bg-[#1C1917] border border-[#292524] rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                  <ResponsiveBarChart
                    title="Top-Selling Products (Volume)"
                    data={charts.top_products || []}
                    xKey="name"
                    yKey="units"
                    barColor="#FB923C"
                  />
                </div>
              </div>

              {/* Sales Transactions Table */}
              <div className="bg-[#1C1917] border border-[#292524] rounded-xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-[#F97316] dark:text-[#FB923C]" />
                    <h3 className="font-black text-sm text-slate-900 dark:text-white">Recent Sales Transactions</h3>
                  </div>
                  <button
                    onClick={() => setActiveTab('sales')}
                    className="text-xs text-[#F97316] dark:text-[#FB923C] hover:underline font-semibold"
                  >
                    Go to Full Sales Register &rarr;
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#1C1917] bg-[#141210] text-slate-700 uppercase font-extrabold border-b border-[#292524]">
                      <tr>
                        <th className="py-2.5 px-3">Invoice #</th>
                        <th className="py-2.5 px-3">Customer</th>
                        <th className="py-2.5 px-3 text-right">Total</th>
                        <th className="py-2.5 px-3 text-center">Payment</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-darkbg-border text-slate-800 dark:text-gray-300">
                      {(tables.recent_sales || []).map((t) => (
                        <tr key={t.id} className="hover:bg-gray-50/50 hover:bg-[#292524]/50">
                          <td className="py-2.5 px-3 font-mono font-medium text-[#F97316] dark:text-[#FB923C]">{t.invoice_number}</td>
                          <td className="py-2.5 px-3">{t.customer_name}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600">
                            PHP {Number(t.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#F97316]/10 text-[#F97316] dark:text-greige">
                              {t.payment_method}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* GROUP 3: INVENTORY & STOCK (Stock metrics, distribution & alert items)    */}
          {/* ========================================================================= */}
          {dashView === 'inventory' && (
            <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-150">
              {/* Inventory KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
                <StatCard
                  title="Total Products"
                  value={cards.total_products || 0}
                  subtitle="Registered catalog"
                  icon={Package}
                  badgeColor="blue"
                />
                <StatCard
                  title="Inventory Asset Value"
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
              </div>

              {/* Inventory Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-5 bg-[#1C1917] border border-[#292524] rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                  <ResponsiveDonutChart
                    title="Inventory Status Distribution"
                    data={charts.inventory_status || []}
                    valueKey="count"
                    labelKey="status"
                    centerLabel="Stock Status"
                  />
                </div>
                <div className="lg:col-span-7 bg-[#1C1917] border border-[#292524] rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                  <ResponsiveBarChart
                    title="Category Stock Breakdown"
                    data={charts.category_breakdown || []}
                    xKey="name"
                    yKey="stock"
                    barColor="#F97316"
                  />
                </div>
              </div>

              {/* Low-Stock Alert Table */}
              <div className="bg-[#1C1917] border border-[#292524] rounded-xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <h3 className="font-black text-sm text-slate-900 dark:text-white">Low-Stock Alert Products</h3>
                  </div>
                  <button
                    onClick={() => setActiveTab('inventory')}
                    className="text-xs text-[#F97316] dark:text-[#FB923C] hover:underline font-semibold"
                  >
                    Open Master Inventory &rarr;
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#1C1917] bg-[#141210] text-slate-700 uppercase font-extrabold border-b border-[#292524]">
                      <tr>
                        <th className="py-2.5 px-3">Product Name</th>
                        <th className="py-2.5 px-3">SKU</th>
                        <th className="py-2.5 px-3 text-center">Stock</th>
                        <th className="py-2.5 px-3 text-center">Threshold</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-darkbg-border text-slate-800 dark:text-gray-300">
                      {(tables.low_stock_products || []).map((p) => (
                        <tr key={p.id} className="hover:bg-gray-50/50 hover:bg-[#292524]/50">
                          <td className="py-2.5 px-3 font-medium">{p.name}</td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-[#F97316] dark:text-[#FB923C]">{p.sku}</td>
                          <td className="py-2.5 px-3 text-center font-bold text-red-500">{p.current_stock}</td>
                          <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-[11px]">≤ 5 units</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* GROUP 4: AI PREDICTIONS & FORECASTING (Intelligence & predictive models) */}
          {/* ========================================================================= */}
          {dashView === 'predictions' && (
            <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-150">
              {/* Prediction KPI */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                <StatCard
                  title="Sales Growth Trajectory"
                  value={cards.predicted_sales_growth || '+14.8%'}
                  subtitle="ML projected trajectory"
                  icon={Sparkles}
                  badgeColor="blue"
                  trend="AI Verified"
                />
                <StatCard
                  title="Demand Forecasting Status"
                  value="Active Models"
                  subtitle="Scikit-Learn Regression & Time-Series"
                  icon={BrainCircuit}
                  badgeColor="green"
                />
              </div>

              {/* Demand Trend Chart */}
              <div className="bg-[#1C1917] border border-[#292524] rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <ResponsiveLineChart
                  title="Predicted Demand Trends"
                  data={charts.predicted_demand_trends || []}
                  xKey="period"
                  yKey="demand"
                  yKey2="capacity"
                  strokeColor="#F97316"
                  strokeColor2="#6B7280"
                />
              </div>

              {/* Latest Executive Prediction Runs */}
              <div className="bg-[#1C1917] border border-[#292524] rounded-xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#F97316]" />
                    <h3 className="font-black text-sm text-slate-900 dark:text-white">Latest Executive Prediction Runs</h3>
                  </div>
                  <button
                    onClick={() => setActiveTab('pred_sales')}
                    className="text-xs text-[#F97316] dark:text-[#FB923C] hover:underline font-semibold"
                  >
                    Launch Prediction Suite &rarr;
                  </button>
                </div>

                <div className="space-y-2 text-xs">
                  {(tables.latest_predictions || []).length === 0 ? (
                    <p className="text-slate-400 text-xs py-4 text-center">No predictions recorded yet. Launch one from the Prediction Workspace.</p>
                  ) : (
                    (tables.latest_predictions || []).map((pred, i) => (
                      <div key={i} className="p-3 rounded-lg bg-[#F97316]/5 bg-[#141210]/50 border border-[#F97316]/20">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#FB923C] uppercase text-[10px]">
                            Task: {pred.task_type?.replace('_', ' ')}
                          </span>
                          <span className="font-mono text-[10px] text-slate-500">{pred.created_at?.substring(0, 16)}</span>
                        </div>
                        <p className="font-mono font-bold text-sm text-gray-900 dark:text-white mt-1">
                          Forecast: {Number(pred.predicted_value).toLocaleString()}
                        </p>
                        <p className="text-[11px] text-slate-600 dark:text-gray-300 mt-0.5 line-clamp-1">{pred.recommendation}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* GROUP 5: STORE ACTIVITY & STAFF (Audits, operator logs & team metrics)   */}
          {/* ========================================================================= */}
          {dashView === 'activity' && (
            <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-150">
              {/* Staff KPI */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                <StatCard
                  title="Active Operating Staff"
                  value={cards.active_employees || 0}
                  subtitle="Logged-in users & operating staff"
                  icon={Users}
                  badgeColor="green"
                />
                <StatCard
                  title="System Audit Status"
                  value="Logging Enabled"
                  subtitle="Real-time multi-user telemetry"
                  icon={Activity}
                  badgeColor="blue"
                />
              </div>

              {/* Activity Logs Table */}
              <div className="bg-[#1C1917] border border-[#292524] rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#292524]">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#F97316]" />
                    <h3 className="font-black text-sm text-[#FAFAF9]">Recent Store Activity Logs</h3>
                  </div>
                  <span className="text-xs text-stone-400 font-bold">Chronological telemetry</span>
                </div>

                <div className="space-y-2.5 text-xs">
                  {(tables.user_activity || []).map((log) => (
                    <div key={log.id} className="p-3.5 rounded-xl bg-[#141210] border border-[#292524] hover:bg-[#292524]/60 transition-colors flex items-start justify-between shadow-xs">
                      <div>
                        <p className="font-black text-[#FAFAF9]">{log.action}</p>
                        <p className="text-[12px] text-stone-300 font-semibold mt-0.5">{log.details}</p>
                        <p className="text-[11px] text-[#FB923C] font-bold mt-1">By {log.user_name} ({log.role})</p>
                      </div>
                      <span className="text-[11px] text-stone-300 font-bold font-mono bg-[#1C1917] px-2.5 py-1 rounded-md border border-[#292524] shadow-xs shrink-0">{log.created_at?.substring(11, 16) || log.created_at}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW: INVENTORY MANAGEMENT */}
      {activeTab === 'inventory' && (
        <div className="bg-[#1C1917] border border-[#292524] rounded-2xl p-6 sm:p-7 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#292524]">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-[#FAFAF9]">Master Inventory Catalog</h2>
              <p className="text-xs sm:text-sm text-stone-400 mt-0.5">
                Full administrative authority over hardware specifications, procurement cost, and retail pricing
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => printInventory({ products, suppliers, user })}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#292524] hover:bg-[#342F2D] text-stone-200 hover:text-white border border-[#44403C] text-xs sm:text-sm font-bold shadow-sm transition-all cursor-pointer active:scale-95"
                title="Print all inventory products with full specifications and supplier details"
              >
                <Printer className="w-4 h-4 text-[#FB923C]" />
                <span>Print All Products (PDF / Print)</span>
              </button>
              <button
                type="button"
                onClick={() => setIsAddProductModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#F97316] hover:bg-orange-600 text-white text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Product</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-stone-500" />
              <input
                type="text"
                placeholder="Search by product name, SKU, or brand..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs sm:text-sm pl-10 pr-4 py-2.5 rounded-xl border border-[#292524] bg-[#141210] text-[#FAFAF9] focus:ring-2 focus:ring-[#F97316]/30 outline-none placeholder:text-stone-500"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-[#292524] bg-[#141210] text-[#FAFAF9] focus:ring-2 focus:ring-[#F97316]/30 outline-none font-medium cursor-pointer"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Filter Status & Results Counter */}
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-stone-300">
                Showing <span className="font-bold text-[#FB923C]">{products.length}</span> items
              </span>
              {(searchTerm || categoryFilter) && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#141210] text-stone-300 border border-[#292524]">
                  Filtered
                  <button
                    type="button"
                    onClick={() => { setSearchTerm(''); setCategoryFilter(''); }}
                    className="ml-1 text-slate-400 hover:text-red-500"
                    title="Clear filters"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-[#292524]">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#141210] text-stone-400 uppercase font-extrabold text-[11px] border-b border-[#292524]">
                <tr>
                  <th className="py-3 px-3.5">SKU</th>
                  <th className="py-3 px-3.5">Product Name</th>
                  <th className="py-3 px-3.5">Brand</th>
                  <th className="py-3 px-3.5 text-right">Cost (PHP)</th>
                  <th className="py-3 px-3.5 text-right">Retail (PHP)</th>
                  <th className="py-3 px-3.5 text-center">Margin / Markup %</th>
                  <th className="py-3 px-3.5 text-center">Stock</th>
                  <th className="py-3 px-3.5 text-center">Status</th>
                  <th className="py-3 px-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#292524] text-stone-200">
                {products.map((p) => {
                  const cost = Number(p.cost_price) || 0;
                  const retail = Number(p.selling_price) || 0;
                  const marginPct = cost > 0 ? (((retail - cost) / cost) * 100).toFixed(1) : 0;

                  return (
                    <tr 
                      key={p.id} 
                      onClick={() => {
                        setViewProduct(p);
                        setIsViewModalOpen(true);
                      }}
                      className="hover:bg-[#292524]/80 transition-colors cursor-pointer group"
                      title="Click to view full product & supplier specifications"
                    >
                      <td className="py-2.5 px-3 font-mono font-bold text-[#FB923C] group-hover:underline">{p.sku}</td>
                      <td className="py-2.5 px-3 font-medium">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-lg bg-[#292524] border border-[#292524] p-1 shrink-0 flex items-center justify-center overflow-hidden transition-transform duration-200 group-hover:scale-110 shadow-xs">
                            <img 
                              src={p.image_url || '/products/desktop.svg'} 
                              alt={p.name} 
                              className="max-h-full max-w-full object-contain" 
                              onError={(e) => { e.target.src = '/products/desktop.svg'; }} 
                            />
                          </div>
                          <span className="group-hover:text-[#FB923C] transition-colors font-bold block">{p.name}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3">{p.brand}</td>
                      <td className="py-2.5 px-3 text-right font-mono">PHP {cost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600">PHP {retail.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/25">
                          +{marginPct}%
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold">{p.stock_quantity}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${p.stock_quantity === 0 || p.status === 'out_of_stock' ? 'bg-red-500/10 text-red-500' : (p.stock_quantity <= 5 || p.status === 'low_stock') ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-600'
                          }`}>
                          {p.status?.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedProduct(p);
                              setIsEditProductModalOpen(true);
                            }}
                            className="px-2.5 py-1 rounded bg-[#F97316] text-white text-[11px] font-semibold hover:bg-[#F97316]-light inline-flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3 h-3" />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteProduct(p);
                            }}
                            className="px-2 py-1 rounded bg-red-500/10 text-red-600 hover:bg-red-500/20 text-[11px] font-semibold inline-flex items-center gap-1 transition-colors border border-red-500/20 cursor-pointer"
                            title="Delete this product"
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW: USER MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="bg-[#1C1917] border border-[#292524] rounded-2xl p-6 sm:p-7 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#292524]">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-[#FAFAF9]">Store Employee Accounts & Access</h2>
              <p className="text-xs sm:text-sm text-stone-400 mt-0.5">
                Create team accounts, assign role permissions, and control operational access
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsAddUserModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#F97316] hover:bg-[#F97316]-light text-white text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              <span>Create Employee Account</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-[#292524]">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#141210] text-stone-400 uppercase font-extrabold text-[11px] border-b border-[#292524]">
                <tr>
                  <th className="py-3 px-3.5">Full Name</th>
                  <th className="py-3 px-3.5">Username</th>
                  <th className="py-3 px-3.5">Email Address</th>
                  <th className="py-3 px-3.5">Assigned Role</th>
                  <th className="py-3 px-3.5 text-center">Status</th>
                  <th className="py-3 px-3.5">Last Login</th>
                  <th className="py-3 px-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#292524] text-stone-200">
                {usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-[#292524]/50">
                    <td className="py-2.5 px-3 font-semibold text-[#FAFAF9]">{u.full_name}</td>
                    <td className="py-2.5 px-3 font-mono text-stone-400">{u.username}</td>
                    <td className="py-2.5 px-3">{u.email}</td>
                    <td className="py-2.5 px-3">
                      <select
                        value={u.role}
                        onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                        className="text-xs px-2 py-1 rounded border border-[#292524] bg-[#141210] text-[#FAFAF9] font-semibold"
                      >
                        <option value="admin">Administrator</option>
                        <option value="inventory_clerk">Inventory Clerk</option>
                        <option value="sales_personnel">Sales Personnel</option>
                        <option value="instructor">Instructor Account</option>
                      </select>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${u.status === 'active' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-500'
                        }`}>
                        {u.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-stone-400 font-mono text-[11px]">{u.last_login || 'Never'}</td>
                    <td className="py-2.5 px-3 text-right">
                      {u.id !== user?.id && (
                        <button
                          onClick={() => handleToggleUserStatus(u.id, u.status)}
                          className={`px-2 py-1 rounded text-[11px] font-semibold ${u.status === 'active'
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
        <div className="bg-[#1C1917] border border-[#292524] rounded-2xl p-6 sm:p-7 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#292524]">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">Store Sales Transaction Audit</h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-500 mt-0.5">
                Comprehensive real-time register ledger and electronic audit trail
              </p>
            </div>
            <button
              type="button"
              onClick={handleExportReport}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Export Transactions CSV</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-[#292524]">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#1C1917] bg-[#141210] text-slate-700 uppercase font-extrabold text-[11px] border-b border-[#292524]">
                <tr>
                  <th className="py-3 px-3.5">Invoice #</th>
                  <th className="py-3 px-3.5">Date & Time</th>
                  <th className="py-3 px-3.5">Customer</th>
                  <th className="py-3 px-3.5">Cashier Station</th>
                  <th className="py-3 px-3.5 text-right">Subtotal</th>
                  <th className="py-3 px-3.5 text-right">12% VAT</th>
                  <th className="py-3 px-3.5 text-right">Gross Total</th>
                  <th className="py-3 px-3.5 text-center">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-darkbg-border text-slate-800 dark:text-gray-200">
                {salesList.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50/50 hover:bg-[#292524]/50">
                    <td className="py-2.5 px-3 font-mono font-bold text-[#F97316] dark:text-[#FB923C]">{s.invoice_number}</td>
                    <td className="py-2.5 px-3 text-slate-600 font-medium">{s.created_at}</td>
                    <td className="py-2.5 px-3 font-medium">{s.customer_name}</td>
                    <td className="py-2.5 px-3">{s.cashier}</td>
                    <td className="py-2.5 px-3 text-right font-mono">PHP {Number(s.subtotal).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-500">PHP {Number(s.vat_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600">PHP {Number(s.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#F97316]/10 text-[#F97316] dark:text-greige">
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
          <div className="bg-[#1C1917] border border-[#292524] rounded-2xl p-6 sm:p-7 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#292524]">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2.5">
                  <BrainCircuit className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  Executive Prediction & Business Forecasting
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-500 mt-0.5">
                  Select a business task, configure input parameters, and receive predictive revenue models and recommendations
                </p>
              </div>

              {/* Algorithm Selector for Admin */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">Model:</span>
                <select
                  value={selectedAlgorithm}
                  onChange={(e) => setSelectedAlgorithm(e.target.value)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-[#292524] bg-gray-50 bg-[#141210] font-semibold"
                >
                  <option value="random_forest">Random Forest Regression (Ensemble)</option>
                  <option value="linear_regression">Simple Linear Regression</option>
                </select>
              </div>
            </div>

            {/* Prediction Task Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-gray-100 border-[#292524]">
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
                  className={`p-3 rounded-xl text-xs font-bold text-left border transition-all ${selectedTask === task.id
                    ? 'bg-[#F97316] text-white border-navy shadow-sm'
                    : 'bg-gray-50 bg-[#141210] text-gray-700 dark:text-gray-300 border-gray-200 border-[#292524] hover:bg-gray-100'
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
                <button onClick={() => setPredictionError(null)} className="text-red-400 hover:text-red-600 font-bold ml-2">Ã¢â€Å“ÃƒÂ¹</button>
              </div>
            )}

            {predictionSuccess && (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-300 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                  <span>{predictionSuccess}</span>
                </div>
                <button onClick={() => setPredictionSuccess(null)} className="text-emerald-400 hover:text-emerald-600 font-bold ml-2">Ã¢â€Å“ÃƒÂ¹</button>
              </div>
            )}

            {/* Inputs Form */}
            <div className="p-4 rounded-xl bg-gray-50/60 bg-[#141210]/40 border border-gray-200 border-[#292524] space-y-3">
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
                        className="w-full px-2.5 py-1.5 rounded border border-gray-200 border-[#292524] bg-[#1C1917]"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Marketing Spend (PHP)</label>
                      <input
                        type="number"
                        value={predictionInputs.marketing_spend}
                        onChange={(e) => setPredictionInputs({ ...predictionInputs, marketing_spend: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded border border-gray-200 border-[#292524] bg-[#1C1917]"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Promotional Campaign Active?</label>
                      <select
                        value={predictionInputs.promotions_active}
                        onChange={(e) => setPredictionInputs({ ...predictionInputs, promotions_active: Number(e.target.value) })}
                        className="w-full px-2.5 py-1.5 rounded border border-gray-200 border-[#292524] bg-[#1C1917]"
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
                        className="w-full px-2.5 py-1.5 rounded border border-gray-200 border-[#292524] bg-[#1C1917]"
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
                        className="w-full px-2.5 py-1.5 rounded border border-gray-200 border-[#292524] bg-[#1C1917]"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Discount %</label>
                      <input
                        type="number"
                        value={predictionInputs.discount_pct}
                        onChange={(e) => setPredictionInputs({ ...predictionInputs, discount_pct: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded border border-gray-200 border-[#292524] bg-[#1C1917]"
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
                        className="w-full px-2.5 py-1.5 rounded border border-gray-200 border-[#292524] bg-[#1C1917]"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Estimated Monthly Demand</label>
                      <input
                        type="number"
                        value={predictionInputs.monthly_demand}
                        onChange={(e) => setPredictionInputs({ ...predictionInputs, monthly_demand: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded border border-gray-200 border-[#292524] bg-[#1C1917]"
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
                        className="w-full px-2.5 py-1.5 rounded border border-gray-200 border-[#292524] bg-[#1C1917]"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Customer Rating (1-5)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={predictionInputs.rating}
                        onChange={(e) => setPredictionInputs({ ...predictionInputs, rating: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded border border-gray-200 border-[#292524] bg-[#1C1917]"
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleRunPrediction}
                  disabled={isPredicting}
                  className="px-5 py-2 rounded-lg bg-[#F97316] hover:bg-[#F97316]-light text-white text-xs font-bold shadow-md flex items-center gap-2"
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
              <div className="p-5 rounded-xl bg-[#F97316]/5 bg-[#141210]/50 border border-[#F97316]/20 space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-[#F97316]/20">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                      Forecast Outcome ({predictionResult.task_name})
                    </span>
                    <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white font-mono mt-0.5">
                      {predictionResult.units === 'PHP' ? 'PHP ' : ''}
                      {Number(predictionResult.predicted_value).toLocaleString()} {predictionResult.units !== 'PHP' ? predictionResult.units : ''}
                    </h3>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#F97316]/10 text-[#FB923C] border border-[#F97316]/20">
                    Confidence: {predictionResult.confidence_level}
                  </span>
                </div>

                {/* Business Recommendation Box */}
                <div className="p-4 rounded-lg bg-[#1C1917] border border-purple-200 border-[#292524] space-y-1">
                  <h4 className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#F97316]" />
                    Actionable Business Recommendation
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                    {predictionResult.recommendation}
                  </p>
                </div>

                {/* Projected Trajectory Chart */}
                {predictionResult.trend_data && predictionResult.trend_data.length > 0 && (
                  <div className="bg-[#1C1917] p-4 rounded-lg border border-gray-200 border-[#292524]">
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

      {/* VIEW: SYSTEM & STORE CONFIGURATION (INDIVIDUAL PANEL) */}
      {activeTab === 'settings' && (
        <div className="bg-[#1C1917] border border-[#292524] rounded-2xl p-6 sm:p-8 shadow-sm space-y-6 max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#292524]">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2.5">
                <SettingsIcon className="w-6 h-6 text-[#F97316] dark:text-[#FB923C]" />
                Store Settings & System Controls
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-500 mt-0.5">
                Configure corporate store identity, fiscal VAT rate, POS preferences, and telemetry thresholds
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSettingsSavedToast(true);
                setTimeout(() => setSettingsSavedToast(false), 3000);
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#F97316] hover:bg-[#F97316]-light text-white text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>Save Preferences</span>
            </button>
          </div>

          {settingsSavedToast && (
            <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm font-bold flex items-center gap-2 shadow-sm animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Store configuration saved successfully!</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Store Information */}
            <div className="p-5 rounded-2xl bg-gray-50/70 bg-[#141210]/50 border border-gray-200/80 border-[#292524] space-y-4">
              <div className="flex items-center gap-2 text-[#F97316] dark:text-[#FB923C] font-bold text-sm">
                <Building className="w-4 h-4" />
                <span>Store Identity & Branch</span>
              </div>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">Registered Store Name</label>
                  <input
                    type="text"
                    value={storeSettings.storeName}
                    onChange={(e) => setStoreSettings({ ...storeSettings, storeName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 border-[#292524] bg-[#1C1917] text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">HQ Branch / Outlet</label>
                  <input
                    type="text"
                    value={storeSettings.branchName}
                    onChange={(e) => setStoreSettings({ ...storeSettings, branchName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 border-[#292524] bg-[#1C1917] text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Financial & Fiscal */}
            <div className="p-5 rounded-2xl bg-gray-50/70 bg-[#141210]/50 border border-gray-200/80 border-[#292524] space-y-4">
              <div className="flex items-center gap-2 text-[#F97316] dark:text-[#FB923C] font-bold text-sm">
                <CreditCard className="w-4 h-4" />
                <span>Point of Sale & Fiscal Rules</span>
              </div>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">Value Added Tax (VAT %)</label>
                  <input
                    type="number"
                    value={storeSettings.vatRate}
                    onChange={(e) => setStoreSettings({ ...storeSettings, vatRate: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 border-[#292524] bg-[#1C1917] text-gray-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">Default Reorder Warning Level</label>
                  <input
                    type="number"
                    value={storeSettings.reorderThreshold}
                    onChange={(e) => setStoreSettings({ ...storeSettings, reorderThreshold: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 border-[#292524] bg-[#1C1917] text-gray-900 dark:text-white font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Receipt Customization */}
          <div className="p-5 rounded-2xl bg-gray-50/70 bg-[#141210]/50 border border-gray-200/80 border-[#292524] space-y-3">
            <div className="flex items-center gap-2 text-[#F97316] dark:text-[#FB923C] font-bold text-sm">
              <Printer className="w-4 h-4" />
              <span>Official Receipt Footer Message</span>
            </div>
            <textarea
              rows={2}
              value={storeSettings.receiptFooter}
              onChange={(e) => setStoreSettings({ ...storeSettings, receiptFooter: e.target.value })}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-200 border-[#292524] bg-[#1C1917] text-gray-900 dark:text-white"
            />
          </div>

          {/* Infrastructure Health Status */}
          <div className="p-5 rounded-2xl bg-[#F97316]/5 bg-[#141210]/50 border border-navy/15 border-[#292524] space-y-3">
            <div className="flex items-center gap-2 text-[#F97316] dark:text-[#FB923C] font-bold text-sm">
              <Database className="w-4 h-4" />
              <span>System & Database Diagnostics</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-[#1C1917] border border-gray-200/80 border-[#292524] flex items-center justify-between">
                <span className="text-gray-600 dark:text-slate-500 font-medium">MySQL Database:</span>
                <span className="font-bold text-emerald-600 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Connected
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[#1C1917] border border-gray-200/80 border-[#292524] flex items-center justify-between">
                <span className="text-gray-600 dark:text-slate-500 font-medium">ML Inference Service:</span>
                <span className="font-bold text-purple-600 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                  Ready
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[#1C1917] border border-gray-200/80 border-[#292524] flex items-center justify-between">
                <span className="text-gray-600 dark:text-slate-500 font-medium">Role Access Level:</span>
                <span className="font-bold text-[#F97316] dark:text-[#FB923C]">Admin (L4)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: MY PROFILE */}
      {activeTab === 'profile' && (
        <div className="bg-[#1C1917] border border-[#292524] rounded-2xl p-6 sm:p-8 shadow-sm max-w-xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#F97316] text-white text-2xl font-bold flex items-center justify-center shadow-md">
              {user?.full_name?.charAt(0) || 'A'}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{user?.full_name}</h2>
              <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F97316]/10 text-[#F97316] bg-[#141210]-hover dark:text-greige border border-navy/20">
                ROLE: STORE ADMINISTRATOR (SUPERUSER)
              </span>
            </div>
          </div>

          <div className="space-y-3 text-xs border-t border-gray-100 border-[#292524] pt-4">
            <div className="flex justify-between py-2 border-b border-gray-50 border-[#292524]">
              <span className="text-gray-500">Username:</span>
              <span className="font-bold text-gray-900 dark:text-white">{user?.username}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-50 border-[#292524]">
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
                className="w-full px-3 py-2 rounded border border-[#292524] bg-gray-50 bg-[#141210]"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Brand *</label>
              <input
                type="text"
                required
                value={newProduct.brand}
                onChange={(e) => setNewProduct({ ...newProduct, brand: e.target.value })}
                className="w-full px-3 py-2 rounded border border-[#292524] bg-gray-50 bg-[#141210]"
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
              className="w-full px-3 py-2 rounded border border-[#292524] bg-gray-50 bg-[#141210]"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Category *</label>
              <select
                value={newProduct.category_id}
                onChange={(e) => setNewProduct({ ...newProduct, category_id: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded border border-[#292524] bg-gray-50 bg-[#141210]"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">Initial Stock (Max 100)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={newProduct.stock_quantity}
                onChange={(e) => setNewProduct({ ...newProduct, stock_quantity: Math.min(100, Math.max(0, Number(e.target.value))) })}
                className="w-full px-3 py-2 rounded border border-[#292524] bg-gray-50 bg-[#141210]"
              />
            </div>
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
                className="w-full px-3 py-2 rounded border border-[#292524] bg-gray-50 bg-[#141210]"
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
                className="w-full px-3 py-2 rounded border border-[#292524] bg-gray-50 bg-[#141210]"
              />
            </div>
          </div>

          {/* Optional Product Photo Upload */}
          <div>
            <label className="block font-semibold mb-1">Product Photo (Optional)</label>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-[#141210] border border-[#292524] p-1 shrink-0 flex items-center justify-center overflow-hidden">
                <img
                  src={productImagePreview || '/products/desktop.svg'}
                  alt="Product preview"
                  className="max-h-full max-w-full object-contain"
                  onError={(e) => { e.target.src = '/products/desktop.svg'; }}
                />
              </div>
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setProductImageFile(file);
                      setProductImagePreview(URL.createObjectURL(file));
                    }
                  }}
                  className="block w-full text-xs text-stone-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#292524] file:text-stone-200 hover:file:bg-[#3E3835] cursor-pointer"
                />
                <p className="text-[10px] text-stone-500 mt-0.5">Optional image upload. Defaults to standard placeholder if empty.</p>
              </div>
              {productImageFile && (
                <button
                  type="button"
                  onClick={() => {
                    setProductImageFile(null);
                    setProductImagePreview(null);
                  }}
                  className="px-2 py-1 text-xs text-red-400 hover:text-red-300 cursor-pointer"
                >
                  Remove
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1">Description / Notes</label>
            <textarea
              rows="2"
              placeholder="Technical specs, warranty notes..."
              value={newProduct.description}
              onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
              className="w-full px-3 py-2 rounded border border-[#292524] bg-gray-50 bg-[#141210]"
            ></textarea>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 border-[#292524]">
            <button type="button" onClick={() => setIsAddProductModalOpen(false)} className="px-3 py-1.5 rounded bg-gray-100 bg-[#141210]">Cancel</button>
            <button type="submit" className="px-4 py-1.5 rounded bg-[#F97316] text-white font-bold">Save Product</button>
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
              className="w-full px-3 py-2 rounded border border-[#292524] bg-gray-50 bg-[#141210]"
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
                className="w-full px-3 py-2 rounded border border-[#292524] bg-gray-50 bg-[#141210]"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Selling Price (PHP) [Admin Authorized]</label>
              <input
                type="number"
                step="0.01"
                value={selectedProduct?.selling_price || 0}
                onChange={(e) => setSelectedProduct({ ...selectedProduct, selling_price: e.target.value })}
                className="w-full px-3 py-2 rounded border border-[#292524] bg-gray-50 bg-[#141210] font-bold text-emerald-600"
              />
            </div>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-gray-100 border-[#292524]">
            <button
              type="button"
              onClick={() => handleDeleteProduct(selectedProduct)}
              className="px-3 py-1.5 rounded bg-red-500/10 text-red-600 hover:bg-red-500/20 text-xs font-semibold inline-flex items-center gap-1.5 border border-red-500/20 cursor-pointer transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Product</span>
            </button>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setIsEditProductModalOpen(false)} className="px-3 py-1.5 rounded bg-gray-100 bg-[#141210] text-slate-700 dark:text-gray-300 font-medium">Cancel</button>
              <button type="submit" className="px-4 py-1.5 rounded bg-[#F97316] hover:bg-[#F97316]-light text-white font-bold transition-colors">Update Details</button>
            </div>
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
              className="w-full px-3 py-2 rounded border border-[#292524] bg-gray-50 bg-[#141210]"
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
                className="w-full px-3 py-2 rounded border border-[#292524] bg-gray-50 bg-[#141210]"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Assigned Role *</label>
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                className="w-full px-3 py-2 rounded border border-[#292524] bg-gray-50 bg-[#141210] font-semibold"
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
              className="w-full px-3 py-2 rounded border border-[#292524] bg-gray-50 bg-[#141210]"
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
              className="w-full px-3 py-2 rounded border border-[#292524] bg-gray-50 bg-[#141210]"
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 border-[#292524]">
            <button type="button" onClick={() => setIsAddUserModalOpen(false)} className="px-3 py-1.5 rounded bg-gray-100 bg-[#141210]">Cancel</button>
            <button type="submit" className="px-4 py-1.5 rounded bg-[#F97316] text-white font-bold">Register Account</button>
          </div>
        </form>
      </Modal>

      {/* VIEW PRODUCT DETAIL MODAL */}
      <ProductDetailModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setViewProduct(null);
        }}
        product={viewProduct}
        suppliers={suppliers}
        role="admin"
        onEdit={(prod) => {
          setSelectedProduct(prod);
          setIsEditProductModalOpen(true);
        }}
      />
      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[9999] flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl border backdrop-blur-md animate-in slide-in-from-top-5 fade-in duration-300 ${
          toast.type === 'success'
            ? 'bg-emerald-500/95 border-emerald-400/30 text-white'
            : 'bg-red-500/95 border-red-400/30 text-white'
        }`}>
          {toast.type === 'success'
            ? <CheckCircle2 className="w-5 h-5 shrink-0" />
            : <XCircle className="w-5 h-5 shrink-0" />}
          <span className="text-sm font-bold">{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="ml-2 p-0.5 rounded-full hover:bg-white/20 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

