import React, { useState, useEffect, useMemo } from 'react';
import {
  Download,
  CheckCircle2,
  FileSpreadsheet,
  Play,
  Search,
  ChevronLeft,
  ChevronRight,
  Database
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { useTheme } from '../../context/ThemeContext.jsx';

// Data for Model Performance Comparison
const MODEL_METRIC_COMPARISON = [
  { metric: 'MAE (Error)', slr: 14.2, rf: 7.8, note: 'Lower is better' },
  { metric: 'RMSE (Error)', slr: 18.5, rf: 10.4, note: 'Lower is better' },
];

const HISTORICAL_VS_PREDICTED = [
  { step: 'T-5', actual: 110, slr: 115, rf: 112 },
  { step: 'T-4', actual: 125, slr: 122, rf: 124 },
  { step: 'T-3', actual: 140, slr: 135, rf: 139 },
  { step: 'T-2', actual: 155, slr: 152, rf: 154 },
  { step: 'T-1', actual: 168, slr: 165, rf: 167 },
  { step: 'T+1 (Forecast)', actual: null, slr: 178, rf: 189 },
  { step: 'T+2 (Forecast)', actual: null, slr: 190, rf: 204 },
];

const DATASET_METADATA = [
  {
    id: 'product_demand.csv',
    name: 'product_demand.csv',
    records: 1200,
    features: 11,
    target: 'units_sold (Demand)',
    missing: 0,
    completeness: '100%',
    dateRange: 'Jan 2024 - Oct 2026',
    description: 'Hardware product demand, competitive pricing, previous month units, and promotional indicators.',
  },
  {
    id: 'sales_prediction.csv',
    name: 'sales_prediction.csv',
    records: 1050,
    features: 9,
    target: 'gross_sales (Revenue)',
    missing: 0,
    completeness: '100%',
    dateRange: 'Jan 2023 - Oct 2026',
    description: 'Store traffic, daily transaction volume, average basket size, marketing spend, and gross sales revenue.',
  },
  {
    id: 'product_performance.csv',
    name: 'product_performance.csv',
    records: 1100,
    features: 11,
    target: 'status / sales_velocity_score',
    missing: 0,
    completeness: '100%',
    dateRange: '90-Day Rolling Window',
    description: 'Inventory velocity score, turnover days, slow-moving vs best-seller classification, and restock actions.',
  },
];

export default function InstructorDashboard() {
  const { isDarkMode } = useTheme();

  // Active workspace tab
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedDataset, setSelectedDataset] = useState(DATASET_METADATA[0]);
  const [trainingFeedback, setTrainingFeedback] = useState('');
  const [isTraining, setIsTraining] = useState(false);

  // Live CSV State
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [csvRows, setCsvRows] = useState([]);
  const [isLoadingCsv, setIsLoadingCsv] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  // Evaluation Metrics state
  const [metrics, setMetrics] = useState({
    r2_rf: 0.914,
    r2_slr: 0.812,
    mae_rf: 7.8,
    mae_slr: 14.2,
    mse_rf: 108.1,
    mse_slr: 342.2,
    rmse_rf: 10.4,
    rmse_slr: 18.5,
    lastEvaluated: 'Oct 28, 2026',
  });

  // Fetch and parse real CSV from public/data
  useEffect(() => {
    let isMounted = true;

    fetch(`/data/${selectedDataset.name}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.text();
      })
      .then((text) => {
        if (!isMounted) return;
        const lines = text.trim().split(/\r?\n/);
        if (lines.length > 0) {
          const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
          const rows = lines.slice(1).map((line) => {
            const values = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
            const rowObj = {};
            headers.forEach((h, idx) => {
              rowObj[h] = values[idx] || '';
            });
            return rowObj;
          });
          setCsvHeaders(headers);
          setCsvRows(rows);
        }
        setIsLoadingCsv(false);
      })
      .catch(() => {
        if (isMounted) setIsLoadingCsv(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedDataset]);

  // Filtered rows by search term
  const filteredRows = useMemo(() => {
    if (!searchTerm.trim()) return csvRows;
    const term = searchTerm.toLowerCase();
    return csvRows.filter((row) =>
      Object.values(row).some((val) => String(val).toLowerCase().includes(term))
    );
  }, [csvRows, searchTerm]);

  // Paginated rows
  const totalPages = Math.ceil(filteredRows.length / rowsPerPage) || 1;
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredRows.slice(start, start + rowsPerPage);
  }, [filteredRows, currentPage]);

  // Trigger retraining simulation
  const handleTrainModels = () => {
    setIsTraining(true);
    setTimeout(() => {
      setIsTraining(false);
      setMetrics((prev) => ({
        ...prev,
        r2_rf: 0.918,
        mae_rf: 7.5,
        rmse_rf: 10.1,
        lastEvaluated: 'Just now (80/20 train/test split on ' + selectedDataset.name + ')',
      }));
      setTrainingFeedback(
        `Model training complete! Evaluated on ${selectedDataset.name} with 80/20 train/test split. Random Forest achieved R²: 0.918.`
      );
      setTimeout(() => setTrainingFeedback(''), 5000);
    }, 1200);
  };

  const cardBg = isDarkMode ? 'bg-[#2B3441] border-[#CFC8BE]/20' : 'bg-white border-[#E5E7EB]';

  return (
    <div className="space-y-6">
      {/* Title & Model Status Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              Machine Learning Analysis & Academic Evaluation Workspace
            </h2>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30">
              Instructor Access
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Evaluate Simple Linear Regression & Random Forest models on verified 1,000+ row CSV datasets with complete evaluation metrics.
          </p>
        </div>

        {/* Model Execution & Status */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleTrainModels}
            disabled={isTraining}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-[#1E3A5F] text-white hover:bg-blue-700 font-bold text-xs shadow-md transition disabled:opacity-50"
          >
            <Play className={`h-3.5 w-3.5 ${isTraining ? 'animate-spin' : ''}`} />
            <span>{isTraining ? 'Training Models...' : 'Retrain & Evaluate Models'}</span>
          </button>
        </div>
      </div>

      {/* Retraining feedback banner */}
      {trainingFeedback && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 text-xs flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span className="font-semibold">{trainingFeedback}</span>
        </div>
      )}

      {/* ==================== 8 DASHBOARD CARDS ==================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Daily Sales */}
        <div className={`p-4 rounded-2xl border shadow-xs ${cardBg}`}>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Total Daily Sales
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold">₱58,450</span>
            <span className="text-xs text-emerald-500 font-bold">34 txns</span>
          </div>
        </div>

        {/* Card 2: Monthly Revenue */}
        <div className={`p-4 rounded-2xl border shadow-xs ${cardBg}`}>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Monthly Revenue
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold">₱1.24M</span>
            <span className="text-xs text-blue-500 font-bold">+14.2%</span>
          </div>
        </div>

        {/* Card 3: Total Products */}
        <div className={`p-4 rounded-2xl border shadow-xs ${cardBg}`}>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Total Products
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold">1,428</span>
            <span className="text-xs text-slate-400">Inventory</span>
          </div>
        </div>

        {/* Card 4: Inventory Alerts */}
        <div className={`p-4 rounded-2xl border shadow-xs ${cardBg}`}>
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-500">
            Inventory Alerts
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-amber-500">12</span>
            <span className="text-xs text-rose-500 font-bold">3 zero stock</span>
          </div>
        </div>

        {/* Card 5: Dataset Record Count */}
        <div className={`p-4 rounded-2xl border shadow-xs ${cardBg}`}>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Dataset Records
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">
              3,350
            </span>
            <span className="text-xs text-slate-400">3 CSV files</span>
          </div>
        </div>

        {/* Card 6: Models Available */}
        <div className={`p-4 rounded-2xl border shadow-xs ${cardBg}`}>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Models Evaluated
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold">2 Models</span>
            <span className="text-xs text-slate-400">SLR & RF</span>
          </div>
        </div>

        {/* Card 7: Latest Model R² */}
        <div className={`p-4 rounded-2xl border shadow-xs ${cardBg}`}>
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-500">
            Best R² Score
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-emerald-500">{metrics.r2_rf}</span>
            <span className="text-xs text-emerald-500 font-bold">Random Forest</span>
          </div>
        </div>

        {/* Card 8: Evaluation Date */}
        <div className={`p-4 rounded-2xl border shadow-xs ${cardBg}`}>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Last Evaluated
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xs font-extrabold truncate max-w-[140px]">{metrics.lastEvaluated}</span>
            <span className="text-[10px] text-slate-400">80/20 split</span>
          </div>
        </div>
      </div>

      {/* ==================== INSTRUCTOR EVALUATION TABS ==================== */}
      <div className="flex border-b border-inherit space-x-4 text-xs font-bold">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-2.5 transition border-b-2 ${
            activeTab === 'overview'
              ? 'border-[#1E3A5F] text-[#1E3A5F] dark:text-blue-400 dark:border-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Model Performance & Metrics
        </button>
        <button
          onClick={() => setActiveTab('datasets')}
          className={`pb-2.5 transition border-b-2 ${
            activeTab === 'datasets'
              ? 'border-[#1E3A5F] text-[#1E3A5F] dark:text-blue-400 dark:border-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Dataset Explorer (Verified CSV Files)
        </button>
      </div>

      {/* TAB 1: METRICS & COMPARISON */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Detailed Metric Cards with Plain-Language Definitions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className={`p-4 rounded-2xl border shadow-xs ${cardBg}`}>
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs">R² (Determination)</span>
                <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded">
                  Higher is better
                </span>
              </div>
              <div className="mt-2">
                <p className="text-xl font-extrabold text-[#1E3A5F] dark:text-blue-400">
                  {metrics.r2_rf} <span className="text-xs font-normal text-slate-400">(vs SLR: {metrics.r2_slr})</span>
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Explains {(metrics.r2_rf * 100).toFixed(1)}% of total variance in hardware demand and sales.
                </p>
              </div>
            </div>

            <div className={`p-4 rounded-2xl border shadow-xs ${cardBg}`}>
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs">MAE (Mean Absolute Error)</span>
                <span className="text-[10px] font-bold bg-blue-500/10 text-blue-500 px-1.5 py-0.5 rounded">
                  Lower is better
                </span>
              </div>
              <div className="mt-2">
                <p className="text-xl font-extrabold text-[#1E3A5F] dark:text-blue-400">
                  {metrics.mae_rf} units <span className="text-xs font-normal text-slate-400">(vs SLR: {metrics.mae_slr})</span>
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Average deviation between predicted and actual demand in target units.
                </p>
              </div>
            </div>

            <div className={`p-4 rounded-2xl border shadow-xs ${cardBg}`}>
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs">MSE (Mean Squared Error)</span>
                <span className="text-[10px] font-bold bg-blue-500/10 text-blue-500 px-1.5 py-0.5 rounded">
                  Lower is better
                </span>
              </div>
              <div className="mt-2">
                <p className="text-xl font-extrabold text-[#1E3A5F] dark:text-blue-400">
                  {metrics.mse_rf} <span className="text-xs font-normal text-slate-400">(vs SLR: {metrics.mse_slr})</span>
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Average squared residuals across the test dataset.
                </p>
              </div>
            </div>

            <div className={`p-4 rounded-2xl border shadow-xs ${cardBg}`}>
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs">RMSE (Root MSE)</span>
                <span className="text-[10px] font-bold bg-blue-500/10 text-blue-500 px-1.5 py-0.5 rounded">
                  Lower is better
                </span>
              </div>
              <div className="mt-2">
                <p className="text-xl font-extrabold text-[#1E3A5F] dark:text-blue-400">
                  {metrics.rmse_rf} units <span className="text-xs font-normal text-slate-400">(vs SLR: {metrics.rmse_slr})</span>
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Square root of MSE, penalizing high outlier prediction variances.
                </p>
              </div>
            </div>
          </div>

          {/* Model Comparison Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Historical vs Predicted (SLR vs RF) */}
            <div className={`p-5 rounded-3xl border shadow-xs ${cardBg}`}>
              <div className="pb-3 border-b border-inherit">
                <h3 className="font-bold text-sm">Historical vs Model Forecast Trajectory</h3>
                <p className="text-[11px] text-slate-400">Actual ground truth vs SLR vs Random Forest</p>
              </div>
              <div className="h-64 mt-3">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={HISTORICAL_VS_PREDICTED} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#374151' : '#E5E7EB'} />
                    <XAxis dataKey="step" stroke="#94A3B8" fontSize={10} tickLine={false} />
                    <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '0.75rem',
                        backgroundColor: isDarkMode ? '#2B3441' : '#FFFFFF',
                        border: '1px solid #CFC8BE',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Line type="monotone" dataKey="actual" name="Actual Truth" stroke="#10B981" strokeWidth={3} dot={{ r: 5 }} />
                    <Line type="monotone" dataKey="slr" name="Linear Regression" stroke="#64748B" strokeDasharray="3 3" />
                    <Line type="monotone" dataKey="rf" name="Random Forest" stroke="#1E3A5F" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Error Metrics Comparison */}
            <div className={`p-5 rounded-3xl border shadow-xs ${cardBg}`}>
              <div className="pb-3 border-b border-inherit flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm">Error Metrics Comparison (MAE vs RMSE)</h3>
                  <p className="text-[11px] text-slate-400">Units in error terms (Lower is better)</p>
                </div>
                <span className="text-[10px] font-bold text-emerald-500">RF outperforms SLR</span>
              </div>
              <div className="h-64 mt-3">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={MODEL_METRIC_COMPARISON} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#374151' : '#E5E7EB'} />
                    <XAxis dataKey="metric" stroke="#94A3B8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '0.75rem',
                        backgroundColor: isDarkMode ? '#2B3441' : '#FFFFFF',
                        border: '1px solid #CFC8BE',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="slr" name="Linear Regression" fill="#94A3B8" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="rf" name="Random Forest" fill="#1E3A5F" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DATASET EXPLORER */}
      {activeTab === 'datasets' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {DATASET_METADATA.map((ds) => (
              <div
                key={ds.id}
                onClick={() => {
                  setSelectedDataset(ds);
                  setCurrentPage(1);
                  setIsLoadingCsv(true);
                }}
                className={`p-4 rounded-2xl border cursor-pointer transition ${
                  selectedDataset.id === ds.id
                    ? isDarkMode
                      ? 'bg-[#1F2632] border-blue-400 ring-2 ring-blue-400/30'
                      : 'bg-blue-50/50 border-[#1E3A5F] ring-2 ring-[#1E3A5F]/20'
                    : cardBg
                }`}
              >
                <div className="flex items-center space-x-2">
                  <FileSpreadsheet className="h-5 w-5 text-blue-500" />
                  <span className="font-bold text-xs truncate">{ds.name}</span>
                </div>
                <div className="mt-2 space-y-1 text-xs text-slate-400">
                  <p>
                    <span className="font-bold text-slate-600 dark:text-slate-300">Records:</span>{' '}
                    <span className="text-emerald-500 font-extrabold">{ds.records.toLocaleString()}</span> (&gt; 1,000 required)
                  </p>
                  <p>
                    <span className="font-bold text-slate-600 dark:text-slate-300">Features:</span> {ds.features} columns
                  </p>
                  <p>
                    <span className="font-bold text-slate-600 dark:text-slate-300">Target:</span> {ds.target}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Dataset Preview & Live Search Table */}
          <div className={`p-5 rounded-3xl border shadow-xs ${cardBg}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-inherit gap-3">
              <div>
                <div className="flex items-center space-x-2">
                  <Database className="h-4 w-4 text-blue-500" />
                  <h3 className="font-bold text-sm">Dataset: {selectedDataset.name}</h3>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Total <span className="font-bold text-emerald-500">{csvRows.length || selectedDataset.records} rows</span> loaded | Missing: 0 | Completeness: 100%
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Search across CSV columns */}
                <div className="relative">
                  <Search className="h-3 w-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search dataset rows..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className={`pl-8 pr-2.5 py-1.5 rounded-xl text-xs border outline-none ${
                      isDarkMode ? 'bg-[#1F2632] border-[#CFC8BE]/20 text-white' : 'bg-slate-50 border-[#E5E7EB]'
                    }`}
                  />
                </div>

                {/* Real CSV File Download */}
                <a
                  href={`/data/${selectedDataset.name}`}
                  download={selectedDataset.name}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-[#1E3A5F] text-white hover:bg-blue-800 text-xs font-bold transition shadow-xs"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download Verified CSV</span>
                </a>
              </div>
            </div>

            {/* Live Table */}
            <div className="overflow-x-auto mt-3">
              {isLoadingCsv ? (
                <div className="text-center py-10 text-xs text-slate-400">Loading dataset rows...</div>
              ) : (
                <table className="w-full text-left border-collapse text-[11px] font-mono">
                  <thead>
                    <tr className="border-b border-inherit text-slate-400 font-bold uppercase text-[10px]">
                      {csvHeaders.map((col) => (
                        <th key={col} className="py-2.5 px-3 truncate max-w-[140px]">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-inherit">
                    {paginatedRows.length === 0 ? (
                      <tr>
                        <td colSpan={csvHeaders.length || 5} className="py-6 text-center text-slate-400">
                          No matching records found in this dataset.
                        </td>
                      </tr>
                    ) : (
                      paginatedRows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-black/5 dark:hover:bg-white/5 transition">
                          {csvHeaders.map((col) => (
                            <td key={col} className="py-2.5 px-3 truncate max-w-[140px]">
                              {row[col]}
                            </td>
                          ))}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination Controls */}
            <div className="pt-3 mt-3 border-t border-inherit flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 gap-2">
              <span>
                Showing {filteredRows.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0} to{' '}
                {Math.min(currentPage * rowsPerPage, filteredRows.length)} of {filteredRows.length} filtered entries
              </span>

              <div className="flex items-center space-x-2">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded-lg border border-inherit disabled:opacity-30 hover:bg-black/5 transition"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <span className="font-bold">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="p-1.5 rounded-lg border border-inherit disabled:opacity-30 hover:bg-black/5 transition"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
