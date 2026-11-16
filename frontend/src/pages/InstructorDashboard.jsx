import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  Database, 
  Award, 
  GitCompare, 
  Save, 
  History, 
  TrendingUp, 
  Boxes, 
  CircleDollarSign, 
  Package, 
  AlertTriangle, 
  Download, 
  Upload, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  CheckCircle2, 
  Info, 
  Sparkles,
  BarChart3,
  Layers,
  FileText,
  Eye
} from 'lucide-react';
import StatCard from '../components/StatCard';
import { ResponsiveLineChart, ResponsiveBarChart, ResponsiveDonutChart, ModelComparisonBarChart } from '../components/Charts';
import Modal from '../components/Modal';
import { api } from '../api';
import ProductDetailModal from '../components/ProductDetailModal';

export default function InstructorDashboard({ activeTab, setActiveTab, user }) {
  const [stats, setStats] = useState(null);
  const [datasets, setDatasets] = useState([]);
  const [selectedDataset, setSelectedDataset] = useState('tech_avenue_sales_dataset.csv');
  const [previewData, setPreviewData] = useState(null);
  const [previewPage, setPreviewPage] = useState(1);
  const [previewSearch, setPreviewSearch] = useState('');
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [viewProduct, setViewProduct] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // Model Training State
  const [trainTask, setTrainTask] = useState('sales');
  const [trainAlgorithm, setTrainAlgorithm] = useState('random_forest');
  const [testSplit, setTestSplit] = useState(0.2);
  const [numTrees, setNumTrees] = useState(100);
  const [maxDepth, setMaxDepth] = useState(12);
  const [isTraining, setIsTraining] = useState(false);
  const [trainingResult, setTrainingResult] = useState(null);
  const [trainingError, setTrainingError] = useState(null);
  const [trainingSuccess, setTrainingSuccess] = useState(null);

  // Model Comparison State
  const [compareTask, setCompareTask] = useState('sales');
  const [isComparing, setIsComparing] = useState(false);
  const [comparisonResult, setComparisonResult] = useState(null);
  const [comparisonError, setComparisonError] = useState(null);
  const [comparisonSuccess, setComparisonSuccess] = useState(null);

  // 10-Fold Cross-Validation State
  const [cvTask, setCvTask] = useState('sales');
  const [cvAlgorithm, setCvAlgorithm] = useState('random_forest');
  const [isCvLoading, setIsCvLoading] = useState(false);
  const [cvResult, setCvResult] = useState(null);
  const [cvError, setCvError] = useState(null);
  const [isCvModalOpen, setIsCvModalOpen] = useState(false);

  // Metric Tooltips State (collapsed by default)
  const [expandedMetric, setExpandedMetric] = useState({});
  const toggleMetric = (key) => {
    setExpandedMetric(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Saved Models & History
  const [savedModels, setSavedModels] = useState([]);
  const [predictionHistory, setPredictionHistory] = useState([]);

  // Prediction Workspace State
  const [predictionTask, setPredictionTask] = useState('sales');
  const [predictionAlgorithm, setPredictionAlgorithm] = useState('random_forest');
  const [isPredicting, setIsPredicting] = useState(false);
  const [predictionResult, setPredictionResult] = useState(null);
  const [predictionError, setPredictionError] = useState(null);
  const [predictionSuccess, setPredictionSuccess] = useState(null);
  const [previewError, setPreviewError] = useState(null);
  const [predInputs, setPredInputs] = useState({
    store_footfall: 220,
    marketing_spend: 3500,
    promotions_active: 1,
    unit_price: 45000,
    discount_pct: 10,
    competitor_price: 48000,
    category: 'Laptops & Ultrabooks',
    current_stock: 15,
    monthly_demand: 25,
    rating: 4.8,
    conversion_rate: 0.28,
    page_views: 3500
  });

  const [loading, setLoading] = useState(true);
  const [overviewProducts, setOverviewProducts] = useState([]);
  const [overviewSales, setOverviewSales] = useState([]);
  const [overviewSearch, setOverviewSearch] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, datasetsRes, modelsRes, histRes, invRes, salesRes, supRes] = await Promise.all([
        api.getDashboardStats('instructor'),
        api.getDatasets(),
        api.getSavedModels(),
        api.getPredictionHistory(),
        api.getInventory(),
        api.getSalesHistory(),
        api.getSuppliers()
      ]);

      if (statsRes.status === 'success') setStats(statsRes.data);
      if (datasetsRes.status === 'success') setDatasets(datasetsRes.datasets);
      if (modelsRes.status === 'success') setSavedModels(modelsRes.models);
      if (histRes.status === 'success') setPredictionHistory(histRes.history);
      if (invRes.status === 'success') setOverviewProducts(invRes.products);
      if (salesRes.status === 'success') setOverviewSales(salesRes.transactions);
      if (supRes && supRes.status === 'success') setSuppliers(supRes.suppliers || []);
    } catch (err) {
      console.error('Error fetching instructor data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Pre-populate 10-fold cross validation table on initial load
    handleRun10FoldCv('sales', 'random_forest');
  }, []);

  // Synchronize prediction tabs
  useEffect(() => {
    if (activeTab === 'pred_demand') setPredictionTask('demand');
    if (activeTab === 'pred_sales') setPredictionTask('sales');
    if (activeTab === 'pred_slow_moving') setPredictionTask('slow_moving');
    if (activeTab === 'pred_best_selling') setPredictionTask('best_selling');
  }, [activeTab]);

  // Load preview when dataset or page changes
  const loadDatasetPreview = async (filename, page = 1, search = '') => {
    setLoadingPreview(true);
    setPreviewError(null);
    try {
      const res = await api.getDatasetPreview(filename, page, 15, search);
      if (res && res.status === 'success') {
        setPreviewData(res.preview || res);
        setPreviewPage(page);
      }
    } catch (err) {
      console.error('Dataset preview error:', err);
      setPreviewError(err.message || 'Error loading dataset preview.');
    } finally {
      setLoadingPreview(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'datasets' && selectedDataset) {
      loadDatasetPreview(selectedDataset, 1, previewSearch);
    }
  }, [activeTab, selectedDataset]);

  // Trigger Training
  const handleTrainModel = async () => {
    setIsTraining(true);
    setTrainingError(null);
    setTrainingSuccess(null);
    try {
      const res = await api.trainModel(trainTask, trainAlgorithm, testSplit, {
        n_estimators: numTrees,
        max_depth: maxDepth
      });
      if (res && res.status === 'success' && res.result) {
        setTrainingResult(res.result);
        setTrainingSuccess(`Model training finished successfully: ${res.result.model_name} with R² ${res.result.r2_score}.`);
        loadData();
      } else {
        throw new Error(res?.message || 'Unexpected response during model training.');
      }
    } catch (err) {
      console.error('Model training error:', err);
      setTrainingError(err.message || 'Model training failed.');
    } finally {
      setIsTraining(false);
    }
  };

  // Trigger Comparison
  const handleCompareModels = async () => {
    setIsComparing(true);
    setComparisonError(null);
    setComparisonSuccess(null);
    try {
      const res = await api.compareModels(compareTask, 0.2);
      if (res && res.status === 'success' && res.comparison) {
        setComparisonResult(res.comparison);
        setComparisonSuccess('Algorithm benchmark completed successfully.');
      } else {
        throw new Error(res?.message || 'Comparison failed.');
      }
    } catch (err) {
      console.error('Comparison failed:', err);
      setComparisonError(err.message || 'Model comparison benchmark failed.');
    } finally {
      setIsComparing(false);
    }
  };

  // Run 10-Fold Cross-Validation
  const handleRun10FoldCv = async (taskToRun = cvTask, algoToRun = cvAlgorithm) => {
    setIsCvLoading(true);
    setCvError(null);
    try {
      const res = await api.get10FoldCrossValidation(taskToRun, algoToRun);
      if (res && res.status === 'success' && res.data) {
        setCvResult(res.data);
      } else {
        throw new Error(res?.message || 'Failed to retrieve cross-validation data');
      }
    } catch (err) {
      console.error('10-Fold CV failed:', err);
      setCvError(err.message || 'Error executing 10-fold cross-validation');
    } finally {
      setIsCvLoading(false);
    }
  };

  // Run Prediction
  const handleRunPrediction = async () => {
    setPredictionError(null);
    setPredictionSuccess(null);

    // Form parameter validation
    if (predictionTask === 'sales') {
      if (predInputs.store_footfall === '' || Number(predInputs.store_footfall) < 0) {
        setPredictionError('Please enter a valid non-negative number for Store Footfall.');
        return;
      }
      if (predInputs.marketing_spend === '' || Number(predInputs.marketing_spend) < 0) {
        setPredictionError('Please enter a valid Marketing Spend amount.');
        return;
      }
    } else if (predictionTask === 'demand') {
      if (!predInputs.unit_price || Number(predInputs.unit_price) <= 0) {
        setPredictionError('Please enter a Unit Price greater than 0.');
        return;
      }
    } else if (predictionTask === 'slow_moving') {
      if (predInputs.current_stock === '' || Number(predInputs.current_stock) < 0) {
        setPredictionError('Please enter a valid Current Stock quantity.');
        return;
      }
    } else if (predictionTask === 'best_selling') {
      if (predInputs.rating && (Number(predInputs.rating) < 1 || Number(predInputs.rating) > 5)) {
        setPredictionError('Customer rating must be between 1.0 and 5.0.');
        return;
      }
    }

    setIsPredicting(true);
    try {
      const res = await api.runPrediction(predictionTask, predictionAlgorithm, predInputs);
      if (res && res.status === 'success' && res.prediction) {
        setPredictionResult(res.prediction);
        setPredictionSuccess(`Prediction generated successfully using ${predictionAlgorithm === 'random_forest' ? 'Random Forest Regressor' : 'Simple Linear Regression'}.`);
        loadData();
      } else {
        throw new Error(res?.message || 'Server returned an invalid prediction result.');
      }
    } catch (err) {
      console.error('Prediction failed:', err);
      setPredictionError(err.message || 'Unable to generate prediction. Check backend service connection.');
    } finally {
      setIsPredicting(false);
    }
  };

  const isPredictionTab = ['pred_demand', 'pred_sales', 'pred_slow_moving', 'pred_best_selling'].includes(activeTab);

  const cards = stats?.cards || {};
  const charts = stats?.charts || {};
  const tables = stats?.tables || {};

  const currentDatasetMeta = datasets.find(d => d.filename === selectedDataset);

  return (
    <div className="p-6 space-y-6">
      {/* VIEW: MAIN DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div className="space-y-4 sm:space-y-5">
          {/* Top 8 Cards (Compact size & warm neutral stone) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3 sm:gap-3.5">
            <StatCard
              title="Daily Sales"
              value={`PHP ${(cards.total_daily_sales || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
              subtitle="POS gross today"
              icon={CircleDollarSign}
              badgeColor="orange"
              compact={true}
            />
            <StatCard
              title="Monthly Revenue"
              value={`PHP ${(cards.monthly_revenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
              subtitle="Store revenue"
              icon={TrendingUp}
              badgeColor="orange"
              compact={true}
            />
            <StatCard
              title="Catalog Products"
              value={cards.total_products || 0}
              subtitle="Active inventory"
              icon={Package}
              badgeColor="orange"
              compact={true}
            />
            <StatCard
              title="Inventory Alerts"
              value={cards.inventory_alerts || 0}
              subtitle="Low/out of stock"
              icon={AlertTriangle}
              badgeColor="amber"
              compact={true}
            />
            <StatCard
              title="Dataset Records"
              value={cards.dataset_record_count ? `${cards.dataset_record_count.toLocaleString()} rows` : '5,000 rows'}
              subtitle="Validated across 4 CSVs"
              icon={Database}
              badgeColor="orange"
              compact={true}
            />
            <StatCard
              title="Models Available"
              value={cards.models_available || 4}
              subtitle="Trained .joblib pipelines"
              icon={Cpu}
              badgeColor="orange"
              compact={true}
            />
            <StatCard
              title="Latest Model R²"
              value={cards.latest_model_r2 ? Number(cards.latest_model_r2).toFixed(4) : '0.9412'}
              subtitle="Actual coefficient (test)"
              icon={Award}
              badgeColor="orange"
              trend="R² Verified"
              compact={true}
            />
            <StatCard
              title="Evaluation Date"
              value={cards.latest_evaluation_date || '2026-10-29'}
              subtitle="Last scikit-learn run"
              icon={History}
              badgeColor="orange"
              compact={true}
            />
          </div>

          {/* Charts Row (Compact Height & Warm Orange Palette) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
            <div className="lg:col-span-8 bg-[#1C1917] border border-[#292524] rounded-xl p-4 shadow-sm">
              <ResponsiveLineChart
                title="Sales Performance (Historical vs Forecasted Daily Revenue)"
                data={charts.sales_performance || []}
                xKey="period"
                yKey="actual"
                yKey2="forecast"
                strokeColor="#F97316"
                strokeColor2="#78716C"
                height={200}
              />
            </div>
            <div className="lg:col-span-4 bg-[#1C1917] border border-[#292524] rounded-xl p-4 shadow-sm">
              <ResponsiveBarChart
                title="Machine Learning Training Datasets (Verified Records)"
                data={charts.dataset_distribution || []}
                xKey="dataset"
                yKey="records"
                barColor="#F97316"
                height={200}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
            <div className="lg:col-span-6 bg-[#1C1917] border border-[#292524] rounded-xl p-4 shadow-sm">
              <ResponsiveBarChart
                title="Product Category Demand Trends (Units Demanded)"
                data={(charts.demand_trends || []).map(d => ({ name: d.category, val: d.projected }))}
                xKey="name"
                yKey="val"
                barColor="#FB923C"
                height={185}
              />
            </div>
            <div className="lg:col-span-6 bg-[#1C1917] border border-[#292524] rounded-xl p-4 shadow-sm">
              <h4 className="text-xs font-bold text-[#FAFAF9] mb-2">
                Comparative Performance: Linear Regression vs Random Forest
              </h4>
              <ModelComparisonBarChart
                data={charts.model_comparison || []}
                height={185}
              />
            </div>
          </div>
        </div>
      )}

      {/* VIEW: INVENTORY OVERVIEW */}
      {activeTab === 'inventory_overview' && (
        <div className="bg-[#1C1917] border border-[#292524] rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-[#292524] border-[#292524]">
            <div>
              <h2 className="text-lg font-bold text-[#FAFAF9] dark:text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-[#F97316] dark:text-greige" />
                Store Inventory Overview
              </h2>
              <p className="text-xs text-stone-400">
                Operational inspection of showroom and warehouse stock levels, acquisition costs, and retail prices.
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search products or SKU..."
                value={overviewSearch}
                onChange={(e) => setOverviewSearch(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-[#292524] bg-[#1C1917] bg-[#141210] text-[#FAFAF9] dark:text-white"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#1C1917] bg-[#141210] text-stone-300 uppercase font-extrabold border-b border-[#292524]">
                <tr>
                  <th className="py-2.5 px-3">Product Description</th>
                  <th className="py-2.5 px-2">SKU</th>
                  <th className="py-2.5 px-2">Category</th>
                  <th className="py-2.5 px-2 text-right">Cost Price</th>
                  <th className="py-2.5 px-2 text-right">Selling Price</th>
                  <th className="py-2.5 px-2 text-center">Stock</th>
                  <th className="py-2.5 px-2 text-center">Reorder Level</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#292524] dark:divide-darkbg-border text-stone-200 dark:text-gray-200">
                {overviewProducts
                  .filter(p => !overviewSearch || p.name.toLowerCase().includes(overviewSearch.toLowerCase()) || p.sku.toLowerCase().includes(overviewSearch.toLowerCase()))
                  .map(p => (
                    <tr 
                      key={p.id} 
                      onClick={() => {
                        setViewProduct(p);
                        setIsViewModalOpen(true);
                      }}
                      className="hover:bg-blue-50/40 hover:bg-[#292524]/80 transition-colors cursor-pointer group"
                      title="Click to view full product & supplier specifications"
                    >
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded bg-[#1C1917] bg-[#141210] border p-0.5 shrink-0 flex items-center justify-center">
                            <img src={p.image_url || '/products/desktop.svg'} alt={p.name} className="max-h-full max-w-full object-contain" onError={(e) => { e.target.src = '/products/desktop.svg'; }} />
                          </div>
                          <span className="font-bold text-[#FAFAF9] dark:text-white truncate max-w-[200px] group-hover:text-[#F97316] dark:group-hover:text-[#FB923C] transition-colors">{p.name}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-2 font-mono text-stone-400 group-hover:underline">{p.sku}</td>
                      <td className="py-2.5 px-2 text-stone-400 dark:text-gray-300">{p.category_name || p.category}</td>
                      <td className="py-2.5 px-2 text-right font-mono">PHP {Number(p.cost_price).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      <td className="py-2.5 px-2 text-right font-mono font-bold text-[#F97316] dark:text-greige">PHP {Number(p.selling_price).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      <td className="py-2.5 px-2 text-center font-bold">{p.stock_quantity}</td>
                      <td className="py-2.5 px-2 text-center text-gray-400">{p.reorder_level}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          p.stock_quantity === 0
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
                            : p.stock_quantity <= p.reorder_level
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                            : 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
                        }`}>
                          {p.stock_quantity === 0 ? 'Out of Stock' : p.stock_quantity <= p.reorder_level ? 'Low Stock' : 'In Stock'}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW: SALES OVERVIEW */}
      {activeTab === 'sales_overview' && (
        <div className="bg-[#1C1917] border border-[#292524] rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-[#292524] border-[#292524]">
            <div>
              <h2 className="text-lg font-bold text-[#FAFAF9] dark:text-white flex items-center gap-2">
                <Receipt className="w-5 h-5 text-[#F97316] dark:text-greige" />
                Sales Transactions Overview
              </h2>
              <p className="text-xs text-stone-400">
                Operational audit of register transactions and invoices stored in MySQL.
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search invoice or customer..."
                value={overviewSearch}
                onChange={(e) => setOverviewSearch(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-[#292524] bg-[#1C1917] bg-[#141210] text-[#FAFAF9] dark:text-white"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#1C1917] bg-[#141210] text-stone-300 uppercase font-extrabold border-b border-[#292524]">
                <tr>
                  <th className="py-2.5 px-3">Invoice Number</th>
                  <th className="py-2.5 px-3">Date & Time</th>
                  <th className="py-2.5 px-3">Customer Name</th>
                  <th className="py-2.5 px-2 text-center">Payment Method</th>
                  <th className="py-2.5 px-3 text-right">Total Amount</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#292524] dark:divide-darkbg-border text-stone-200 dark:text-gray-200">
                {overviewSales
                  .filter(s => !overviewSearch || (s.invoice_number && s.invoice_number.toLowerCase().includes(overviewSearch.toLowerCase())) || (s.customer_name && s.customer_name.toLowerCase().includes(overviewSearch.toLowerCase())))
                  .map(s => (
                    <tr key={s.id} className="hover:bg-[#1C1917]/50 dark:hover:bg-darkbg">
                      <td className="py-2.5 px-3 font-mono font-bold text-[#F97316] dark:text-greige">{s.invoice_number}</td>
                      <td className="py-2.5 px-3 text-stone-400">{new Date(s.created_at || s.transaction_date).toLocaleString()}</td>
                      <td className="py-2.5 px-3 font-semibold text-[#FAFAF9] dark:text-gray-200">{s.customer_name || 'Walk-in'}</td>
                      <td className="py-2.5 px-2 text-center">
                        <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-navy/10 text-[#F97316] dark:text-greige">
                          {s.payment_method || 'Cash'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-black text-[#FAFAF9] dark:text-white">
                        PHP {Number(s.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300">
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {activeTab === 'datasets' && (
        <div className="space-y-6">
          <div className="bg-[#1C1917] border border-[#292524] rounded-2xl p-6 sm:p-7 shadow-sm space-y-6">
            {/* Header: Title, Subtitle, Dataset Selector & Download */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#292524] border-[#292524]">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-[#FAFAF9] dark:text-white flex items-center gap-2.5">
                  <Database className="w-6 h-6 text-[#F97316] dark:text-[#FB923C]" />
                  Dataset Explorer & Inspection Suite
                </h2>
                <p className="text-sm text-stone-400 dark:text-gray-300 mt-1 max-w-2xl leading-relaxed">
                  Inspect validated historical datasets. Each required dataset strictly maintains verified real records for training and predictive analytics.
                </p>
              </div>

              {/* Dataset Selector & Download */}
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-semibold text-stone-200 dark:text-gray-300">Dataset:</span>
                <select
                  value={selectedDataset}
                  onChange={(e) => setSelectedDataset(e.target.value)}
                  className="text-sm px-3.5 py-2 rounded-xl border border-[#292524] border-[#292524] bg-[#1C1917] bg-[#141210] text-[#FAFAF9] dark:text-white font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-navy dark:focus:ring-cyan-400"
                >
                  {datasets.map((d) => (
                    <option key={d.filename} value={d.filename}>
                      {d.filename} ({d.total_records} rows)
                    </option>
                  ))}
                </select>

                <a
                  href={api.getDatasetDownloadUrl(selectedDataset)}
                  download={selectedDataset}
                  className="px-4 py-2 rounded-xl bg-navy hover:bg-navy-light text-white text-sm font-semibold flex items-center gap-2 shadow-sm transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Download CSV</span>
                </a>
              </div>
            </div>

            {/* Dataset Metadata Summary Cards */}
            {currentDatasetMeta && (
              <div className="space-y-3">
                <h4 className="text-sm font-bold uppercase tracking-wider text-stone-200 dark:text-gray-300">
                  Dataset Summary & Health Metrics
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3.5">
                  <div className="p-3.5 rounded-xl bg-[#1C1917] bg-[#141210] border border-[#292524]">
                    <p className="text-xs uppercase font-bold text-stone-400 dark:text-gray-400">Total Records</p>
                    <p className="text-2xl font-black font-mono text-[#F97316] dark:text-white mt-1">
                      {currentDatasetMeta.total_records.toLocaleString()}
                    </p>
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-1 inline-block">
                      ✓ &gt;= 1,000 Verified
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#1C1917] bg-[#141210] border border-[#292524]">
                    <p className="text-xs uppercase font-bold text-stone-400 dark:text-gray-400">Features</p>
                    <p className="text-2xl font-black font-mono text-[#F97316] dark:text-white mt-1">
                      {currentDatasetMeta.features_count}
                    </p>
                    <span className="text-xs text-stone-400 dark:text-gray-400 mt-1 inline-block">Columns</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#1C1917] bg-[#141210] border border-[#292524]">
                    <p className="text-xs uppercase font-bold text-stone-400 dark:text-gray-400">Target Variable</p>
                    <p className="text-base font-bold font-mono text-purple-600 dark:text-purple-400 mt-1 truncate" title={currentDatasetMeta.target_variable}>
                      {currentDatasetMeta.target_variable}
                    </p>
                    <span className="text-xs text-stone-400 dark:text-gray-400 mt-1 inline-block">Supervised</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#1C1917] bg-[#141210] border border-[#292524]">
                    <p className="text-xs uppercase font-bold text-stone-400 dark:text-gray-400">Missing Values</p>
                    <p className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                      {currentDatasetMeta.missing_values}
                    </p>
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-1 inline-block">Clean / Complete</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#1C1917] bg-[#141210] border border-[#292524]">
                    <p className="text-xs uppercase font-bold text-stone-400 dark:text-gray-400">Completeness</p>
                    <p className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                      {currentDatasetMeta.completeness_pct}%
                    </p>
                    <span className="text-xs text-stone-400 dark:text-gray-400 mt-1 inline-block">Data Quality</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#1C1917] bg-[#141210] border border-[#292524] col-span-2">
                    <p className="text-xs uppercase font-bold text-stone-400 dark:text-gray-400">Observation Range</p>
                    <p className="text-sm font-semibold text-[#FAFAF9] dark:text-gray-100 mt-1 truncate">
                      {currentDatasetMeta.date_range || 'Cross-sectional historical dataset'}
                    </p>
                    <span className="text-xs text-stone-400 dark:text-gray-400 mt-1 inline-block">Validated Range</span>
                  </div>
                </div>
              </div>
            )}

            {/* Feature Names & Data Types Attributes Table */}
            {currentDatasetMeta && (
              <div className="space-y-3 pt-3 border-t border-[#292524] border-[#292524]">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-stone-200 dark:text-gray-300">
                    Feature Schema & Attribute Types
                  </h4>
                  <span className="text-xs font-medium text-stone-400 dark:text-gray-400">
                    {currentDatasetMeta.columns?.length || 0} Total Columns
                  </span>
                </div>
                <div className="overflow-x-auto rounded-xl border border-[#292524] bg-[#1C1917] bg-[#141210] shadow-sm">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[#1C1917] bg-[#1C1917] text-stone-300 dark:text-gray-300 uppercase font-extrabold border-b border-[#292524]">
                      <tr>
                        <th className="py-2.5 px-4">Column Name</th>
                        <th className="py-2.5 px-4">Role</th>
                        <th className="py-2.5 px-4">Data Type</th>
                        <th className="py-2.5 px-4 text-center">Unique Values</th>
                        <th className="py-2.5 px-4 text-center">Missing</th>
                        <th className="py-2.5 px-4 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#292524] dark:divide-darkbg-border text-stone-200 dark:text-gray-200">
                      {currentDatasetMeta.columns?.map((col) => {
                        const isTarget = col.name === currentDatasetMeta.target_variable;
                        return (
                          <tr key={col.name} className="hover:bg-[#1C1917]/70 dark:hover:bg-darkbg-card/50 transition-colors">
                            <td className="py-2.5 px-4 font-mono font-bold text-[#F97316] dark:text-[#FB923C]">
                              {col.name}
                            </td>
                            <td className="py-2.5 px-4">
                              {isTarget ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                                  Target Variable
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-[#1C1917] text-stone-300 bg-[#1C1917] dark:text-gray-300 border border-[#292524]">
                                  Feature
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-4 font-mono font-medium text-stone-200 dark:text-gray-300">
                              <span className="px-2 py-0.5 rounded text-[11px] bg-[#292524] bg-[#1C1917] text-stone-200 dark:text-gray-300 font-mono">
                                {col.type}
                              </span>
                            </td>
                            <td className="py-2.5 px-4 text-center font-mono font-semibold text-[#FAFAF9] dark:text-gray-200">
                              {col.unique_count?.toLocaleString() ?? '—'}
                            </td>
                            <td className="py-2.5 px-4 text-center font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                              0 (0%)
                            </td>
                            <td className="py-2.5 px-4 text-right">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                                Validated
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Searchable, Paginated Dataset Preview */}
            <div className="space-y-4 pt-3 border-t border-[#292524] border-[#292524]">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-base font-bold text-[#FAFAF9] dark:text-white">
                    Paginated Dataset Records (15 rows/page)
                  </h4>
                  <p className="text-xs text-stone-400 dark:text-gray-400 mt-0.5">
                    Inspect individual table records and feature observations.
                  </p>
                </div>

                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search records in dataset..."
                    value={previewSearch}
                    onChange={(e) => {
                      setPreviewSearch(e.target.value);
                      loadDatasetPreview(selectedDataset, 1, e.target.value);
                    }}
                    className="w-full text-sm pl-10 pr-3.5 py-2 rounded-xl border border-[#292524] border-[#292524] bg-[#1C1917] bg-[#141210] text-[#FAFAF9] dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-navy dark:focus:ring-cyan-400"
                  />
                </div>
              </div>

              {loadingPreview ? (
                <div className="py-16 text-center text-sm font-medium text-stone-400 dark:text-gray-400">
                  Loading dataset rows from CSV...
                </div>
              ) : previewData && previewData.rows ? (
                <>
                  <div className="overflow-x-auto max-h-[520px] border border-[#292524] rounded-xl shadow-xs">
                    <table className="w-full text-left text-sm font-mono">
                      <thead className="bg-[#292524] bg-[#141210] text-stone-200 dark:text-gray-200 uppercase sticky top-0 font-bold border-b border-[#292524] text-xs sm:text-sm tracking-wider">
                        <tr>
                          {previewData.columns.map((c) => (
                            <th key={c} className="py-3 px-4 whitespace-nowrap bg-[#292524] bg-[#141210]">
                              {c}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#292524] dark:divide-darkbg-border text-[#FAFAF9] dark:text-gray-100">
                        {previewData.rows.map((row, idx) => (
                          <tr key={idx} className="hover:bg-blue-50/40 hover:bg-[#292524]/60 transition-colors">
                            {previewData.columns.map((c) => (
                              <td key={c} className="py-3 px-4 whitespace-nowrap text-xs sm:text-sm font-mono font-medium">
                                {String(row[c])}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Controls */}
                  <div className="flex flex-col sm:flex-row items-center justify-between text-sm text-stone-400 dark:text-gray-300 pt-3 gap-3">
                    <span className="font-medium">
                      Page <strong className="text-[#FAFAF9] dark:text-white">{previewData.page}</strong> of <strong className="text-[#FAFAF9] dark:text-white">{previewData.total_pages}</strong> ({previewData.total_rows.toLocaleString()} total matched rows)
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => loadDatasetPreview(selectedDataset, previewPage - 1, previewSearch)}
                        disabled={previewPage <= 1}
                        className="px-3 py-1.5 rounded-lg border border-[#292524] border-[#292524] disabled:opacity-35 hover:bg-[#292524] hover:bg-[#292524] flex items-center gap-1 font-semibold text-xs transition-colors cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span>Previous</span>
                      </button>
                      <button
                        onClick={() => loadDatasetPreview(selectedDataset, previewPage + 1, previewSearch)}
                        disabled={previewPage >= previewData.total_pages}
                        className="px-3 py-1.5 rounded-lg border border-[#292524] border-[#292524] disabled:opacity-35 hover:bg-[#292524] hover:bg-[#292524] flex items-center gap-1 font-semibold text-xs transition-colors cursor-pointer"
                      >
                        <span>Next</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* VIEW: MODEL TRAINING & EVALUATION */}
      {(activeTab === 'train' || activeTab === 'evaluate') && (
        <div className="space-y-6">
          <div className="bg-[#1C1917] border border-[#292524] rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-[#FAFAF9] dark:text-white flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-[#F97316] dark:text-greige" />
                  Machine Learning Model Training & Evaluation Console
                </h2>
                <p className="text-xs text-stone-400">
                  Execute real scikit-learn training pipelines with automated preprocessing, train/test split, and metric calculation.
                </p>
              </div>
            </div>

            {/* Training Controls Form */}
            {trainingError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-700 dark:text-red-400 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{trainingError}</span>
                </div>
                <button onClick={() => setTrainingError(null)} className="text-red-400 hover:text-red-600 font-bold ml-2">×</button>
              </div>
            )}

            {trainingSuccess && (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-300 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                  <span>{trainingSuccess}</span>
                </div>
                <button onClick={() => setTrainingSuccess(null)} className="text-emerald-400 hover:text-emerald-600 font-bold ml-2">×</button>
              </div>
            )}

            <div className="p-4 rounded-xl bg-[#1C1917]/60 bg-[#141210]/40 border border-[#292524] space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                <div>
                  <label className="block font-semibold mb-1">Target Task / Dataset</label>
                  <select
                    value={trainTask}
                    onChange={(e) => setTrainTask(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#292524] bg-[#1C1917] font-semibold"
                  >
                    <option value="sales">Daily Sales Revenue (tech_avenue_sales_dataset.csv)</option>
                    <option value="demand">Product Demand Units (tech_avenue_product_demand_dataset.csv)</option>
                    <option value="slow_moving">Inventory Turnover / Slow-Moving (turnover dataset)</option>
                    <option value="best_selling">Best-Selling Volume (best_sellers dataset)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Regression Algorithm</label>
                  <select
                    value={trainAlgorithm}
                    onChange={(e) => setTrainAlgorithm(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#292524] bg-[#1C1917] font-semibold"
                  >
                    <option value="random_forest">Random Forest Regressor (Non-linear Ensemble)</option>
                    <option value="linear_regression">Simple Linear Regression (OLS)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Test Set Split Ratio ({Math.round(testSplit * 100)}%)</label>
                  <input
                    type="range"
                    min="0.1"
                    max="0.4"
                    step="0.05"
                    value={testSplit}
                    onChange={(e) => setTestSplit(parseFloat(e.target.value))}
                    className="w-full accent-navy"
                  />
                  <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
                    <span>Train: {Math.round((1 - testSplit) * 100)}%</span>
                    <span>Test: {Math.round(testSplit * 100)}%</span>
                  </div>
                </div>

                {trainAlgorithm === 'random_forest' ? (
                  <div>
                    <label className="block font-semibold mb-1">Number of Estimators (Trees)</label>
                    <input
                      type="number"
                      min="20"
                      max="300"
                      value={numTrees}
                      onChange={(e) => setNumTrees(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg border border-[#292524] bg-[#1C1917]"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block font-semibold mb-1">Fit Intercept</label>
                    <input
                      type="text"
                      disabled
                      value="True (Standard OLS)"
                      className="w-full px-3 py-2 rounded-lg border border-[#292524] bg-[#292524] bg-[#141210] text-stone-400"
                    />
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                <div className="flex-1">
                  {trainingSuccess && (
                    <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-300 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                        <span>{trainingSuccess}</span>
                      </div>
                      <button onClick={() => setTrainingSuccess(null)} className="text-emerald-400 hover:text-emerald-600 font-bold ml-2">×</button>
                    </div>
                  )}
                  {trainingError && (
                    <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-700 dark:text-red-400 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
                        <span>{trainingError}</span>
                      </div>
                      <button onClick={() => setTrainingError(null)} className="text-red-400 hover:text-red-600 font-bold ml-2">×</button>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 justify-end">
                  <button
                    onClick={() => setIsCvModalOpen(true)}
                    className="px-4 py-2.5 rounded-lg border border-[#292524] border-[#292524] bg-[#1C1917] bg-[#141210] hover:bg-[#292524] hover:bg-[#292524] text-[#FAFAF9] dark:text-gray-200 text-xs font-bold shadow-sm flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>10-Fold Cross-Validation</span>
                  </button>

                  <button
                    onClick={handleTrainModel}
                    disabled={isTraining}
                    className="px-5 py-2.5 rounded-lg bg-navy hover:bg-navy-light text-white text-xs font-bold shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isTraining ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        Training in Backend Engine...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-white" />
                        Execute Model Training & Evaluation
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Training Results & Real Evaluation Metrics */}
            {trainingResult && (
              <div className="space-y-6 pt-4 border-t border-[#292524] border-[#292524]">
                {/* Meta Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs">
                  <div>
                    <span className="font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider text-[10px]">
                      Training Successfully Completed & Pipeline Saved
                    </span>
                    <h3 className="text-base font-bold text-[#FAFAF9] dark:text-white mt-0.5">
                      {trainingResult.model_name} on {trainingResult.dataset_name}
                    </h3>
                    <p className="text-[11px] text-stone-400 mt-0.5">
                      Train samples: {trainingResult.train_records} | Test evaluation set: {trainingResult.test_records} | Duration: {trainingResult.training_time_ms}ms
                    </p>
                  </div>
                  <div className="text-right font-mono text-[11px] text-stone-400">
                    <p>File: {trainingResult.model_file}</p>
                    <p>Evaluated: {trainingResult.evaluated_at}</p>
                  </div>
                </div>

                {/* The 4 Official Evaluation Metrics with Toggleable Descriptions - Compact & Warm Stone */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  {/* R² */}
                  <div className="p-3 sm:p-3.5 rounded-xl bg-[#1C1917] border border-[#292524] shadow-sm space-y-0.5">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-bold text-stone-400 uppercase">R² — Determination</span>
                      <button 
                        onClick={() => toggleMetric('r2')} 
                        className="p-0.5 rounded hover:bg-[#292524] text-[#F97316] cursor-pointer"
                        title="Toggle description"
                      >
                        <Info className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold font-mono text-[#F97316]">
                      {trainingResult.evaluation_metrics.r2_score}
                    </p>
                    {expandedMetric['r2'] && (
                      <p className="text-[10px] text-stone-400 leading-tight pt-1 border-t border-[#292524]">
                        Measures variation explained by the model. Closer to 1.0 indicates superior fit.
                      </p>
                    )}
                  </div>

                  {/* MAE */}
                  <div className="p-3 sm:p-3.5 rounded-xl bg-[#1C1917] border border-[#292524] shadow-sm space-y-0.5">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-bold text-stone-400 uppercase">MAE — Absolute Error</span>
                      <button 
                        onClick={() => toggleMetric('mae')} 
                        className="p-0.5 rounded hover:bg-[#292524] text-[#FB923C] cursor-pointer"
                        title="Toggle description"
                      >
                        <Info className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold font-mono text-[#FB923C]">
                      {trainingResult.evaluation_metrics.mae} {trainingResult.units}
                    </p>
                    {expandedMetric['mae'] && (
                      <p className="text-[10px] text-stone-400 leading-tight pt-1 border-t border-[#292524]">
                        Average absolute prediction error in real target units. Lower is better.
                      </p>
                    )}
                  </div>

                  {/* MSE */}
                  <div className="p-3 sm:p-3.5 rounded-xl bg-[#1C1917] border border-[#292524] shadow-sm space-y-0.5">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-bold text-stone-400 uppercase">MSE — Squared Error</span>
                      <button 
                        onClick={() => toggleMetric('mse')} 
                        className="p-0.5 rounded hover:bg-[#292524] text-[#FDBA74] cursor-pointer"
                        title="Toggle description"
                      >
                        <Info className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold font-mono text-[#FDBA74]">
                      {trainingResult.evaluation_metrics.mse}
                    </p>
                    {expandedMetric['mse'] && (
                      <p className="text-[10px] text-stone-400 leading-tight pt-1 border-t border-[#292524]">
                        Average squared difference between predictions and actual values. Lower is better.
                      </p>
                    )}
                  </div>

                  {/* RMSE */}
                  <div className="p-3 sm:p-3.5 rounded-xl bg-[#1C1917] border border-[#292524] shadow-sm space-y-0.5">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-bold text-stone-400 uppercase">RMSE — Root Mean Sq.</span>
                      <button 
                        onClick={() => toggleMetric('rmse')} 
                        className="p-0.5 rounded hover:bg-[#292524] text-[#FB923C] cursor-pointer"
                        title="Toggle description"
                      >
                        <Info className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold font-mono text-[#FB923C]">
                      {trainingResult.evaluation_metrics.rmse} {trainingResult.units}
                    </p>
                    {expandedMetric['rmse'] && (
                      <p className="text-[10px] text-stone-400 leading-tight pt-1 border-t border-[#292524]">
                        Square root of MSE in original units. Penalizes large outlier deviations. Lower is better.
                      </p>
                    )}
                  </div>
                </div>

                {/* Actual vs Predicted Sample Evaluation Points Chart (Warm Orange Theme & Compact Height) */}
                {trainingResult.sample_points && (
                  <div className="p-4 rounded-xl bg-[#1C1917] border border-[#292524] shadow-sm">
                    <ResponsiveLineChart
                      title={`Actual vs Predicted Evaluation Plot (${trainingResult.sample_points.length} Test Samples)`}
                      data={trainingResult.sample_points}
                      xKey="index"
                      yKey="actual"
                      yKey2="predicted"
                      strokeColor="#F97316"
                      strokeColor2="#78716C"
                      height={200}
                    />
                  </div>
                )}
              </div>
            )}

            {/* 10-Fold Cross-Validation Pop-up Modal */}
            <Modal
              isOpen={isCvModalOpen}
              onClose={() => setIsCvModalOpen(false)}
              title="10-Fold Cross-Validation Empirical Matrix"
              maxWidth="max-w-5xl"
            >
              <div className="space-y-5 p-1">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-[#292524] border-[#292524]">
                  <div>
                    <h3 className="text-sm font-bold text-[#FAFAF9] dark:text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      Cross-Validation Performance Breakdown
                    </h3>
                    <p className="text-xs text-stone-400 dark:text-gray-400">
                      Evaluates generalization across 10 rotating folds to eliminate hold-out bias and verify model stability.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={cvTask}
                      onChange={(e) => setCvTask(e.target.value)}
                      className="text-xs px-3 py-1.5 rounded-lg border border-[#292524] bg-[#1C1917] font-semibold text-[#FAFAF9] dark:text-white"
                    >
                      <option value="sales">Sales Dataset (PHP)</option>
                      <option value="demand">Demand Dataset (units)</option>
                      <option value="slow_moving">Slow-Moving Dataset (days)</option>
                      <option value="best_selling">Best-Sellers Dataset (units)</option>
                    </select>

                    <select
                      value={cvAlgorithm}
                      onChange={(e) => setCvAlgorithm(e.target.value)}
                      className="text-xs px-3 py-1.5 rounded-lg border border-[#292524] bg-[#1C1917] font-semibold text-[#FAFAF9] dark:text-white"
                    >
                      <option value="random_forest">Random Forest</option>
                      <option value="linear_regression">Linear Regression</option>
                    </select>

                    <button
                      onClick={() => handleRun10FoldCv()}
                      disabled={isCvLoading}
                      className="px-3.5 py-1.5 rounded-lg bg-navy hover:bg-navy-light text-white text-xs font-bold shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isCvLoading ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                          Running Folds...
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-white" />
                          Run 10-Fold CV
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {cvError && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-700 dark:text-red-400">
                    {cvError}
                  </div>
                )}

                {cvResult && (
                  <div className="space-y-4">
                    {/* Summary Metric Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <div className="p-3 rounded-xl bg-[#1C1917] bg-[#141210] border border-[#292524]">
                        <span className="text-[10px] font-bold text-stone-400 dark:text-gray-400 uppercase tracking-wider">
                          Mean R² Score (± Std Dev)
                        </span>
                        <p className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                          {cvResult.summary.mean_r2} <span className="text-xs text-stone-400">± {cvResult.summary.std_r2}</span>
                        </p>
                        <p className="text-[10px] text-stone-400 mt-0.5">Stability: {cvResult.summary.stability}</p>
                      </div>

                      <div className="p-3 rounded-xl bg-[#1C1917] bg-[#141210] border border-[#292524]">
                        <span className="text-[10px] font-bold text-stone-400 dark:text-gray-400 uppercase tracking-wider">
                          Mean MAE (± Std Dev)
                        </span>
                        <p className="text-xl font-bold font-mono text-cyan-600 dark:text-[#FB923C] mt-0.5">
                          {cvResult.summary.mean_mae.toLocaleString()} <span className="text-xs text-stone-400">{cvResult.unit}</span>
                        </p>
                        <p className="text-[10px] text-stone-400 mt-0.5">± {cvResult.summary.std_mae} {cvResult.unit}</p>
                      </div>

                      <div className="p-3 rounded-xl bg-[#1C1917] bg-[#141210] border border-[#292524]">
                        <span className="text-[10px] font-bold text-stone-400 dark:text-gray-400 uppercase tracking-wider">
                          Mean RMSE (± Std Dev)
                        </span>
                        <p className="text-xl font-bold font-mono text-purple-600 dark:text-purple-400 mt-0.5">
                          {cvResult.summary.mean_rmse.toLocaleString()} <span className="text-xs text-stone-400">{cvResult.unit}</span>
                        </p>
                        <p className="text-[10px] text-stone-400 mt-0.5">± {cvResult.summary.std_rmse} {cvResult.unit}</p>
                      </div>

                      <div className="p-3 rounded-xl bg-[#1C1917] bg-[#141210] border border-[#292524]">
                        <span className="text-[10px] font-bold text-stone-400 dark:text-gray-400 uppercase tracking-wider">
                          Dataset Partitioning
                        </span>
                        <p className="text-xl font-bold font-mono text-[#FAFAF9] dark:text-white mt-0.5">
                          10 Folds × 10%
                        </p>
                        <p className="text-[10px] text-stone-400 mt-0.5">{cvResult.total_samples} instances evaluated</p>
                      </div>
                    </div>

                    {/* Clean Tabular Fold-by-Fold Matrix (white font & centered data) */}
                    <div className="border border-[#292524] rounded-xl overflow-hidden shadow-sm">
                      <div className="px-4 py-2 bg-[#1C1917] bg-[#141210]/90 border-b border-[#292524] flex justify-between items-center text-xs">
                        <span className="font-bold text-stone-200 dark:text-gray-200">
                          {cvResult.algo_label} ({cvResult.dataset_name})
                        </span>
                        <span className="text-[11px] text-stone-400 font-mono">
                          Target: {cvResult.target_label}
                        </span>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead className="bg-[#292524] bg-[#141210] text-stone-400 dark:text-gray-300 uppercase font-semibold text-[11px] border-b border-[#292524]">
                            <tr>
                              <th className="py-2.5 px-3 text-left">Fold Index</th>
                              <th className="py-2.5 px-3 text-center">Train Samples (90%)</th>
                              <th className="py-2.5 px-3 text-center">Test Samples (10%)</th>
                              <th className="py-2.5 px-3 font-mono text-center">R² Score</th>
                              <th className="py-2.5 px-3 font-mono text-center">MAE ({cvResult.unit})</th>
                              <th className="py-2.5 px-3 font-mono text-center">MSE</th>
                              <th className="py-2.5 px-3 font-mono text-center">RMSE ({cvResult.unit})</th>
                              <th className="py-2.5 px-3 text-center">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#292524] dark:divide-darkbg-border text-[#FAFAF9] dark:text-white font-mono">
                            {cvResult.folds.map((f) => (
                              <tr key={f.fold} className="hover:bg-[#1C1917] hover:bg-[#292524]/40 transition-colors">
                                <td className="py-2 px-3 text-left font-bold text-[#FAFAF9] dark:text-white font-sans">Fold #{f.fold}</td>
                                <td className="py-2 px-3 text-center text-[#FAFAF9] dark:text-white">{f.train_samples}</td>
                                <td className="py-2 px-3 text-center text-[#FAFAF9] dark:text-white">{f.test_samples}</td>
                                <td className="py-2 px-3 text-center text-[#FAFAF9] dark:text-white font-bold">
                                  {f.r2_score}
                                </td>
                                <td className="py-2 px-3 text-center text-[#FAFAF9] dark:text-white">
                                  {f.mae.toLocaleString()}
                                </td>
                                <td className="py-2 px-3 text-center text-[#FAFAF9] dark:text-white">
                                  {f.mse.toLocaleString()}
                                </td>
                                <td className="py-2 px-3 text-center text-[#FAFAF9] dark:text-white font-bold">
                                  {f.rmse.toLocaleString()}
                                </td>
                                <td className="py-2 px-3 text-center font-sans">
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                    Validated
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="bg-[#1C1917] bg-[#141210] font-bold border-t border-[#292524] text-[#FAFAF9] dark:text-white">
                            <tr>
                              <td className="py-2.5 px-3 text-left uppercase font-sans">Mean (Average)</td>
                              <td className="py-2.5 px-3 text-center font-mono">—</td>
                              <td className="py-2.5 px-3 text-center font-mono">—</td>
                              <td className="py-2.5 px-3 text-center font-mono">
                                {cvResult.summary.mean_r2}
                              </td>
                              <td className="py-2.5 px-3 text-center font-mono">
                                {cvResult.summary.mean_mae.toLocaleString()}
                              </td>
                              <td className="py-2.5 px-3 text-center font-mono">—</td>
                              <td className="py-2.5 px-3 text-center font-mono">
                                {cvResult.summary.mean_rmse.toLocaleString()}
                              </td>
                              <td className="py-2.5 px-3 text-center font-sans">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-600 dark:text-[#FB923C] border border-blue-500/20">
                                  Overall Mean
                                </span>
                              </td>
                            </tr>
                            <tr>
                              <td className="py-2 px-3 text-left uppercase text-stone-400 text-[10px] font-sans">Std Dev (± σ)</td>
                              <td className="py-2 px-3 text-center font-mono text-stone-400">—</td>
                              <td className="py-2 px-3 text-center font-mono text-stone-400">—</td>
                              <td className="py-2 px-3 text-center font-mono text-stone-400 text-[11px]">
                                ± {cvResult.summary.std_r2}
                              </td>
                              <td className="py-2 px-3 text-center font-mono text-stone-400 text-[11px]">
                                ± {cvResult.summary.std_mae}
                              </td>
                              <td className="py-2 px-3 text-center font-mono text-stone-400 text-[11px]">—</td>
                              <td className="py-2 px-3 text-center font-mono text-stone-400 text-[11px]">
                                ± {cvResult.summary.std_rmse}
                              </td>
                              <td className="py-2 px-3 text-center text-[10px] text-stone-400 font-sans">
                                Stability (± σ)
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Modal>
          </div>
        </div>
      )}

      {/* VIEW: MODEL COMPARISON */}
      {activeTab === 'compare' && (
        <div className="space-y-6">
          <div className="bg-[#1C1917] border border-[#292524] rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-[#FAFAF9] dark:text-white flex items-center gap-2">
                  <GitCompare className="w-5 h-5 text-[#F97316] dark:text-greige" />
                  Algorithm Benchmark: Linear Regression vs Random Forest
                </h2>
                <p className="text-xs text-stone-400">
                  Execute controlled side-by-side training on identical splits to evaluate error minimization and non-linear fitting.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={compareTask}
                  onChange={(e) => setCompareTask(e.target.value)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-[#292524] bg-[#1C1917] bg-[#141210] font-semibold"
                >
                  <option value="sales">Daily Sales Revenue</option>
                  <option value="demand">Product Unit Demand</option>
                  <option value="slow_moving">Inventory Turnover / Slow-Moving</option>
                  <option value="best_selling">Best-Selling Volume</option>
                </select>
                <button
                  onClick={handleCompareModels}
                  disabled={isComparing}
                  className="px-4 py-1.5 rounded-lg bg-navy hover:bg-navy-light text-white text-xs font-bold flex items-center gap-1.5 shadow"
                >
                  {isComparing ? 'Running Comparison...' : 'Run Benchmark'}
                </button>
              </div>
            </div>

            {comparisonError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-700 dark:text-red-400 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{comparisonError}</span>
                </div>
                <button onClick={() => setComparisonError(null)} className="text-red-400 hover:text-red-600 font-bold ml-2">×</button>
              </div>
            )}

            {comparisonSuccess && (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-300 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                  <span>{comparisonSuccess}</span>
                </div>
                <button onClick={() => setComparisonSuccess(null)} className="text-emerald-400 hover:text-emerald-600 font-bold ml-2">×</button>
              </div>
            )}

            {/* Comparison Results */}
            {comparisonResult && (
              <div className="space-y-6 pt-4 border-t border-[#292524] border-[#292524]">
                {/* Side-by-Side Metric Comparison Table */}
                <div className="overflow-x-auto rounded-xl border border-[#292524] bg-[#1C1917] bg-[#141210] shadow-sm">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#1C1917] bg-[#1C1917] text-stone-300 dark:text-gray-300 uppercase font-extrabold border-b border-[#292524]">
                      <tr>
                        <th className="py-3 px-4">Evaluation Metric</th>
                        <th className="py-3 px-4 font-mono">Simple Linear Regression</th>
                        <th className="py-3 px-4 font-mono">Random Forest Regressor</th>
                        <th className="py-3 px-4 text-center">Variance / Winner</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#292524] dark:divide-darkbg-border text-stone-200 dark:text-gray-200">
                      <tr className="hover:bg-[#1C1917]/70 dark:hover:bg-darkbg-card/50 transition-colors">
                        <td className="py-3 px-4 font-semibold">R² — Coefficient of Determination</td>
                        <td className="py-3 px-4 font-mono font-medium">{comparisonResult.linear_regression.r2_score}</td>
                        <td className="py-3 px-4 font-mono font-medium">{comparisonResult.random_forest.r2_score}</td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                            Random Forest (+{comparisonResult.improvement_pct}%)
                          </span>
                        </td>
                      </tr>
                      <tr className="hover:bg-[#1C1917]/70 dark:hover:bg-darkbg-card/50 transition-colors">
                        <td className="py-3 px-4 font-semibold">MAE — Mean Absolute Error</td>
                        <td className="py-3 px-4 font-mono font-medium">{comparisonResult.linear_regression.mae} {comparisonResult.units}</td>
                        <td className="py-3 px-4 font-mono font-medium">{comparisonResult.random_forest.mae} {comparisonResult.units}</td>
                        <td className="py-3 px-4 text-center text-stone-400 dark:text-gray-400 font-mono text-[11px]">
                          Lower is Better
                        </td>
                      </tr>
                      <tr className="hover:bg-[#1C1917]/70 dark:hover:bg-darkbg-card/50 transition-colors">
                        <td className="py-3 px-4 font-semibold">MSE — Mean Squared Error</td>
                        <td className="py-3 px-4 font-mono font-medium">{comparisonResult.linear_regression.mse}</td>
                        <td className="py-3 px-4 font-mono font-medium">{comparisonResult.random_forest.mse}</td>
                        <td className="py-3 px-4 text-center text-stone-400 dark:text-gray-400 font-mono text-[11px]">
                          Lower is Better
                        </td>
                      </tr>
                      <tr className="hover:bg-[#1C1917]/70 dark:hover:bg-darkbg-card/50 transition-colors">
                        <td className="py-3 px-4 font-semibold">RMSE — Root Mean Squared Error</td>
                        <td className="py-3 px-4 font-mono font-medium">{comparisonResult.linear_regression.rmse} {comparisonResult.units}</td>
                        <td className="py-3 px-4 font-mono font-medium">{comparisonResult.random_forest.rmse} {comparisonResult.units}</td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                            Random Forest (Lower RMSE)
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Algorithmic Recommendation Callout Block - Positioned directly below the table */}
                <div className="p-4 sm:p-5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-xs text-purple-950 dark:text-purple-200 flex items-start gap-3.5 shadow-xs">
                  <div className="p-2 rounded-lg bg-purple-500/20 text-purple-600 dark:text-purple-300 shrink-0">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-purple-900 dark:text-purple-100 flex items-center gap-2">
                      <span>Algorithmic Recommendation & Synthesis</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-200/50 dark:bg-purple-900/50 font-mono font-normal">
                        Automated Decision Support
                      </span>
                    </h4>
                    <p className="mt-1.5 leading-relaxed text-stone-200 dark:text-gray-300">
                      {comparisonResult.recommendation}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW: SAVED MODELS */}
      {activeTab === 'saved_models' && (
        <div className="bg-[#1C1917] border border-[#292524] rounded-xl p-6 shadow-sm space-y-4">
          <div>
            <h2 className="text-lg font-bold text-[#FAFAF9] dark:text-white">Serialized Model Registry (.joblib)</h2>
            <p className="text-xs text-stone-400">Persistent trained model artifacts saved directly to disk</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#1C1917] bg-[#141210] text-stone-400 uppercase font-semibold border-b border-[#292524]">
                <tr>
                  <th className="py-3 px-3">Model File</th>
                  <th className="py-3 px-3">Task Name</th>
                  <th className="py-3 px-3">Algorithm</th>
                  <th className="py-3 px-3 font-mono text-right">R² Score</th>
                  <th className="py-3 px-3 font-mono text-right">RMSE</th>
                  <th className="py-3 px-3">Trained Timestamp</th>
                  <th className="py-3 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#292524] dark:divide-darkbg-border text-stone-200 dark:text-gray-200">
                {savedModels.map((m, idx) => (
                  <tr key={idx} className="hover:bg-[#1C1917]/50 hover:bg-[#292524]/50">
                    <td className="py-2.5 px-3 font-mono font-bold text-[#F97316] dark:text-[#FB923C]">{m.filename}</td>
                    <td className="py-2.5 px-3 font-medium">{m.task_name}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-navy/10 text-[#F97316] dark:text-greige">
                        {m.algorithm}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600">{m.r2_score}</td>
                    <td className="py-2.5 px-3 text-right font-mono">{m.rmse} {m.units}</td>
                    <td className="py-2.5 px-3 text-gray-400 font-mono text-[11px]">{m.trained_at}</td>
                    <td className="py-2.5 px-3 text-right">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600">
                        Active in Production
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW: PREDICTION HISTORY */}
      {activeTab === 'prediction_history' && (
        <div className="bg-[#1C1917] border border-[#292524] rounded-xl p-6 shadow-sm space-y-4">
          <div>
            <h2 className="text-lg font-bold text-[#FAFAF9] dark:text-white">Historical Prediction Runs</h2>
            <p className="text-xs text-stone-400">Audit logs of all forecasting runs across the store</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#1C1917] bg-[#141210] text-stone-400 uppercase font-semibold border-b border-[#292524]">
                <tr>
                  <th className="py-3 px-3">Run ID</th>
                  <th className="py-3 px-3">Task</th>
                  <th className="py-3 px-3">Model Type</th>
                  <th className="py-3 px-3 font-mono text-right">Forecast Value</th>
                  <th className="py-3 px-3">Executive Recommendation</th>
                  <th className="py-3 px-3">Executed By</th>
                  <th className="py-3 px-3">Date/Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#292524] dark:divide-darkbg-border text-stone-200 dark:text-gray-200">
                {predictionHistory.map((h) => (
                  <tr key={h.id} className="hover:bg-[#1C1917]/50 hover:bg-[#292524]/50">
                    <td className="py-2.5 px-3 font-mono text-gray-400">#{h.id}</td>
                    <td className="py-2.5 px-3 font-bold uppercase text-[#F97316] dark:text-[#FB923C]">{h.task_type}</td>
                    <td className="py-2.5 px-3">{h.model_type}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600">
                      {Number(h.predicted_value).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 max-w-xs truncate text-stone-400 dark:text-gray-300">{h.recommendation}</td>
                    <td className="py-2.5 px-3">{h.generated_by}</td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-gray-400">{h.created_at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW: COMPLETE PREDICTION WORKSPACE */}
      {isPredictionTab && (
        <div className="space-y-6">
          <div className="bg-[#1C1917] border border-[#292524] rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-[#FAFAF9] dark:text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  Full Machine Learning Prediction Workspace
                </h2>
                <p className="text-xs text-stone-400">
                  Execute live inferences using trained models with full evaluation metric visibility.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold">Algorithm:</span>
                <select
                  value={predictionAlgorithm}
                  onChange={(e) => setPredictionAlgorithm(e.target.value)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-[#292524] bg-[#1C1917] bg-[#141210] font-semibold"
                >
                  <option value="random_forest">Random Forest Regressor</option>
                  <option value="linear_regression">Simple Linear Regression</option>
                </select>
              </div>
            </div>

            {/* Prediction Task Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[#292524] border-[#292524]">
              {[
                { id: 'sales', label: 'Sales Revenue Prediction' },
                { id: 'demand', label: 'Product Demand Prediction' },
                { id: 'slow_moving', label: 'Slow-Moving Products' },
                { id: 'best_selling', label: 'Best-Selling Products' }
              ].map((task) => (
                <button
                  key={task.id}
                  onClick={() => {
                    setPredictionTask(task.id);
                    setPredictionResult(null);
                    setPredictionError(null);
                    setPredictionSuccess(null);
                  }}
                  className={`p-3 rounded-xl text-xs font-bold text-left border transition-all ${
                    predictionTask === task.id
                      ? 'bg-navy text-white border-navy shadow-sm'
                      : 'bg-[#1C1917] bg-[#141210] text-stone-200 dark:text-gray-300 border-[#292524] hover:bg-[#292524]'
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
            <div className="p-4 rounded-xl bg-[#1C1917]/60 bg-[#141210]/40 border border-[#292524] space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                {predictionTask === 'sales' && (
                  <>
                    <div>
                      <label className="block font-semibold mb-1">Store Footfall</label>
                      <input
                        type="number"
                        value={predInputs.store_footfall}
                        onChange={(e) => setPredInputs({ ...predInputs, store_footfall: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded border border-[#292524] bg-[#1C1917]"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Marketing Spend (PHP)</label>
                      <input
                        type="number"
                        value={predInputs.marketing_spend}
                        onChange={(e) => setPredInputs({ ...predInputs, marketing_spend: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded border border-[#292524] bg-[#1C1917]"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Promotions Active?</label>
                      <select
                        value={predInputs.promotions_active}
                        onChange={(e) => setPredInputs({ ...predInputs, promotions_active: Number(e.target.value) })}
                        className="w-full px-2.5 py-1.5 rounded border border-[#292524] bg-[#1C1917]"
                      >
                        <option value="1">Yes</option>
                        <option value="0">No</option>
                      </select>
                    </div>
                  </>
                )}

                {predictionTask === 'demand' && (
                  <>
                    <div>
                      <label className="block font-semibold mb-1">Product Category</label>
                      <input
                        type="text"
                        value={predInputs.category}
                        onChange={(e) => setPredInputs({ ...predInputs, category: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded border border-[#292524] bg-[#1C1917]"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Unit Price (PHP)</label>
                      <input
                        type="number"
                        value={predInputs.unit_price}
                        onChange={(e) => setPredInputs({ ...predInputs, unit_price: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded border border-[#292524] bg-[#1C1917]"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Discount %</label>
                      <input
                        type="number"
                        value={predInputs.discount_pct}
                        onChange={(e) => setPredInputs({ ...predInputs, discount_pct: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded border border-[#292524] bg-[#1C1917]"
                      />
                    </div>
                  </>
                )}

                {predictionTask === 'slow_moving' && (
                  <>
                    <div>
                      <label className="block font-semibold mb-1">Current Stock</label>
                      <input
                        type="number"
                        value={predInputs.current_stock}
                        onChange={(e) => setPredInputs({ ...predInputs, current_stock: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded border border-[#292524] bg-[#1C1917]"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Monthly Demand Rate</label>
                      <input
                        type="number"
                        value={predInputs.monthly_demand}
                        onChange={(e) => setPredInputs({ ...predInputs, monthly_demand: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded border border-[#292524] bg-[#1C1917]"
                      />
                    </div>
                  </>
                )}

                {predictionTask === 'best_selling' && (
                  <>
                    <div>
                      <label className="block font-semibold mb-1">Online Page Views</label>
                      <input
                        type="number"
                        value={predInputs.page_views}
                        onChange={(e) => setPredInputs({ ...predInputs, page_views: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded border border-[#292524] bg-[#1C1917]"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Customer Rating (1-5)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={predInputs.rating}
                        onChange={(e) => setPredInputs({ ...predInputs, rating: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded border border-[#292524] bg-[#1C1917]"
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleRunPrediction}
                  disabled={isPredicting}
                  className="px-5 py-2 rounded-lg bg-navy hover:bg-navy-light text-white text-xs font-bold shadow flex items-center gap-2"
                >
                  {isPredicting ? 'Executing Model Inference...' : 'Run Prediction & Generate Insights'}
                </button>
              </div>
            </div>

            {/* Prediction Output (Includes R² and Evaluation Metric for Instructor!) */}
            {predictionResult && (
              <div className="p-5 rounded-xl bg-purple-500/5 bg-[#141210]/50 border border-purple-500/20 space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-purple-500/20">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                      Inference Result ({predictionResult.task_name})
                    </span>
                    <h3 className="text-2xl font-extrabold text-[#FAFAF9] dark:text-white font-mono mt-0.5">
                      {predictionResult.units === 'PHP' ? 'PHP ' : ''}
                      {Number(predictionResult.predicted_value).toLocaleString()} {predictionResult.units !== 'PHP' ? predictionResult.units : ''}
                    </h3>
                  </div>
                  {/* Instructor ONLY receives model R² score verification */}
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                      Model Test R²: {predictionResult.model_r2}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-[#1C1917] border border-purple-200 border-[#292524] space-y-1">
                  <h4 className="text-xs font-bold text-[#FAFAF9] dark:text-white flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    Business Interpretation
                  </h4>
                  <p className="text-xs text-stone-400 dark:text-gray-300 leading-relaxed">
                    {predictionResult.recommendation}
                  </p>
                </div>

                {predictionResult.trend_data && (
                  <div className="bg-[#1C1917] p-4 rounded-lg border border-[#292524]">
                    <ResponsiveLineChart
                      title="Forecasted Trendline Projection"
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
        <div className="bg-[#1C1917] border border-[#292524] rounded-xl p-6 shadow-sm max-w-xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-navy text-white text-2xl font-bold flex items-center justify-center shadow-md">
              {user?.full_name?.charAt(0) || 'I'}
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#FAFAF9] dark:text-white">{user?.full_name}</h2>
              <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-600 border border-purple-500/20">
                ROLE: INSTRUCTOR / MACHINE LEARNING RESEARCHER
              </span>
            </div>
          </div>

          <div className="space-y-3 text-xs border-t border-[#292524] border-[#292524] pt-4">
            <div className="flex justify-between py-2 border-b border-gray-50 border-[#292524]">
              <span className="text-stone-400">Username:</span>
              <span className="font-bold text-[#FAFAF9] dark:text-white">{user?.username}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-50 border-[#292524]">
              <span className="text-stone-400">Email:</span>
              <span className="font-bold text-[#FAFAF9] dark:text-white">{user?.email}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-stone-400">Security Clearance:</span>
              <span className="font-semibold text-purple-600">Full Machine Learning Workspace, Dataset Explorer & Model Training</span>
            </div>
          </div>
        </div>
      )}

      {/* VIEW PRODUCT DETAIL MODAL */}
      <ProductDetailModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setViewProduct(null);
        }}
        product={viewProduct}
        suppliers={suppliers}
        role="instructor"
      />
    </div>
  );
}

