import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Download,
  DollarSign,
  Package,
  Layers,
  AlertTriangle,
  Calendar,
  Building,
  RefreshCw,
  FileSpreadsheet,
  CheckCircle2,
  Receipt
} from 'lucide-react';
import StatCard from '../components/StatCard';
import { ResponsiveLineChart, ResponsiveBarChart, ResponsiveDonutChart } from '../components/Charts';
import { api } from '../api';

export default function ReportsAnalytics({ user }) {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'bestsellers', 'slowmoving', 'vat'
  const [dateRange, setDateRange] = useState('30d');

  const loadReports = async () => {
    setLoading(true);
    try {
      const res = await api.getReportsAnalytics();
      if (res.status === 'success') {
        setReportData(res.data);
      }
    } catch (err) {
      console.error('Error loading reports & analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  // CSV Export utility
  const exportToCSV = (filename, headers, rows) => {
    const csvContent = [
      headers.join(','),
      ...rows.map(row => 
        row.map(val => {
          const str = String(val === undefined || val === null ? '' : val);
          return `"${str.replace(/"/g, '""')}"`;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportSalesReport = () => {
    if (!reportData) return;
    const headers = ['Metric', 'Amount (PHP)'];
    const rows = [
      ['Today Sales', reportData.sales_summary?.daily_sales || 0],
      ['Past 7 Days Sales', reportData.sales_summary?.weekly_sales || 0],
      ['Past 30 Days Sales', reportData.sales_summary?.monthly_sales || 0],
      ['All-Time Total Sales', reportData.sales_summary?.total_sales_all_time || 0],
      ['Total Completed Orders', reportData.sales_summary?.total_orders || 0],
      ['Net Sales (Exclusive of VAT)', reportData.vat_summary?.net_sales || 0],
      ['12% Output VAT Collected', reportData.vat_summary?.vat_collected || 0],
      ['Gross Sales (Inclusive of VAT)', reportData.vat_summary?.gross_sales || 0]
    ];
    exportToCSV('TechAvenue_Sales_Summary', headers, rows);
  };

  const handleExportBestSellers = () => {
    if (!reportData || !reportData.best_sellers) return;
    const headers = ['Product ID', 'SKU', 'Product Name', 'Category', 'Units Sold', 'Total Revenue (PHP)'];
    const rows = reportData.best_sellers.map(item => [
      item.id,
      item.sku,
      item.name,
      item.category,
      item.units_sold,
      item.revenue
    ]);
    exportToCSV('TechAvenue_Best_Selling_Products', headers, rows);
  };

  const handleExportSlowMoving = () => {
    if (!reportData || !reportData.slow_moving) return;
    const headers = ['Product ID', 'SKU', 'Product Name', 'Category', 'Current Stock', 'Sold in Last 30 Days', 'Days Since Last Sale'];
    const rows = reportData.slow_moving.map(item => [
      item.id,
      item.sku,
      item.name,
      item.category,
      item.stock_quantity,
      item.units_sold_last_30d,
      item.days_since_last_sale
    ]);
    exportToCSV('TechAvenue_Slow_Moving_Inventory', headers, rows);
  };

  const handleExportValuation = () => {
    if (!reportData) return;
    const headers = ['Valuation Metric', 'PHP Value'];
    const rows = [
      ['Total Retail Inventory Value', reportData.inventory_valuation?.total_retail_value || 0],
      ['Estimated Inventory Cost Value', reportData.inventory_valuation?.total_cost_value || 0],
      ['Unrealized Profit Margin', reportData.inventory_valuation?.unrealized_margin || 0]
    ];
    exportToCSV('TechAvenue_Inventory_Valuation', headers, rows);
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-gray-500">
        <div className="animate-spin w-7 h-7 border-2 border-navy border-t-transparent rounded-full mx-auto mb-3"></div>
        Calculating business reports and sales ledger from MySQL...
      </div>
    );
  }

  const salesSummary = reportData?.sales_summary || {};
  const vatSummary = reportData?.vat_summary || {};
  const inventoryValuation = reportData?.inventory_valuation || {};

  return (
    <div className="p-6 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200 dark:border-darkbg-border">
        <div>
          <h1 className="text-2xl font-black text-navy dark:text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-navy dark:text-greige" />
            Executive Reports & Business Analytics
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Certified transactional reports, Philippine 12% Output VAT ledger, inventory valuation, and product turnover metrics.
          </p>
        </div>

        {/* Global CSV Export Dropdown / Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={loadReports}
            className="p-2 rounded-lg border border-gray-300 dark:border-darkbg-border bg-white dark:bg-darkbg-card text-gray-600 dark:text-gray-300 hover:bg-gray-100"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={handleExportSalesReport}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg border border-gray-300 dark:border-darkbg-border bg-white dark:bg-darkbg-card text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            Sales CSV
          </button>

          <button
            onClick={handleExportBestSellers}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg bg-navy hover:bg-navy-dark text-white dark:bg-greige dark:text-navy shadow-sm"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Best-Sellers CSV
          </button>
        </div>
      </div>

      {/* KPI Cards Row (6 Stat Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Past 30 Days Sales"
          value={`PHP ${(salesSummary.monthly_sales || 0).toLocaleString('en-US', { minimumFractionDigits: 0 })}`}
          subtitle="Monthly revenue run rate"
          icon={TrendingUp}
          badgeColor="green"
        />
        <StatCard
          title="Past 7 Days Sales"
          value={`PHP ${(salesSummary.weekly_sales || 0).toLocaleString('en-US', { minimumFractionDigits: 0 })}`}
          subtitle="Trailing weekly volume"
          icon={DollarSign}
          badgeColor="blue"
        />
        <StatCard
          title="Today Sales"
          value={`PHP ${(salesSummary.daily_sales || 0).toLocaleString('en-US', { minimumFractionDigits: 0 })}`}
          subtitle="Completed register sales"
          icon={Receipt}
          badgeColor="green"
        />
        <StatCard
          title="12% Output VAT"
          value={`PHP ${(vatSummary.vat_collected || 0).toLocaleString('en-US', { minimumFractionDigits: 0 })}`}
          subtitle="BIR output tax liability"
          icon={Receipt}
          badgeColor="blue"
        />
        <StatCard
          title="Stock Retail Valuation"
          value={`PHP ${(inventoryValuation.total_retail_value || 0).toLocaleString('en-US', { minimumFractionDigits: 0 })}`}
          subtitle="Total on-shelf inventory"
          icon={Package}
          badgeColor="amber"
        />
        <StatCard
          title="Unrealized Margin"
          value={`PHP ${(inventoryValuation.unrealized_margin || 0).toLocaleString('en-US', { minimumFractionDigits: 0 })}`}
          subtitle="Projected gross margin"
          icon={Layers}
          badgeColor="green"
        />
      </div>

      {/* Sub-Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-gray-200 dark:border-darkbg-border pb-3">
        {[
          { id: 'overview', label: 'Overview & Charts', icon: BarChart3 },
          { id: 'bestsellers', label: 'Best-Selling Products', icon: TrendingUp },
          { id: 'slowmoving', label: 'Slow-Moving Products', icon: AlertTriangle },
          { id: 'vat', label: '12% VAT Ledger & Valuation', icon: Receipt }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
                isActive
                  ? 'bg-navy text-white dark:bg-greige dark:text-navy shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-darkbg'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW & CHARTS */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Daily Sales Revenue Trend Line Chart */}
            <div className="lg:col-span-2 bg-white dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-border rounded-xl p-5 shadow-sm">
              <ResponsiveLineChart
                title="Historical Daily Sales Revenue (PHP)"
                data={reportData?.daily_sales_trend || []}
                xKey="day"
                yKey="sales"
                strokeColor="#1E3A5F"
              />
            </div>

            {/* Sales Distribution by Category Donut Chart */}
            <div className="bg-white dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-border rounded-xl p-5 shadow-sm">
              <ResponsiveDonutChart
                title="Sales Revenue by Category"
                data={reportData?.sales_by_category || []}
                valueKey="value"
                labelKey="name"
                centerLabel="Revenue"
              />
            </div>
          </div>

          {/* Supplier Spend Breakdown Bar Chart */}
          <div className="bg-white dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-border rounded-xl p-5 shadow-sm">
            <ResponsiveBarChart
              title="Purchasing Spend Volume by Supplier (PHP)"
              data={(reportData?.supplier_spend || []).map(s => ({
                supplier: s.supplier_name,
                spend: s.total_spend
              }))}
              xKey="supplier"
              yKey="spend"
              barColor="#10B981"
            />
          </div>
        </div>
      )}

      {/* TAB 2: BEST-SELLING PRODUCTS */}
      {activeTab === 'bestsellers' && (
        <div className="bg-white dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-border rounded-xl shadow-sm overflow-hidden space-y-4">
          <div className="p-4 border-b border-gray-200 dark:border-darkbg-border flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                Best-Selling Products by Revenue & Physical Units
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Aggregated from all completed sales transactions in MySQL.
              </p>
            </div>
            <button
              onClick={handleExportBestSellers}
              className="text-xs font-bold text-navy dark:text-greige hover:underline flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              Download CSV
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 dark:bg-darkbg text-gray-500 border-b border-gray-200 dark:border-darkbg-border">
                <tr>
                  <th className="py-3 px-4 font-semibold">Rank</th>
                  <th className="py-3 px-4 font-semibold">Product Description</th>
                  <th className="py-3 px-3 font-semibold">SKU</th>
                  <th className="py-3 px-3 font-semibold">Category</th>
                  <th className="py-3 px-3 font-semibold text-center">Units Sold</th>
                  <th className="py-3 px-4 font-semibold text-right">Total Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-darkbg-border">
                {(reportData?.best_sellers || []).length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-gray-400">
                      No sales recorded yet.
                    </td>
                  </tr>
                ) : (
                  (reportData?.best_sellers || []).map((p, idx) => (
                    <tr key={p.id} className="hover:bg-gray-50/80 dark:hover:bg-darkbg transition">
                      <td className="py-3 px-4 font-bold text-navy dark:text-greige">
                        #{idx + 1}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded bg-white dark:bg-darkbg border p-1 shrink-0 flex items-center justify-center">
                            <img
                              src={p.image_url || '/products/default.svg'}
                              alt={p.name}
                              className="max-h-full max-w-full object-contain"
                              onError={(e) => { e.target.src = '/products/default.svg'; }}
                            />
                          </div>
                          <span className="font-bold text-gray-900 dark:text-white">
                            {p.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono text-gray-500">{p.sku}</td>
                      <td className="py-3 px-3 text-gray-600 dark:text-gray-400">{p.category}</td>
                      <td className="py-3 px-3 text-center font-black text-green-600 dark:text-green-400">
                        {p.units_sold} units
                      </td>
                      <td className="py-3 px-4 text-right font-black text-gray-900 dark:text-white">
                        PHP {Number(p.revenue).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: SLOW-MOVING PRODUCTS */}
      {activeTab === 'slowmoving' && (
        <div className="bg-white dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-border rounded-xl shadow-sm overflow-hidden space-y-4">
          <div className="p-4 border-b border-gray-200 dark:border-darkbg-border flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Slow-Moving Products (Rule-Based Analysis)
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Items with substantial stock but low/zero sales velocity over the past 30 days. Consider price markdown or bundle promotions.
              </p>
            </div>
            <button
              onClick={handleExportSlowMoving}
              className="text-xs font-bold text-navy dark:text-greige hover:underline flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              Download CSV
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 dark:bg-darkbg text-gray-500 border-b border-gray-200 dark:border-darkbg-border">
                <tr>
                  <th className="py-3 px-4 font-semibold">Product Description</th>
                  <th className="py-3 px-3 font-semibold">SKU</th>
                  <th className="py-3 px-3 font-semibold">Category</th>
                  <th className="py-3 px-3 font-semibold text-center">Current Stock</th>
                  <th className="py-3 px-3 font-semibold text-center">Sold (Last 30 Days)</th>
                  <th className="py-3 px-3 font-semibold text-center">Days Inactive</th>
                  <th className="py-3 px-4 font-semibold text-right">Recommendation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-darkbg-border">
                {(reportData?.slow_moving || []).length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-gray-400">
                      No slow-moving products identified. Inventory turnover is optimal!
                    </td>
                  </tr>
                ) : (
                  (reportData?.slow_moving || []).map(p => (
                    <tr key={p.id} className="hover:bg-gray-50/80 dark:hover:bg-darkbg transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded bg-white dark:bg-darkbg border p-1 shrink-0 flex items-center justify-center">
                            <img
                              src={p.image_url || '/products/default.svg'}
                              alt={p.name}
                              className="max-h-full max-w-full object-contain"
                              onError={(e) => { e.target.src = '/products/default.svg'; }}
                            />
                          </div>
                          <span className="font-bold text-gray-900 dark:text-white">
                            {p.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono text-gray-500">{p.sku}</td>
                      <td className="py-3 px-3 text-gray-600 dark:text-gray-400">{p.category}</td>
                      <td className="py-3 px-3 text-center font-bold text-gray-800 dark:text-gray-200">
                        {p.stock_quantity} units
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-amber-600">
                        {p.units_sold_last_30d}
                      </td>
                      <td className="py-3 px-3 text-center text-gray-500">
                        {p.days_since_last_sale !== null ? `${p.days_since_last_sale} days` : 'No sales recorded'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                          {p.units_sold_last_30d === 0 ? 'Discount / Promo' : 'Monitor Stock'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: 12% VAT LEDGER & INVENTORY VALUATION */}
      {activeTab === 'vat' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* VAT Ledger */}
          <div className="bg-white dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-border rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-darkbg-border">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-navy dark:text-greige" />
                <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                  Philippine 12% Output VAT Breakdown
                </h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                BIR Standard 12%
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-gray-50 dark:bg-darkbg rounded-xl space-y-2 border border-gray-200 dark:border-darkbg-border">
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Gross Sales (VAT Inclusive)</span>
                  <span className="font-mono font-bold text-gray-900 dark:text-white">
                    PHP {Number(vatSummary.gross_sales || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Net Sales (VAT Exclusive / Taxable Base)</span>
                  <span className="font-mono font-bold text-gray-900 dark:text-white">
                    PHP {Number(vatSummary.net_sales || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="pt-2 border-t border-gray-200 dark:border-darkbg-border flex justify-between font-black text-sm text-blue-600 dark:text-blue-400">
                  <span>12% Output VAT Payable</span>
                  <span className="font-mono">
                    PHP {Number(vatSummary.vat_collected || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-gray-400 italic">
                * Note: Value-Added Tax (VAT) in the Republic of the Philippines is computed as Total Amount / 1.12 to determine the tax base, and the remaining 12% represents the Output Tax liability.
              </p>
            </div>
          </div>

          {/* Valuation Ledger */}
          <div className="bg-white dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-border rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-darkbg-border">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-navy dark:text-greige" />
                <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                  Inventory Valuation & Unrealized Margin
                </h3>
              </div>
              <button
                onClick={handleExportValuation}
                className="text-xs font-bold text-navy dark:text-greige hover:underline flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                CSV
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-gray-50 dark:bg-darkbg rounded-xl space-y-2 border border-gray-200 dark:border-darkbg-border">
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Total Retail Value (Selling Price × Stock)</span>
                  <span className="font-mono font-bold text-gray-900 dark:text-white">
                    PHP {Number(inventoryValuation.total_retail_value || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Total Inventory Acquisition Cost (Cost × Stock)</span>
                  <span className="font-mono font-bold text-gray-900 dark:text-white">
                    PHP {Number(inventoryValuation.total_cost_value || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="pt-2 border-t border-gray-200 dark:border-darkbg-border flex justify-between font-black text-sm text-green-600 dark:text-green-400">
                  <span>Unrealized Gross Margin</span>
                  <span className="font-mono">
                    PHP {Number(inventoryValuation.unrealized_margin || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-green-50 dark:bg-green-950/40 rounded-xl border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 text-[11px]">
                <p className="font-bold">Gross Margin Ratio:</p>
                <p className="mt-0.5">
                  {inventoryValuation.total_retail_value > 0 
                    ? `${((inventoryValuation.unrealized_margin / inventoryValuation.total_retail_value) * 100).toFixed(1)}% projected markup on physical store merchandise.`
                    : 'N/A'}
                </p>
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}

