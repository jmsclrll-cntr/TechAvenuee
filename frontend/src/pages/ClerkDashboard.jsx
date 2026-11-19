import React, { useState, useEffect } from 'react';
import {
  Package,
  Boxes,
  AlertTriangle,
  XCircle,
  RefreshCw,
  CircleDollarSign,
  Plus,
  Search,
  ArrowDownLeft,
  ArrowUpRight,
  Filter,
  CheckCircle2,
  Clock,
  Eye,
  Edit2,
  Trash2,
  Printer,
  X,
  Truck
} from 'lucide-react';
import StatCard from '../components/StatCard';
import { ResponsiveLineChart, ResponsiveBarChart, ResponsiveDonutChart } from '../components/Charts';
import Modal, { ConfirmDialog } from '../components/Modal';
import { api } from '../api';
import ProductDetailModal from '../components/ProductDetailModal';
import { printInventory } from '../utils/printInventory';
import { useNotification } from '../context/NotificationContext';
import { useThemeColor } from '../context/ThemeColorContext';

export default function ClerkDashboard({ activeTab, setActiveTab, user }) {
  const { currentTheme } = useThemeColor();
  const formatDateOnly = (dateStr) => {
    if (!dateStr) return '';
    try {
      // Handles MySQL datetime ('YYYY-MM-DD HH:mm:ss' or 'YYYY-MM-DDTHH:mm:ss') or date strings with GMT/timezone
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) {
        // Fallback: strip time or GMT if string formatted
        return String(dateStr).split(' ')[0].split('T')[0];
      }
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: '2-digit'
      });
    } catch {
      return String(dateStr).split(' ')[0].split('T')[0];
    }
  };

  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [movements, setMovements] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [movementTab, setMovementTab] = useState('stock_in'); // 'stock_in' | 'stock_out'
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewProduct, setViewProduct] = useState(null);
  const [isStockInModalOpen, setIsStockInModalOpen] = useState(false);
  const [isStockOutModalOpen, setIsStockOutModalOpen] = useState(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({});

  // Active item in action
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Forms
  const [newProduct, setNewProduct] = useState({
    sku: '', name: '', brand: '', category_id: 1, cost_price: '', selling_price: '', stock_quantity: 10, description: ''
  });
  const [productImageFile, setProductImageFile] = useState(null);
  const [productImagePreview, setProductImagePreview] = useState(null);
  const [editProduct, setEditProduct] = useState({});
  const [stockActionData, setStockActionData] = useState({ quantity: 1, supplier_id: '', notes: '', reason: '' });
  const [newSupplier, setNewSupplier] = useState({ name: '', contact_person: '', email: '', phone: '', address: '' });

  const { showSuccess, showError, showWarning } = useNotification();
  const [highlightedProductId, setHighlightedProductId] = useState(null);

  const showNotification = (msg, type = 'success') => {
    if (type === 'error') showError(msg);
    else if (type === 'warning') showWarning(msg);
    else showSuccess(msg);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, invRes, movRes, supRes] = await Promise.all([
        api.getDashboardStats('inventory_clerk'),
        api.getInventory({ search: searchTerm, category_id: categoryFilter, status: statusFilter }),
        api.getMovements(),
        api.getSuppliers()
      ]);

      if (statsRes.status === 'success') setStats(statsRes.data);
      if (invRes.status === 'success') {
        setProducts(invRes.products);
        setCategories(invRes.categories);
      }
      if (movRes.status === 'success') setMovements(movRes.movements);
      if (supRes.status === 'success') setSuppliers(supRes.suppliers);
    } catch (err) {
      console.error('Error loading inventory data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [searchTerm, categoryFilter, statusFilter]);

  // Handle Add Product
  const handleAddProduct = async (e) => {
    e.preventDefault();
    const qty = Number(newProduct.stock_quantity);
    if (qty > 100) {
      alert("Initial stock quantity cannot exceed the maximum limit of 100 units.");
      return;
    }
    if (qty < 0) {
      alert("Initial stock quantity cannot be negative.");
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
      showNotification(`Product ${newProduct.name} successfully created!`);
      setIsAddModalOpen(false);
      setNewProduct({ sku: '', name: '', brand: '', category_id: categories[0]?.id || 1, cost_price: '', selling_price: '', stock_quantity: 10, description: '' });
      setProductImageFile(null);
      setProductImagePreview(null);
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to add product');
    }
  };

  // Handle Edit Product (Clerk cannot change selling_price)
  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    try {
      const { reorder_level, ...payload } = editProduct;
      await api.updateProduct(editProduct.id, payload);
      showNotification(`Product ${editProduct.name} updated!`);
      setIsEditModalOpen(false);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  // Handle Delete Product
  const handleDeleteProduct = (product) => {
    const target = product || selectedProduct;
    if (!target) return;

    setConfirmConfig({
      title: 'Delete Product from Catalog',
      message: `Are you sure you want to permanently delete "${target.name}" (${target.sku})? This will remove all associated stock and transaction records.`,
      action: async () => {
        try {
          await api.deleteProduct(target.id);
          showNotification(`Product "${target.name}" deleted successfully!`);
          setIsConfirmOpen(false);
          setIsEditModalOpen(false);
          loadData();
        } catch (err) {
          alert(err.message || 'Failed to delete product');
        }
      },
      style: 'danger'
    });
    setIsConfirmOpen(true);
  };

  // Handle Stock In (Max 100 limit)
  const handleStockInSubmit = async () => {
    if (!selectedProduct || !stockActionData.quantity) return;
    const qty = Number(stockActionData.quantity);
    if (qty <= 0) {
      alert("Please enter a valid stock quantity.");
      return;
    }
    if (qty > 100) {
      alert("Stock entry cannot exceed the maximum limit of 100 units per operation.");
      return;
    }
    try {
      await api.stockIn({
        product_id: selectedProduct.id,
        quantity: qty,
        supplier_id: stockActionData.supplier_id || null,
        notes: stockActionData.notes || 'Restock batch delivery'
      });
      showNotification(`Received ${qty} units for ${selectedProduct.name}`);
      setIsStockInModalOpen(false);
      setIsConfirmOpen(false);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  // Handle Stock Out (Max 100 limit)
  const handleStockOutSubmit = async () => {
    if (!selectedProduct || !stockActionData.quantity) return;
    const qty = Number(stockActionData.quantity);
    if (qty <= 0) {
      alert("Please enter a valid deduction quantity.");
      return;
    }
    if (qty > 100) {
      alert("Stock reduction cannot exceed the maximum limit of 100 units per operation.");
      return;
    }
    try {
      await api.stockOut({
        product_id: selectedProduct.id,
        quantity: qty,
        reason: stockActionData.reason || 'Store inventory adjustment'
      });
      showNotification(`Processed stock out of ${qty} units for ${selectedProduct.name}`);
      setIsStockOutModalOpen(false);
      setIsConfirmOpen(false);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  // Add Supplier
  const handleAddSupplier = async (e) => {
    e.preventDefault();
    try {
      await api.addSupplier(newSupplier);
      showNotification(`Supplier ${newSupplier.name} added!`);
      setIsSupplierModalOpen(false);
      setNewSupplier({ name: '', contact_person: '', email: '', phone: '', address: '' });
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const getStatusBadge = (status, qty, threshold = 5) => {
    if (qty === 0 || status === 'out_of_stock') {
      return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-500/10 text-red-500 border border-red-500/20">Out of Stock</span>;
    }
    if (qty <= threshold || status === 'low_stock') {
      return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-[#FB923C] border border-amber-500/20">Low Stock</span>;
    }
    return (
      <span 
        className="px-2 py-0.5 rounded-full text-[11px] font-bold border transition-colors"
        style={{
          backgroundColor: 'var(--accent-glow)',
          color: 'var(--accent-light)',
          borderColor: 'var(--accent-border)'
        }}
      >
        In Stock
      </span>
    );
  };

  const cards = stats?.cards || {};
  const charts = stats?.charts || {};
  const tables = stats?.tables || {};

  return (
    <div className="p-4 sm:p-6 space-y-5 bg-[#141210] min-h-screen text-[#FAFAF9]">
      {/* VIEW: MAIN DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div className="space-y-5">
          {/* Top KPI Cards (Consolidated 3 Primary Metrics with Blended Fade Effect) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="bg-[#1C1917] border border-[#292524] rounded-xl p-4 shadow-sm hover:border-[var(--accent-border)] transition-all relative overflow-hidden group">
              <div 
                className="absolute inset-0 pointer-events-none rounded-xl"
                style={{ background: 'linear-gradient(to bottom right, rgba(0,0,0,0.7), rgba(28,25,23,0.5), var(--accent-glow))' }}
              />
              <div 
                className="absolute -right-8 -top-8 w-28 h-28 rounded-full blur-xl pointer-events-none"
                style={{ backgroundColor: 'var(--accent-glow)' }}
              />
              <div className="relative z-10 flex items-center justify-between">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Total Products</span>
                <Package className="w-4 h-4 group-hover:scale-110 transition-transform" style={{ color: 'var(--accent-primary)' }} />
              </div>
              <div className="relative z-10 my-2">
                <span className="text-2xl sm:text-3xl font-black font-mono text-[#FAFAF9]">{cards.total_products || 0}</span>
              </div>
              <p className="relative z-10 text-[11px] text-stone-400">Registered catalog items</p>
            </div>

            <div className="bg-[#1C1917] border border-[#292524] rounded-xl p-4 shadow-sm hover:border-amber-500/40 transition-all relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-[#1C1917]/50 to-amber-500/[0.08] pointer-events-none rounded-xl" />
              <div className="absolute -right-8 -top-8 w-28 h-28 rounded-full bg-amber-500/[0.08] blur-xl pointer-events-none" />
              <div className="relative z-10 flex items-center justify-between">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Pending Restocks</span>
                <RefreshCw className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
              </div>
              <div className="relative z-10 my-2 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black font-mono text-amber-400">{cards.pending_restocks || 0}</span>
                {Number(cards.pending_restocks || 0) > 0 && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">Reorder Alert</span>
                )}
              </div>
              <p className="relative z-10 text-[11px] text-stone-400">Items flagged for procurement</p>
            </div>

            <div className="bg-[#1C1917] border border-[#292524] rounded-xl p-4 shadow-sm hover:border-[var(--accent-border)] transition-all relative overflow-hidden group">
              <div 
                className="absolute inset-0 pointer-events-none rounded-xl"
                style={{ background: 'linear-gradient(to bottom right, rgba(0,0,0,0.7), rgba(28,25,23,0.5), var(--accent-glow))' }}
              />
              <div 
                className="absolute -right-8 -top-8 w-28 h-28 rounded-full blur-xl pointer-events-none"
                style={{ backgroundColor: 'var(--accent-glow)' }}
              />
              <div className="relative z-10 flex items-center justify-between">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Inventory Value</span>
                <CircleDollarSign className="w-4 h-4 group-hover:scale-110 transition-transform" style={{ color: 'var(--accent-primary)' }} />
              </div>
              <div className="relative z-10 my-2">
                <span className="text-xl sm:text-2xl font-black font-mono text-[#FAFAF9]">
                  PHP {(cards.inventory_value || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <p className="relative z-10 text-[11px] text-stone-400">Total asset cost basis</p>
            </div>
          </div>

          {/* Charts & Ratio Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-stretch">
            {/* Left 7 cols: Category Distribution Bar Chart */}
            <div className="lg:col-span-7 bg-[#1C1917] border border-[#292524] rounded-xl p-4 sm:p-5 shadow-sm hover:border-[var(--accent-border)] transition-colors flex flex-col justify-between relative overflow-hidden">
              <div 
                className="absolute inset-0 pointer-events-none rounded-xl"
                style={{ background: 'linear-gradient(to bottom right, rgba(0,0,0,0.7), rgba(28,25,23,0.5), var(--accent-glow))' }}
              />
              <div 
                className="absolute -right-8 -top-8 w-32 h-32 rounded-full blur-xl pointer-events-none"
                style={{ backgroundColor: 'var(--accent-glow)' }}
              />
              <div className="relative z-10 flex-1 flex flex-col justify-between">
                <ResponsiveBarChart
                  title="Stock Distribution by Category"
                  data={charts.category_distribution || []}
                  xKey="name"
                  yKey="count"
                />
              </div>
            </div>

            {/* Right 5 cols: Donut Chart + Transferred Single Box below for Units in Stock, Low Stock, Out of Stock */}
            <div className="lg:col-span-5 flex flex-col justify-between gap-3.5">
              {/* Low-Stock vs In-Stock Ratio Donut */}
              <div className="flex-1 bg-[#1C1917] border border-[#292524] rounded-xl p-4 shadow-sm hover:border-[var(--accent-border)] transition-colors relative overflow-hidden">
                <div 
                  className="absolute inset-0 pointer-events-none rounded-xl"
                  style={{ background: 'linear-gradient(to bottom right, rgba(0,0,0,0.7), rgba(28,25,23,0.5), var(--accent-glow))' }}
                />
                <div 
                  className="absolute -right-8 -top-8 w-32 h-32 rounded-full blur-xl pointer-events-none"
                  style={{ backgroundColor: 'var(--accent-glow)' }}
                />
                <div className="relative z-10">
                  <ResponsiveDonutChart
                    title="Low-Stock vs In-Stock Ratio"
                    data={(charts.stock_status || []).map((item) => {
                      let color = currentTheme.primary;
                      if (item.status === 'Low Stock') color = '#FB923C';
                      if (item.status === 'Out of Stock') color = '#EF4444';
                      return { ...item, color };
                    })}
                    valueKey="count"
                    labelKey="status"
                    centerLabel="Products"
                  />
                </div>
              </div>

              {/* Single Consolidated Box Transferred from Top Row */}
              <div className="bg-[#1C1917] border border-[#292524] rounded-xl p-3.5 shadow-sm relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-[#1C1917]/50 to-white/[0.08] pointer-events-none rounded-xl" />
                <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/[0.08] blur-xl pointer-events-none" />
                
                <div className="relative z-10 grid grid-cols-3 gap-2 divide-x divide-[#292524]">
                  {/* Units in Stock */}
                  <div className="px-2 first:pl-0 text-center sm:text-left">
                    <div className="flex items-center gap-1.5 justify-center sm:justify-start">
                      <Boxes className="w-3.5 h-3.5" style={{ color: 'var(--accent-primary)' }} />
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">In Stock</span>
                    </div>
                    <p className="text-xl font-bold font-mono text-[#FAFAF9] mt-1">{cards.total_units_in_stock || 0}</p>
                    <span className="text-[10px] text-stone-400">Physical units count</span>
                  </div>

                  {/* Low-Stock Items */}
                  <div className="px-2 text-center sm:text-left">
                    <div className="flex items-center gap-1.5 justify-center sm:justify-start">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Low Stock</span>
                    </div>
                    <div className="flex items-baseline gap-1 mt-1 justify-center sm:justify-start">
                      <p className="text-xl font-bold font-mono text-amber-400">{cards.low_stock_products || 0}</p>
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">Warning</span>
                    </div>
                    <span className="text-[10px] text-stone-400">At/below threshold</span>
                  </div>

                  {/* Out of Stock */}
                  <div className="px-2 last:pr-0 text-center sm:text-left">
                    <div className="flex items-center gap-1.5 justify-center sm:justify-start">
                      <XCircle className="w-3.5 h-3.5 text-rose-500" />
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Out of Stock</span>
                    </div>
                    <div className="flex items-baseline gap-1 mt-1 justify-center sm:justify-start">
                      <p className="text-xl font-bold font-mono text-rose-400">{cards.out_of_stock_products || 0}</p>
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">Urgent</span>
                    </div>
                    <span className="text-[10px] text-stone-400">Zero inventory</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tables Row: Low-Stock Alerts & Recent Inventory Movements */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
            {/* Low-Stock Alerts Table */}
            <div className="bg-[#1C1917] border border-[#292524] rounded-xl p-4 sm:p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-[#292524]">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <h3 className="font-bold text-sm text-[#FAFAF9]">Low-Stock Alerts</h3>
                </div>
                <button
                  onClick={() => {
                    setStatusFilter('low_stock');
                    setActiveTab('inventory');
                  }}
                  className="text-xs hover:underline font-semibold"
                  style={{ color: 'var(--accent-primary)' }}
                >
                  View in Inventory
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#141210] text-stone-300 uppercase font-extrabold border-b border-[#292524]">
                    <tr>
                      <th className="py-2.5 px-3">SKU</th>
                      <th className="py-2.5 px-3">Product Name</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">Current</th>
                      <th className="py-2.5 px-3">Threshold</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#292524] text-stone-300">
                    {(tables.low_stock_alerts || []).slice(0, 5).map((prod) => (
                      <tr key={prod.id} className="hover:bg-[#292524]/60 transition-colors">
                        <td className="py-2 px-3 font-mono font-medium" style={{ color: 'var(--accent-primary)' }}>{prod.sku}</td>
                        <td className="py-2 px-3 font-medium truncate max-w-[140px] text-[#FAFAF9]">{prod.name}</td>
                        <td className="py-2 px-3 text-stone-400">{prod.category}</td>
                        <td className="py-2 px-3 font-bold text-red-400">{prod.current_stock}</td>
                        <td className="py-2 px-3 text-stone-400 font-mono text-[11px]">≤ 5 units</td>
                        <td className="py-2 px-3">{getStatusBadge(prod.status, prod.current_stock)}</td>
                        <td className="py-2 px-3 text-right">
                          <button
                            onClick={() => {
                              setSelectedProduct(prod);
                              setStockActionData({ quantity: 10, supplier_id: '', notes: 'Urgent low-stock restock' });
                              setIsStockInModalOpen(true);
                            }}
                            style={{ backgroundColor: 'var(--accent-primary)' }}
                            className="px-2.5 py-1 rounded-lg text-white text-[10px] font-bold hover:opacity-90 transition-opacity"
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

            {/* Recent Inventory Movements Table */}
            <div className="bg-[#1C1917] border border-[#292524] rounded-xl p-4 sm:p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-[#292524]">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                  <h3 className="font-bold text-sm text-[#FAFAF9]">Recent Inventory Movements</h3>
                </div>
                <button
                  onClick={() => setActiveTab('movements')}
                  className="text-xs hover:underline font-semibold"
                  style={{ color: 'var(--accent-primary)' }}
                >
                  View Movement Log
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#141210] text-stone-300 uppercase font-extrabold border-b border-[#292524]">
                    <tr>
                      <th className="py-2.5 px-3">Ref #</th>
                      <th className="py-2.5 px-3">Product</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Qty</th>
                      <th className="py-2.5 px-3">Date/Time</th>
                      <th className="py-2.5 px-3">Processed By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#292524] text-stone-300">
                    {(tables.recent_movements || []).slice(0, 5).map((m, idx) => (
                      <tr key={idx} className="hover:bg-[#292524]/60 transition-colors">
                        <td className="py-2 px-3 font-mono font-medium text-[11px] text-stone-400">{m.reference_number}</td>
                        <td className="py-2 px-3 font-medium truncate max-w-[130px] text-[#FAFAF9]">{m.product_name}</td>
                        <td className="py-2 px-3">
                          <span 
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${m.movement_type === 'stock_in'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : m.movement_type === 'stock_out'
                                ? 'bg-red-500/10 text-red-400'
                                : ''
                            }`}
                            style={m.movement_type !== 'stock_in' && m.movement_type !== 'stock_out' ? {
                              backgroundColor: 'var(--accent-glow)',
                              color: 'var(--accent-light)',
                              border: '1px solid var(--accent-border)'
                            } : undefined}
                          >
                            {m.movement_type.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-bold text-[#FAFAF9]">{m.quantity > 0 ? `+${m.quantity}` : m.quantity}</td>
                        <td className="py-2 px-3 text-[11px] text-stone-400">{m.created_at?.substring(0, 16)}</td>
                        <td className="py-2 px-3 text-stone-300 truncate max-w-[100px]">{m.processed_by}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: INVENTORY / CATALOG TABLE */}
      {activeTab === 'inventory' && (
        <div className="bg-[#1C1917] border border-[#292524] rounded-xl p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-[#292524]">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-[#FAFAF9]">
                Product Inventory Management
              </h2>
              <p className="text-xs text-stone-400">
                Full warehouse and showroom product catalog & administrative inventory control
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => printInventory({ products, suppliers, user })}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#292524] hover:bg-[#342F2D] text-stone-200 hover:text-white border border-[#44403C] text-xs font-bold shadow-sm transition-all cursor-pointer active:scale-95"
                title="Print all inventory products with full specifications and supplier details"
              >
                <Printer className="w-4 h-4 text-[#FB923C]" />
                <span>Print All Products (PDF / Print)</span>
              </button>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                style={{ backgroundColor: 'var(--accent-primary)', boxShadow: '0 4px 14px var(--accent-glow)' }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-xs font-bold transition-all cursor-pointer active:scale-95 hover:opacity-90"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Product</span>
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
              <input
                type="text"
                placeholder="Search by SKU, Name, or Brand..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs pl-9 pr-8 py-2 rounded-lg border border-[#292524] bg-[#141210] text-[#FAFAF9] placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-2.5 text-stone-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs px-3 py-2 rounded-lg border border-[#292524] bg-[#141210] text-[#FAFAF9] focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs px-3 py-2 rounded-lg border border-[#292524] bg-[#141210] text-[#FAFAF9] focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]"
            >
              <option value="">All Stock Statuses</option>
              <option value="in_stock">In Stock</option>
              <option value="low_stock">Low Stock</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>
          </div>

          {/* Result Counter & Active Filter Badge */}
          <div className="flex items-center justify-between text-xs text-stone-400 px-0.5">
            <div className="flex items-center gap-2">
              <span>Showing <strong className="text-[#FB923C]">{products.length}</strong> catalog items</span>
              {(searchTerm || categoryFilter || statusFilter) && (
                <button
                  type="button"
                  onClick={() => { setSearchTerm(''); setCategoryFilter(''); setStatusFilter(''); }}
                  className="inline-flex items-center gap-1 text-[11px] text-stone-400 hover:text-red-400 font-semibold px-2 py-0.5 rounded bg-[#141210] border border-[#292524]"
                >
                  Clear Filters <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Products Table with Complete Management Actions */}
          <div className="overflow-x-auto rounded-lg border border-[#292524]">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#141210] text-stone-300 uppercase font-extrabold text-[11px] tracking-wide border-b border-[#292524]">
                <tr>
                  <th className="py-3 px-3">SKU</th>
                  <th className="py-3 px-3">Product Name</th>
                  <th className="py-3 px-3">Brand</th>
                  <th className="py-3 px-3 text-right">Cost (PHP)</th>
                  <th className="py-3 px-3 text-right">Retail (PHP)</th>
                  <th className="py-3 px-3 text-center">Margin</th>
                  <th className="py-3 px-3 text-center">Stock</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#292524] text-stone-200">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="py-8 text-center text-stone-400 text-xs">
                      No matching products found in warehouse catalog.
                    </td>
                  </tr>
                ) : (
                  products.map((p) => {
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
                        className="hover:bg-[#292524]/70 transition-colors cursor-pointer group"
                        title="Click to view full product & supplier specifications"
                      >
                        <td className="py-2.5 px-3 font-mono font-bold group-hover:underline" style={{ color: 'var(--accent-primary)' }}>{p.sku}</td>
                        <td className="py-2.5 px-3 font-medium">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-[#141210] border border-[#292524] p-1 shrink-0 flex items-center justify-center overflow-hidden">
                              <img
                                src={p.image_url || '/products/desktop.svg'}
                                alt={p.name}
                                className="max-h-full max-w-full object-contain"
                                onError={(e) => { e.target.src = '/products/desktop.svg'; }}
                              />
                            </div>
                            <span className="transition-colors font-bold text-[#FAFAF9]" style={{ color: undefined }}>{p.name}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-stone-300">{p.brand}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-stone-300">
                          PHP {cost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-white">
                          PHP {retail.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-white/10 text-white border border-white/20">
                            +{marginPct}%
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold">
                          <span className={(p.stock_quantity <= 5 || p.status === 'low_stock' || p.status === 'out_of_stock') ? 'text-red-400 font-extrabold' : 'text-emerald-400'}>
                            {p.stock_quantity}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">{getStatusBadge(p.status, p.stock_quantity)}</td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => {
                                setEditProduct(p);
                                setIsEditModalOpen(true);
                              }}
                              style={{ backgroundColor: 'var(--accent-primary)' }}
                              className="px-2.5 py-1 rounded-lg text-white text-[11px] font-semibold hover:opacity-90 inline-flex items-center gap-1 transition-opacity cursor-pointer"
                              title="Edit product details & pricing"
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteProduct(p)}
                              className="px-2.5 py-1 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-[11px] font-semibold inline-flex items-center gap-1 transition-colors border border-red-500/20 cursor-pointer"
                              title="Delete product from catalog"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW: STOCK IN / RESTOCKING TAB */}
      {activeTab === 'stock_in' && (
        <div className="bg-[#1C1917] border border-[#292524] rounded-xl p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#292524]">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-[#FAFAF9]">Stock In / Restocking Console</h2>
              <p className="text-xs text-stone-400">Receive warehouse deliveries, purchase orders, and supplier shipments</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {products.map((p) => (
              <div key={p.id} className={`p-4 rounded-xl border hover:shadow-md transition-all duration-300 bg-[#141210] flex flex-col justify-between ${highlightedProductId === p.id
                  ? 'border-[var(--accent-primary)] ring-2 ring-[var(--accent-primary)]/60 shadow-lg scale-[1.01]'
                  : 'border-[#292524] hover:border-[var(--accent-border)]'
                }`}>
                <div>
                  <div className="flex items-start justify-between">
                    <span className="font-mono text-xs font-bold" style={{ color: 'var(--accent-primary)' }}>{p.sku}</span>
                    {getStatusBadge(p.status, p.stock_quantity)}
                  </div>
                  <h4 className="font-semibold text-sm mt-1 text-[#FAFAF9] line-clamp-1">{p.name}</h4>
                  <p className="text-xs text-stone-400 mt-1">{p.brand} • {p.category_name}</p>
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="text-stone-400">Current Stock:</span>
                    <span className="font-bold text-[#FAFAF9]">{p.stock_quantity} units</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedProduct(p);
                    setStockActionData({ quantity: 10, supplier_id: '', notes: 'Shipment restock' });
                    setIsStockInModalOpen(true);
                  }}
                  style={{ backgroundColor: 'var(--accent-primary)', boxShadow: '0 4px 14px var(--accent-glow)' }}
                  className="mt-4 w-full py-2 rounded-lg text-white text-xs font-semibold transition-all hover:opacity-90 flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <ArrowDownLeft className="w-4 h-4" />
                  Receive Restock Batch
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW: STOCK OUT TAB */}
      {activeTab === 'stock_out' && (
        <div className="bg-[#1C1917] border border-[#292524] rounded-xl p-5 sm:p-6 shadow-sm space-y-4">
          <div className="pb-3 border-b border-[#292524]">
            <h2 className="text-lg sm:text-xl font-bold text-[#FAFAF9]">Authorized Stock-Out Console</h2>
            <p className="text-xs text-stone-400">Process non-sale stock reductions: damaged units, RMA returns, display models, or inter-branch transfers</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {products.filter(p => p.stock_quantity > 0).map((p) => (
              <div key={p.id} className={`p-4 rounded-xl border hover:shadow-md transition-all duration-300 bg-[#141210] flex flex-col justify-between ${highlightedProductId === p.id
                  ? 'border-red-500 ring-2 ring-red-500/60 shadow-lg shadow-red-950/40 scale-[1.01]'
                  : 'border-[#292524] hover:border-red-500/40'
                }`}>
                <div>
                  <div className="flex items-start justify-between">
                    <span className="font-mono text-xs font-bold" style={{ color: 'var(--accent-primary)' }}>{p.sku}</span>
                    <span className="text-xs font-bold text-emerald-400">{p.stock_quantity} available</span>
                  </div>
                  <h4 className="font-semibold text-sm mt-1 text-[#FAFAF9] line-clamp-1">{p.name}</h4>
                  <p className="text-xs text-stone-400 mt-1">{p.brand} • {p.category_name}</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedProduct(p);
                    setStockActionData({ quantity: 1, reason: 'Damaged in transit' });
                    setIsStockOutModalOpen(true);
                  }}
                  className="mt-4 w-full py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <ArrowUpRight className="w-4 h-4" />
                  Record Stock-Out
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW: STOCK MOVEMENT HISTORY */}
      {activeTab === 'movements' && (
        <div className="space-y-4">
          {/* Top Header & Tab Switching Buttons */}
          <div className="bg-[#1C1917] border border-[#292524] rounded-xl p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-[#FAFAF9]">Stock Movement Audit Trail</h2>
              <p className="text-xs text-stone-400">
                Track incoming stock replenishments and inventory deductions across the warehouse
              </p>
            </div>

            {/* Toggle Buttons */}
            <div className="inline-flex p-1 rounded-xl bg-[#141210] border border-[#292524] text-xs font-bold">
              <button
                type="button"
                onClick={() => setMovementTab('stock_in')}
                style={movementTab === 'stock_in' ? { backgroundColor: 'var(--accent-primary)' } : undefined}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg transition-all ${movementTab === 'stock_in'
                    ? 'text-white shadow-sm'
                    : 'text-stone-400 hover:text-white'
                  }`}
              >
                <ArrowDownLeft className="w-4 h-4" />
                <span>Stock In History</span>
                <span className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full ${movementTab === 'stock_in' ? 'bg-white/20 text-white' : 'bg-[#292524] text-stone-400'
                  }`}>
                  {movements.filter(m => m.movement_type === 'stock_in' || m.quantity > 0).length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setMovementTab('stock_out')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg transition-all ${movementTab === 'stock_out'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-stone-400 hover:text-white'
                  }`}
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>Stock Out History</span>
                <span className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full ${movementTab === 'stock_out' ? 'bg-white/20 text-white' : 'bg-[#292524] text-stone-400'
                  }`}>
                  {movements.filter(m => m.movement_type === 'stock_out' || m.movement_type === 'sale' || m.quantity < 0).length}
                </span>
              </button>
            </div>
          </div>

          {/* Conditional View: Table 1 (Stock In History) */}
          {movementTab === 'stock_in' && (
            <div className="bg-[#1C1917] border border-[#292524] rounded-xl p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-2.5 border-b border-[#292524]">
                <div className="flex items-center gap-2">
                  <div 
                    className="p-1.5 rounded-lg"
                    style={{ backgroundColor: 'var(--accent-glow)', color: 'var(--accent-primary)' }}
                  >
                    <ArrowDownLeft className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#FAFAF9]">Stock In History</h3>
                    <p className="text-xs text-stone-400">Restocking and warehouse receiving entries</p>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto rounded-lg border border-[#292524]">
                <table className="w-full table-fixed text-center text-xs">
                  <colgroup>
                    <col className="w-[28%]" />
                    <col className="w-[18%]" />
                    <col className="w-[20%]" />
                    <col className="w-[18%]" />
                    <col className="w-[16%]" />
                  </colgroup>
                  <thead className="bg-[#141210] text-stone-300 uppercase font-bold text-xs sm:text-sm tracking-wide border-b border-[#292524]">
                    <tr>
                      <th className="py-3 px-3 text-center align-middle">Product Name</th>
                      <th className="py-3 px-3 text-center align-middle">Quantity Received</th>
                      <th className="py-3 px-3 text-center align-middle">Supplier</th>
                      <th className="py-3 px-3 text-center align-middle">Date</th>
                      <th className="py-3 px-3 text-center align-middle">Processed By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#292524] text-stone-200">
                    {movements.filter(m => m.movement_type === 'stock_in' || m.quantity > 0).length === 0 ? (
                      <tr>
                        <td colSpan="5" className="py-8 text-center align-middle text-stone-400 text-xs">
                          No restocking or receiving entries recorded yet.
                        </td>
                      </tr>
                    ) : (
                      movements.filter(m => m.movement_type === 'stock_in' || m.quantity > 0).map((m, idx) => (
                        <tr key={m.id} className="hover:bg-[#292524]/60 transition-colors">
                          <td className="py-3 px-3 text-center align-middle text-xs font-medium text-[#FAFAF9] truncate" title={m.product_name}>
                            {m.product_name}
                          </td>
                          <td className="py-3 px-3 text-center align-middle text-xs font-bold text-emerald-400">
                            +{Math.abs(m.quantity)}
                          </td>
                          <td className="py-3 px-3 text-center align-middle text-xs text-stone-300 truncate" title={m.supplier_name || 'Authorized Supplier'}>
                            {m.supplier_name || 'Authorized Supplier'}
                          </td>
                          <td className="py-3 px-3 text-center align-middle text-xs text-stone-400 whitespace-nowrap">
                            {formatDateOnly(m.created_at)}
                          </td>
                          <td className="py-3 px-3 text-center align-middle text-xs text-stone-300 truncate" title={m.processed_by}>
                            {m.processed_by}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Conditional View: Table 2 (Stock Out History) */}
          {movementTab === 'stock_out' && (
            <div className="bg-[#1C1917] border border-[#292524] rounded-xl p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-2.5 border-b border-[#292524]">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-red-500/10 text-red-400">
                    <ArrowUpRight className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#FAFAF9]">Stock Out History</h3>
                    <p className="text-xs text-stone-400">Warehouse item reductions and stock disbursements</p>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto rounded-lg border border-[#292524]">
                <table className="w-full table-fixed text-center text-xs">
                  <colgroup>
                    <col className="w-[28%]" />
                    <col className="w-[18%]" />
                    <col className="w-[20%]" />
                    <col className="w-[18%]" />
                    <col className="w-[16%]" />
                  </colgroup>
                  <thead className="bg-[#141210] text-stone-300 uppercase font-bold text-xs sm:text-sm tracking-wide border-b border-[#292524]">
                    <tr>
                      <th className="py-3 px-3 text-center align-middle">Product Name</th>
                      <th className="py-3 px-3 text-center align-middle">Quantity Reduced</th>
                      <th className="py-3 px-3 text-center align-middle">Supplier</th>
                      <th className="py-3 px-3 text-center align-middle">Date</th>
                      <th className="py-3 px-3 text-center align-middle">Processed By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#292524] text-stone-200">
                    {movements.filter(m => m.movement_type === 'stock_out' || m.movement_type === 'sale' || m.quantity < 0).length === 0 ? (
                      <tr>
                        <td colSpan="5" className="py-8 text-center align-middle text-stone-400 text-xs">
                          No stock reduction entries recorded yet.
                        </td>
                      </tr>
                    ) : (
                      movements.filter(m => m.movement_type === 'stock_out' || m.movement_type === 'sale' || m.quantity < 0).map((m, idx) => (
                        <tr key={m.id} className="hover:bg-[#292524]/60 transition-colors">
                          <td className="py-3 px-3 text-center align-middle text-xs font-medium text-[#FAFAF9] truncate" title={m.product_name}>
                            {m.product_name}
                          </td>
                          <td className="py-3 px-3 text-center align-middle text-xs font-bold text-red-400">
                            -{Math.abs(m.quantity)}
                          </td>
                          <td className="py-3 px-3 text-center align-middle text-xs text-stone-300 truncate" title={m.supplier_name || 'Authorized Supplier'}>
                            {m.supplier_name || 'Authorized Supplier'}
                          </td>
                          <td className="py-3 px-3 text-center align-middle text-xs text-stone-400 whitespace-nowrap">
                            {formatDateOnly(m.created_at)}
                          </td>
                          <td className="py-3 px-3 text-center align-middle text-xs text-stone-300 truncate" title={m.processed_by}>
                            {m.processed_by}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW: SUPPLIERS TAB */}
      {activeTab === 'suppliers' && (
        <div className="bg-[#1C1917] border border-[#292524] rounded-xl p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#292524]">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-[#FAFAF9]">Authorized Supplier Management</h2>
              <p className="text-xs text-stone-400">Authorized hardware distributors and logistics partners</p>
            </div>
            <button
              onClick={() => setIsSupplierModalOpen(true)}
              style={{ backgroundColor: 'var(--accent-primary)', boxShadow: '0 4px 14px var(--accent-glow)' }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-white text-xs font-bold transition-all cursor-pointer hover:opacity-90 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Add Supplier
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {suppliers.map((s) => (
              <div key={s.id} className="p-4 rounded-xl border border-[#292524] bg-[#141210] space-y-3 hover:border-[var(--accent-border)] transition-colors">
                <div className="flex items-center gap-3">
                  <div 
                    className="p-2.5 rounded-xl"
                    style={{ backgroundColor: 'var(--accent-glow)', color: 'var(--accent-primary)' }}
                  >
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[#FAFAF9]">{s.name}</h3>
                    <p className="text-xs text-stone-400">Contact: {s.contact_person || 'N/A'}</p>
                  </div>
                </div>
                <div className="text-xs space-y-1 text-stone-300 pt-2 border-t border-[#292524]">
                  <p><strong className="text-stone-400">Email:</strong> {s.email || 'N/A'}</p>
                  <p><strong className="text-stone-400">Phone:</strong> {s.phone || 'N/A'}</p>
                  <p><strong className="text-stone-400">Address:</strong> {s.address || 'N/A'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW: MY PROFILE */}
      {activeTab === 'profile' && (
        <div className="bg-[#1C1917] border border-[#292524] rounded-xl p-6 shadow-sm max-w-xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <div 
              className="w-16 h-16 rounded-2xl text-white text-2xl font-bold flex items-center justify-center shadow-lg"
              style={{ backgroundColor: 'var(--accent-primary)', boxShadow: '0 8px 24px var(--accent-glow)' }}
            >
              {user?.full_name?.charAt(0) || 'C'}
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#FAFAF9]">{user?.full_name}</h2>
              <span 
                className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border"
                style={{ backgroundColor: 'var(--accent-glow)', color: 'var(--accent-light)', borderColor: 'var(--accent-border)' }}
              >
                ROLE: INVENTORY CLERK
              </span>
            </div>
          </div>

          <div className="space-y-3 text-xs border-t border-[#292524] pt-4">
            <div className="flex justify-between py-2 border-b border-[#292524]">
              <span className="text-stone-400">Username:</span>
              <span className="font-bold text-[#FAFAF9]">{user?.username}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-[#292524]">
              <span className="text-stone-400">Email Address:</span>
              <span className="font-bold text-[#FAFAF9]">{user?.email}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-[#292524]">
              <span className="text-stone-400">Security Clearance:</span>
              <span className="font-semibold text-emerald-400">Level 2 (Warehouse & Product Stock Control)</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-stone-400">Restricted Features:</span>
              <span className="text-red-400 font-medium">POS Checkout, User Admin, ML Evaluation (Enforced)</span>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD NEW PRODUCT */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Register New Inventory Item">
        <form onSubmit={handleAddProduct} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-stone-300">SKU Code *</label>
              <input
                type="text"
                required
                placeholder="e.g. LAP-ROG-005"
                value={newProduct.sku}
                onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 rounded-lg border border-[#292524] bg-[#141210] text-[#FAFAF9]"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1 text-stone-300">Brand *</label>
              <input
                type="text"
                required
                placeholder="e.g. ASUS, Logitech, Corsair"
                value={newProduct.brand}
                onChange={(e) => setNewProduct({ ...newProduct, brand: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[#292524] bg-[#141210] text-[#FAFAF9]"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1 text-stone-300">Product Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. ASUS ROG Strix B760-F Gaming WiFi Motherboard"
              value={newProduct.name}
              onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[#292524] bg-[#141210] text-[#FAFAF9]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-stone-300">Category *</label>
              <select
                value={newProduct.category_id}
                onChange={(e) => setNewProduct({ ...newProduct, category_id: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg border border-[#292524] bg-[#141210] text-[#FAFAF9]"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1 text-stone-300">Cost Price (PHP) *</label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="Cost per unit"
                value={newProduct.cost_price}
                onChange={(e) => setNewProduct({ ...newProduct, cost_price: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[#292524] bg-[#141210] text-[#FAFAF9]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-stone-300">Initial Stock (Max 100)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={newProduct.stock_quantity}
                onChange={(e) => setNewProduct({ ...newProduct, stock_quantity: Math.min(100, Math.max(0, Number(e.target.value))) })}
                className="w-full px-3 py-2 rounded-lg border border-[#292524] bg-[#141210] text-[#FAFAF9]"
              />
              <p className="text-[10px] text-stone-500 mt-1">Max 100 units. Auto-reorder alert triggers at ≤ 5 units.</p>
            </div>
            <div>
              <label className="block font-semibold mb-1 text-stone-300">Retail Price (PHP) *</label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="Initial retail"
                value={newProduct.selling_price}
                onChange={(e) => setNewProduct({ ...newProduct, selling_price: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[#292524] bg-[#141210] text-emerald-400 font-bold"
              />
            </div>
          </div>

          {/* Optional Product Photo */}
          <div>
            <label className="block font-semibold mb-1 text-stone-300">Product Photo (Optional)</label>
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-lg bg-[#141210] border border-[#292524] p-1 shrink-0 flex items-center justify-center overflow-hidden">
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
                <p className="text-[11px] text-stone-500 mt-1">Optional. Defaults to clean system placeholder if left empty.</p>
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
            <label className="block font-semibold mb-1 text-stone-300">Technical Specifications & Notes</label>
            <textarea
              rows="2"
              placeholder="Specs, warranty period, package contents..."
              value={newProduct.description}
              onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[#292524] bg-[#141210] text-[#FAFAF9]"
            ></textarea>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#292524]">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 rounded-lg text-stone-300 bg-[#292524] hover:bg-[#44403C]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-white font-bold transition-opacity hover:opacity-90"
              style={{ backgroundColor: 'var(--accent-primary)', boxShadow: '0 4px 14px var(--accent-glow)' }}
            >
              Save Product
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: EDIT PRODUCT DETAILS (PRICE RESTRICTED FOR CLERK) */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title={`Edit Product: ${editProduct.name}`}>
        <form onSubmit={handleUpdateProduct} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold mb-1 text-stone-300">Product Name</label>
            <input
              type="text"
              required
              value={editProduct.name || ''}
              onChange={(e) => setEditProduct({ ...editProduct, name: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[#292524] bg-[#141210] text-[#FAFAF9]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-stone-300">Brand</label>
              <input
                type="text"
                required
                value={editProduct.brand || ''}
                onChange={(e) => setEditProduct({ ...editProduct, brand: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[#292524] bg-[#141210] text-[#FAFAF9]"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1 text-stone-300">Category</label>
              <select
                value={editProduct.category_id || 1}
                onChange={(e) => setEditProduct({ ...editProduct, category_id: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg border border-[#292524] bg-[#141210] text-[#FAFAF9]"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-stone-300">Cost Price (PHP) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={editProduct.cost_price || 0}
                onChange={(e) => setEditProduct({ ...editProduct, cost_price: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[#292524] bg-[#141210] text-[#FAFAF9]"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1 text-stone-300">Retail Selling Price (PHP) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={editProduct.selling_price || 0}
                onChange={(e) => setEditProduct({ ...editProduct, selling_price: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[#292524] bg-[#141210] text-emerald-400 font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1 text-stone-300">Stock Quantity</label>
            <input
              type="number"
              disabled
              value={editProduct.stock_quantity ?? 0}
              className="w-full px-3 py-2 rounded-lg border border-[#292524] bg-[#1C1917] text-stone-400 cursor-not-allowed"
              title="Use Stock-In / Stock-Out actions to adjust live quantities"
            />
            <p className="text-[11px] text-stone-500 mt-1">Automatic low-stock reorder triggers when quantity is 5 units or below.</p>
          </div>

          <div>
            <label className="block font-semibold mb-1 text-stone-300">Description / Technical Specifications</label>
            <textarea
              rows="2"
              value={editProduct.description || ''}
              onChange={(e) => setEditProduct({ ...editProduct, description: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[#292524] bg-[#141210] text-[#FAFAF9]"
            ></textarea>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-[#292524]">
            <button
              type="button"
              onClick={() => handleDeleteProduct(editProduct)}
              className="px-3 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-semibold inline-flex items-center gap-1.5 border border-red-500/20 cursor-pointer transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Product</span>
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 rounded-lg text-stone-300 bg-[#292524] hover:bg-[#44403C]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg text-white font-bold transition-opacity hover:opacity-90"
                style={{ backgroundColor: 'var(--accent-primary)', boxShadow: '0 4px 14px var(--accent-glow)' }}
              >
                Update Changes
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* MODAL: STOCK IN (WITH CONFIRMATION DIALOG) */}
      <Modal isOpen={isStockInModalOpen} onClose={() => setIsStockInModalOpen(false)} title={`Stock In Delivery: ${selectedProduct?.name}`}>
        <div className="space-y-4 text-xs">
          <div className="p-3 rounded-xl bg-[#141210] border border-[#292524] flex items-center justify-between">
            <div>
              <p className="font-mono text-xs font-bold" style={{ color: 'var(--accent-primary)' }}>{selectedProduct?.sku}</p>
              <p className="text-stone-400">Current On-Hand Stock: <strong className="text-[#FAFAF9]">{selectedProduct?.stock_quantity} units</strong></p>
            </div>
            {selectedProduct && getStatusBadge(selectedProduct.status, selectedProduct.stock_quantity)}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-stone-300">Quantity to Add (Max 100) *</label>
              <input
                type="number"
                min="1"
                max="100"
                required
                value={stockActionData.quantity}
                onChange={(e) => setStockActionData({ ...stockActionData, quantity: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[#292524] bg-[#141210] text-[#FAFAF9] font-bold text-sm"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1 text-stone-300">Supplier / Distro</label>
              <select
                value={stockActionData.supplier_id}
                onChange={(e) => setStockActionData({ ...stockActionData, supplier_id: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[#292524] bg-[#141210] text-[#FAFAF9]"
              >
                <option value="">Select Supplier (Optional)</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1 text-stone-300">Delivery Notes / PO Reference</label>
            <input
              type="text"
              placeholder="e.g. PO-2026-9901 / ASUS Phils delivery"
              value={stockActionData.notes}
              onChange={(e) => setStockActionData({ ...stockActionData, notes: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[#292524] bg-[#141210] text-[#FAFAF9]"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#292524]">
            <button
              onClick={() => setIsStockInModalOpen(false)}
              className="px-4 py-2 rounded-lg text-stone-300 bg-[#292524] hover:bg-[#44403C]"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setConfirmConfig({
                  title: 'Confirm Stock-In Receipt',
                  message: `Are you sure you want to add ${stockActionData.quantity} units to ${selectedProduct?.name}? New stock will be ${(selectedProduct?.stock_quantity || 0) + Number(stockActionData.quantity)}.`,
                  action: handleStockInSubmit,
                  style: 'primary'
                });
                setIsConfirmOpen(true);
              }}
              className="px-4 py-2 rounded-lg text-white font-bold flex items-center gap-1.5 transition-opacity hover:opacity-90"
              style={{ backgroundColor: 'var(--accent-primary)', boxShadow: '0 4px 14px var(--accent-glow)' }}
            >
              <ArrowDownLeft className="w-4 h-4" />
              Proceed with Restock
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL: STOCK OUT (WITH CONFIRMATION DIALOG) */}
      <Modal isOpen={isStockOutModalOpen} onClose={() => setIsStockOutModalOpen(false)} title={`Authorized Stock-Out: ${selectedProduct?.name}`}>
        <div className="space-y-4 text-xs">
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 flex items-center justify-between">
            <div>
              <p className="font-mono text-xs font-bold text-red-400">{selectedProduct?.sku}</p>
              <p className="text-xs">Current Available Stock: <strong className="text-[#FAFAF9]">{selectedProduct?.stock_quantity} units</strong></p>
            </div>
            <AlertTriangle className="w-6 h-6 text-red-400" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-stone-300">Quantity to Deduct (Max 100) *</label>
              <input
                type="number"
                min="1"
                max={Math.min(100, selectedProduct?.stock_quantity || 1)}
                required
                value={stockActionData.quantity}
                onChange={(e) => setStockActionData({ ...stockActionData, quantity: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[#292524] bg-[#141210] text-[#FAFAF9] font-bold text-sm"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1 text-stone-300">Reason Category *</label>
              <select
                value={stockActionData.reason}
                onChange={(e) => setStockActionData({ ...stockActionData, reason: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[#292524] bg-[#141210] text-[#FAFAF9]"
              >
                <option value="Damaged in transit / unboxing">Damaged in transit / unboxing</option>
                <option value="Customer Warranty RMA Replacement">Customer Warranty RMA Replacement</option>
                <option value="Store Display & Demo Unit">Store Display & Demo Unit</option>
                <option value="Internal Office Equipment Transfer">Internal Office Equipment Transfer</option>
                <option value="Warehouse inventory write-off">Warehouse inventory write-off</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#292524]">
            <button
              onClick={() => setIsStockOutModalOpen(false)}
              className="px-4 py-2 rounded-lg text-stone-300 bg-[#292524] hover:bg-[#44403C]"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setConfirmConfig({
                  title: 'Confirm Stock-Out Reduction',
                  message: `Are you sure you want to deduct ${stockActionData.quantity} units from ${selectedProduct?.name}? Reason: "${stockActionData.reason}". This action cannot be reversed.`,
                  action: handleStockOutSubmit,
                  style: 'danger'
                });
                setIsConfirmOpen(true);
              }}
              className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold flex items-center gap-1.5"
            >
              <ArrowUpRight className="w-4 h-4" />
              Process Stock-Out
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL: ADD SUPPLIER */}
      <Modal isOpen={isSupplierModalOpen} onClose={() => setIsSupplierModalOpen(false)} title="Add Hardware Supplier">
        <form onSubmit={handleAddSupplier} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold mb-1 text-stone-300">Supplier / Company Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. MSI Philippines Distribution"
              value={newSupplier.name}
              onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[#292524] bg-[#141210] text-[#FAFAF9]"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-stone-300">Contact Person</label>
              <input
                type="text"
                placeholder="Account Manager"
                value={newSupplier.contact_person}
                onChange={(e) => setNewSupplier({ ...newSupplier, contact_person: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[#292524] bg-[#141210] text-[#FAFAF9]"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1 text-stone-300">Contact Number</label>
              <input
                type="text"
                placeholder="+63 2 8xxx xxxx"
                value={newSupplier.phone}
                onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[#292524] bg-[#141210] text-[#FAFAF9]"
              />
            </div>
          </div>
          <div>
            <label className="block font-semibold mb-1 text-stone-300">Email</label>
            <input
              type="email"
              placeholder="orders@supplier.ph"
              value={newSupplier.email}
              onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[#292524] bg-[#141210] text-[#FAFAF9]"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1 text-stone-300">Warehouse Address</label>
            <input
              type="text"
              placeholder="Office / Warehouse Location"
              value={newSupplier.address}
              onChange={(e) => setNewSupplier({ ...newSupplier, address: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[#292524] bg-[#141210] text-[#FAFAF9]"
            />
          </div>
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#292524]">
            <button
              type="button"
              onClick={() => setIsSupplierModalOpen(false)}
              className="px-4 py-2 rounded-lg text-stone-300 bg-[#292524] hover:bg-[#44403C]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-white font-bold transition-opacity hover:opacity-90"
              style={{ backgroundColor: 'var(--accent-primary)', boxShadow: '0 4px 14px var(--accent-glow)' }}
            >
              Save Supplier
            </button>
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
        role="clerk"
        onEdit={(prod) => {
          setIsViewModalOpen(false);
          setEditProduct(prod);
          setIsEditModalOpen(true);
        }}
        onAddStock={(prod) => {
          setIsViewModalOpen(false);
          setSelectedProduct(prod);
          setStockActionData({ quantity: 5, supplier_id: '', notes: `Restock order for ${prod.name}` });
          setIsStockInModalOpen(true);
        }}
        onRemoveStock={(prod) => {
          setIsViewModalOpen(false);
          setSelectedProduct(prod);
          setStockActionData({ quantity: 1, reason: 'Damaged / Store Transfer' });
          setIsStockOutModalOpen(true);
        }}
        onRestock={(prod) => {
          setSelectedProduct(prod);
          setStockActionData({ quantity: 5, supplier_id: '', notes: `Restock order for ${prod.name}` });
          setIsStockInModalOpen(true);
        }}
        onNavigateStockIn={() => {
          setIsViewModalOpen(false);
          setViewProduct(null);
          const pid = viewProduct?.id;
          setActiveTab('stock_in');
          if (pid) {
            setHighlightedProductId(pid);
            setTimeout(() => setHighlightedProductId(null), 3000);
          }
        }}
        onNavigateStockOut={() => {
          setIsViewModalOpen(false);
          setViewProduct(null);
          const pid = viewProduct?.id;
          setActiveTab('stock_out');
          if (pid) {
            setHighlightedProductId(pid);
            setTimeout(() => setHighlightedProductId(null), 3000);
          }
        }}
      />

      {/* REUSABLE CONFIRMATION DIALOG */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={confirmConfig.action}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmStyle={confirmConfig.style}
      />
    </div>
  );
}

