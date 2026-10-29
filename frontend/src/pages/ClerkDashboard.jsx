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
  Truck
} from 'lucide-react';
import StatCard from '../components/StatCard';
import { ResponsiveLineChart, ResponsiveBarChart, ResponsiveDonutChart } from '../components/Charts';
import Modal, { ConfirmDialog } from '../components/Modal';
import { api } from '../api';

export default function ClerkDashboard({ activeTab, setActiveTab, user }) {
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [movements, setMovements] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isStockInModalOpen, setIsStockInModalOpen] = useState(false);
  const [isStockOutModalOpen, setIsStockOutModalOpen] = useState(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({});

  // Active item in action
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Forms
  const [newProduct, setNewProduct] = useState({
    sku: '', name: '', brand: '', category_id: 1, cost_price: '', selling_price: '', stock_quantity: 10, reorder_level: 5, description: ''
  });
  const [editProduct, setEditProduct] = useState({});
  const [stockActionData, setStockActionData] = useState({ quantity: 1, supplier_id: '', notes: '', reason: '' });
  const [newSupplier, setNewSupplier] = useState({ name: '', contact_person: '', email: '', phone: '', address: '' });

  const [notification, setNotification] = useState(null);

  const showNotification = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
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
    try {
      await api.addProduct(newProduct);
      showNotification(`Product ${newProduct.name} successfully created!`);
      setIsAddModalOpen(false);
      setNewProduct({ sku: '', name: '', brand: '', category_id: 1, cost_price: '', selling_price: '', stock_quantity: 10, reorder_level: 5, description: '' });
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  // Handle Edit Product (Clerk cannot change selling_price)
  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    try {
      await api.updateProduct(editProduct.id, editProduct);
      showNotification(`Product ${editProduct.name} updated!`);
      setIsEditModalOpen(false);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  // Handle Stock In
  const handleStockInSubmit = async () => {
    if (!selectedProduct || !stockActionData.quantity) return;
    try {
      await api.stockIn({
        product_id: selectedProduct.id,
        quantity: Number(stockActionData.quantity),
        supplier_id: stockActionData.supplier_id || null,
        notes: stockActionData.notes || 'Restock batch delivery'
      });
      showNotification(`Received ${stockActionData.quantity} units for ${selectedProduct.name}`);
      setIsStockInModalOpen(false);
      setIsConfirmOpen(false);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  // Handle Stock Out
  const handleStockOutSubmit = async () => {
    if (!selectedProduct || !stockActionData.quantity) return;
    try {
      await api.stockOut({
        product_id: selectedProduct.id,
        quantity: Number(stockActionData.quantity),
        reason: stockActionData.reason || 'Store inventory adjustment'
      });
      showNotification(`Processed stock out of ${stockActionData.quantity} units for ${selectedProduct.name}`);
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

  const getStatusBadge = (status, qty, reorder) => {
    if (qty === 0 || status === 'out_of_stock') {
      return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-500/10 text-red-500 border border-red-500/20">Out of Stock</span>;
    }
    if (qty <= reorder || status === 'low_stock') {
      return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">Low Stock</span>;
    }
    return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">In Stock</span>;
  };

  const cards = stats?.cards || {};
  const charts = stats?.charts || {};
  const tables = stats?.tables || {};

  return (
    <div className="p-6 space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 text-white shadow-xl text-sm animate-bounce">
          <CheckCircle2 className="w-4 h-4" />
          <span>{notification.msg}</span>
        </div>
      )}

      {/* VIEW: MAIN DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Top KPI Cards (6 cards required) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <StatCard
              title="Total Products"
              value={cards.total_products || 0}
              subtitle="Registered catalog items"
              icon={Package}
              badgeColor="blue"
            />
            <StatCard
              title="Units in Stock"
              value={cards.total_units_in_stock || 0}
              subtitle="Physical units count"
              icon={Boxes}
              badgeColor="green"
            />
            <StatCard
              title="Low-Stock Items"
              value={cards.low_stock_products || 0}
              subtitle="At or below threshold"
              icon={AlertTriangle}
              badgeColor="amber"
              trend="Warning"
            />
            <StatCard
              title="Out of Stock"
              value={cards.out_of_stock_products || 0}
              subtitle="Zero inventory remaining"
              icon={XCircle}
              badgeColor="red"
              trend="Urgent"
            />
            <StatCard
              title="Pending Restocks"
              value={cards.pending_restocks || 0}
              subtitle="Reorder alerts flagged"
              icon={RefreshCw}
              badgeColor="amber"
            />
            <StatCard
              title="Inventory Value"
              value={`PHP ${(cards.inventory_value || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
              subtitle="Total asset cost basis"
              icon={CircleDollarSign}
              badgeColor="green"
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-border rounded-xl p-5 shadow-sm">
              <ResponsiveBarChart
                title="Stock Distribution by Category"
                data={charts.category_distribution || []}
                xKey="name"
                yKey="count"
                barColor="#1E3A5F"
              />
            </div>
            <div className="bg-white dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-border rounded-xl p-5 shadow-sm">
              <ResponsiveLineChart
                title="Inventory Movement Trends (Past 7 Days)"
                data={charts.movement_trends || []}
                xKey="period"
                yKey="stock_in"
                yKey2="stock_out"
                strokeColor="#1E3A5F"
                strokeColor2="#EF4444"
              />
            </div>
            <div className="bg-white dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-border rounded-xl p-5 shadow-sm">
              <ResponsiveDonutChart
                title="Low-Stock vs In-Stock Ratio"
                data={charts.stock_status || []}
                valueKey="count"
                labelKey="status"
                centerLabel="Products"
              />
            </div>
          </div>

          {/* Tables Row: Low-Stock Alerts & Recent Inventory Movements */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Low-Stock Alerts Table */}
            <div className="bg-white dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-border rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <h3 className="font-bold text-sm text-gray-900 dark:text-white">Low-Stock Alerts</h3>
                </div>
                <button
                  onClick={() => setActiveTab('low_stock')}
                  className="text-xs text-navy dark:text-greige hover:underline font-semibold"
                >
                  View All Alerts
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 dark:bg-darkbg text-gray-500 dark:text-gray-400 uppercase font-semibold border-b border-gray-100 dark:border-darkbg-border">
                    <tr>
                      <th className="py-2.5 px-3">SKU</th>
                      <th className="py-2.5 px-3">Product Name</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">Current</th>
                      <th className="py-2.5 px-3">Reorder</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-darkbg-border text-gray-700 dark:text-gray-300">
                    {(tables.low_stock_alerts || []).slice(0, 5).map((prod) => (
                      <tr key={prod.id} className="hover:bg-gray-50/50 dark:hover:bg-darkbg-hover/50">
                        <td className="py-2 px-3 font-mono font-medium text-navy dark:text-blue-400">{prod.sku}</td>
                        <td className="py-2 px-3 font-medium truncate max-w-[140px]">{prod.name}</td>
                        <td className="py-2 px-3">{prod.category}</td>
                        <td className="py-2 px-3 font-bold text-red-500">{prod.current_stock}</td>
                        <td className="py-2 px-3">{prod.reorder_level}</td>
                        <td className="py-2 px-3">{getStatusBadge(prod.status, prod.current_stock, prod.reorder_level)}</td>
                        <td className="py-2 px-3 text-right">
                          <button
                            onClick={() => {
                              setSelectedProduct(prod);
                              setStockActionData({ quantity: 10, supplier_id: '', notes: 'Urgent low-stock restock' });
                              setIsStockInModalOpen(true);
                            }}
                            className="px-2.5 py-1 rounded bg-navy text-white text-[10px] font-bold hover:bg-navy-light transition-colors"
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
            <div className="bg-white dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-border rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-navy dark:text-greige" />
                  <h3 className="font-bold text-sm text-gray-900 dark:text-white">Recent Inventory Movements</h3>
                </div>
                <button
                  onClick={() => setActiveTab('movements')}
                  className="text-xs text-navy dark:text-greige hover:underline font-semibold"
                >
                  View Movement Log
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 dark:bg-darkbg text-gray-500 dark:text-gray-400 uppercase font-semibold border-b border-gray-100 dark:border-darkbg-border">
                    <tr>
                      <th className="py-2.5 px-3">Ref #</th>
                      <th className="py-2.5 px-3">Product</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Qty</th>
                      <th className="py-2.5 px-3">Date/Time</th>
                      <th className="py-2.5 px-3">Processed By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-darkbg-border text-gray-700 dark:text-gray-300">
                    {(tables.recent_movements || []).slice(0, 5).map((m, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-darkbg-hover/50">
                        <td className="py-2 px-3 font-mono font-medium text-[11px] text-gray-500">{m.reference_number}</td>
                        <td className="py-2 px-3 font-medium truncate max-w-[130px]">{m.product_name}</td>
                        <td className="py-2 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            m.movement_type === 'stock_in' 
                              ? 'bg-emerald-500/10 text-emerald-600' 
                              : m.movement_type === 'stock_out' 
                              ? 'bg-red-500/10 text-red-600'
                              : 'bg-blue-500/10 text-blue-600'
                          }`}>
                            {m.movement_type.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-bold">{m.quantity > 0 ? `+${m.quantity}` : m.quantity}</td>
                        <td className="py-2 px-3 text-[11px] text-gray-400">{m.created_at?.substring(0, 16)}</td>
                        <td className="py-2 px-3 text-gray-600 dark:text-gray-300 truncate max-w-[100px]">{m.processed_by}</td>
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
      {(activeTab === 'inventory' || activeTab === 'low_stock') && (
        <div className="bg-white dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-border rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {activeTab === 'low_stock' ? 'Low-Stock Alerts & Reordering' : 'Product Inventory Management'}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {activeTab === 'low_stock' ? 'Items requiring immediate restocking to maintain service levels' : 'Full warehouse and showroom product catalog'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-navy hover:bg-navy-light text-white text-xs font-semibold shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Product
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-gray-100 dark:border-darkbg-border">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by SKU, Name, or Brand..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-gray-200 dark:border-darkbg-border bg-gray-50 dark:bg-darkbg text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-navy"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs px-3 py-2 rounded-lg border border-gray-200 dark:border-darkbg-border bg-gray-50 dark:bg-darkbg text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-navy"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs px-3 py-2 rounded-lg border border-gray-200 dark:border-darkbg-border bg-gray-50 dark:bg-darkbg text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-navy"
            >
              <option value="">All Stock Statuses</option>
              <option value="in_stock">In Stock</option>
              <option value="low_stock">Low Stock</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>
          </div>

          {/* Products Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-darkbg text-gray-500 dark:text-gray-400 uppercase font-semibold border-b border-gray-200 dark:border-darkbg-border">
                <tr>
                  <th className="py-3 px-3">SKU</th>
                  <th className="py-3 px-3">Product Name</th>
                  <th className="py-3 px-3">Brand</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3 text-right">Cost Price</th>
                  <th className="py-3 px-3 text-right">Selling Price</th>
                  <th className="py-3 px-3 text-center">Stock</th>
                  <th className="py-3 px-3 text-center">Reorder</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-darkbg-border text-gray-800 dark:text-gray-200">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="py-8 text-center text-gray-400 text-xs">
                      No matching products found.
                    </td>
                  </tr>
                ) : (
                  products.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50/70 dark:hover:bg-darkbg-hover/60 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-navy dark:text-blue-400">{p.sku}</td>
                      <td className="py-2.5 px-3 font-medium">
                        <div>
                          <span>{p.name}</span>
                          {p.description && <p className="text-[10px] text-gray-400 truncate max-w-xs">{p.description}</p>}
                        </div>
                      </td>
                      <td className="py-2.5 px-3">{p.brand}</td>
                      <td className="py-2.5 px-3">{p.category_name}</td>
                      <td className="py-2.5 px-3 text-right font-mono">PHP {Number(p.cost_price).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold">PHP {Number(p.selling_price).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      <td className="py-2.5 px-3 text-center font-bold text-sm">
                        <span className={p.stock_quantity <= p.reorder_level ? 'text-red-500 font-extrabold' : 'text-emerald-600'}>
                          {p.stock_quantity}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center text-gray-500">{p.reorder_level}</td>
                      <td className="py-2.5 px-3 text-center">{getStatusBadge(p.status, p.stock_quantity, p.reorder_level)}</td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Stock In */}
                          <button
                            title="Stock In / Restock"
                            onClick={() => {
                              setSelectedProduct(p);
                              setStockActionData({ quantity: 5, supplier_id: '', notes: 'Routine restock' });
                              setIsStockInModalOpen(true);
                            }}
                            className="p-1.5 rounded bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"
                          >
                            <ArrowDownLeft className="w-3.5 h-3.5" />
                          </button>

                          {/* Stock Out */}
                          <button
                            title="Authorized Stock Out"
                            onClick={() => {
                              setSelectedProduct(p);
                              setStockActionData({ quantity: 1, reason: 'Damaged / Store Transfer' });
                              setIsStockOutModalOpen(true);
                            }}
                            className="p-1.5 rounded bg-red-500/10 text-red-600 hover:bg-red-500/20"
                          >
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit Product (Clerk cannot change price) */}
                          <button
                            title="Edit Product Details"
                            onClick={() => {
                              setEditProduct(p);
                              setIsEditModalOpen(true);
                            }}
                            className="p-1.5 rounded bg-navy/10 text-navy dark:text-blue-300 hover:bg-navy/20"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW: STOCK IN / RESTOCKING TAB */}
      {activeTab === 'stock_in' && (
        <div className="bg-white dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-border rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Stock In / Restocking Console</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Receive warehouse deliveries, purchase orders, and supplier shipments</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
            {products.map((p) => (
              <div key={p.id} className="p-4 rounded-xl border border-gray-200 dark:border-darkbg-border hover:shadow-md transition-shadow bg-gray-50/50 dark:bg-darkbg/40 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between">
                    <span className="font-mono text-xs font-bold text-navy dark:text-blue-400">{p.sku}</span>
                    {getStatusBadge(p.status, p.stock_quantity, p.reorder_level)}
                  </div>
                  <h4 className="font-semibold text-sm mt-1 text-gray-900 dark:text-white line-clamp-1">{p.name}</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{p.brand} • {p.category_name}</p>
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="text-gray-500">Current Stock:</span>
                    <span className="font-bold text-gray-900 dark:text-white">{p.stock_quantity} units</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedProduct(p);
                    setStockActionData({ quantity: 10, supplier_id: '', notes: 'Shipment restock' });
                    setIsStockInModalOpen(true);
                  }}
                  className="mt-4 w-full py-2 rounded-lg bg-navy hover:bg-navy-light text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
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
        <div className="bg-white dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-border rounded-xl p-6 shadow-sm space-y-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Authorized Stock-Out Console</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Process non-sale stock reductions: damaged units, RMA returns, display models, or inter-branch transfers</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
            {products.filter(p => p.stock_quantity > 0).map((p) => (
              <div key={p.id} className="p-4 rounded-xl border border-gray-200 dark:border-darkbg-border hover:shadow-md transition-shadow bg-gray-50/50 dark:bg-darkbg/40 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between">
                    <span className="font-mono text-xs font-bold text-navy dark:text-blue-400">{p.sku}</span>
                    <span className="text-xs font-bold text-emerald-600">{p.stock_quantity} available</span>
                  </div>
                  <h4 className="font-semibold text-sm mt-1 text-gray-900 dark:text-white line-clamp-1">{p.name}</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{p.brand} • {p.category_name}</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedProduct(p);
                    setStockActionData({ quantity: 1, reason: 'Damaged in transit' });
                    setIsStockOutModalOpen(true);
                  }}
                  className="mt-4 w-full py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
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
        <div className="bg-white dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-border rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Stock Movement Audit Trail</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Complete historical record of all warehouse receipts, cashier sales, and adjustments</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-darkbg text-gray-500 dark:text-gray-400 uppercase font-semibold border-b border-gray-200 dark:border-darkbg-border">
                <tr>
                  <th className="py-3 px-3">Reference #</th>
                  <th className="py-3 px-3">Date & Time</th>
                  <th className="py-3 px-3">Product Name</th>
                  <th className="py-3 px-3">SKU</th>
                  <th className="py-3 px-3 text-center">Movement</th>
                  <th className="py-3 px-3 text-right">Quantity</th>
                  <th className="py-3 px-3 text-center">Previous → New</th>
                  <th className="py-3 px-3">Supplier / Reason</th>
                  <th className="py-3 px-3">Processed By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-darkbg-border text-gray-800 dark:text-gray-200">
                {movements.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50/50 dark:hover:bg-darkbg-hover/50">
                    <td className="py-2.5 px-3 font-mono font-semibold text-navy dark:text-blue-400">{m.reference_number}</td>
                    <td className="py-2.5 px-3 text-gray-500">{m.created_at}</td>
                    <td className="py-2.5 px-3 font-medium">{m.product_name}</td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-gray-400">{m.sku}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        m.movement_type === 'stock_in' 
                          ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' 
                          : m.movement_type === 'stock_out' 
                          ? 'bg-red-500/10 text-red-600 border border-red-500/20'
                          : 'bg-blue-500/10 text-blue-600 border border-blue-500/20'
                      }`}>
                        {m.movement_type.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-sm">
                      <span className={m.quantity > 0 ? 'text-emerald-600' : 'text-red-500'}>
                        {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-gray-500">
                      {m.previous_stock} → {m.new_stock}
                    </td>
                    <td className="py-2.5 px-3 text-gray-600 dark:text-gray-300">
                      {m.supplier_name ? `Supplier: ${m.supplier_name}` : m.reason || 'Standard operation'}
                    </td>
                    <td className="py-2.5 px-3 text-gray-700 dark:text-gray-300 font-medium">{m.processed_by}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW: SUPPLIERS TAB */}
      {activeTab === 'suppliers' && (
        <div className="bg-white dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-border rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Authorized Supplier Management</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Authorized hardware distributors and logistics partners</p>
            </div>
            <button
              onClick={() => setIsSupplierModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-navy hover:bg-navy-light text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Supplier
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {suppliers.map((s) => (
              <div key={s.id} className="p-4 rounded-xl border border-gray-200 dark:border-darkbg-border bg-gray-50/50 dark:bg-darkbg/40 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-navy/10 dark:bg-darkbg-hover text-navy dark:text-greige">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-gray-900 dark:text-white">{s.name}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Contact: {s.contact_person || 'N/A'}</p>
                  </div>
                </div>
                <div className="text-xs space-y-1 text-gray-600 dark:text-gray-300 pt-2 border-t border-gray-100 dark:border-darkbg-border">
                  <p><strong className="text-gray-400">Email:</strong> {s.email || 'N/A'}</p>
                  <p><strong className="text-gray-400">Phone:</strong> {s.phone || 'N/A'}</p>
                  <p><strong className="text-gray-400">Address:</strong> {s.address || 'N/A'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW: MY PROFILE */}
      {activeTab === 'profile' && (
        <div className="bg-white dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-border rounded-xl p-6 shadow-sm max-w-xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-navy text-white text-2xl font-bold flex items-center justify-center shadow-md">
              {user?.full_name?.charAt(0) || 'C'}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{user?.full_name}</h2>
              <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-navy/10 text-navy dark:bg-darkbg-hover dark:text-greige border border-navy/20">
                ROLE: INVENTORY CLERK
              </span>
            </div>
          </div>

          <div className="space-y-3 text-xs border-t border-gray-100 dark:border-darkbg-border pt-4">
            <div className="flex justify-between py-2 border-b border-gray-50 dark:border-darkbg-border">
              <span className="text-gray-500">Username:</span>
              <span className="font-bold text-gray-900 dark:text-white">{user?.username}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-50 dark:border-darkbg-border">
              <span className="text-gray-500">Email Address:</span>
              <span className="font-bold text-gray-900 dark:text-white">{user?.email}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-50 dark:border-darkbg-border">
              <span className="text-gray-500">Security Clearance:</span>
              <span className="font-semibold text-emerald-600">Level 2 (Warehouse & Product Stock Control)</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-500">Restricted Features:</span>
              <span className="text-red-500 font-medium">POS Checkout, User Admin, ML Evaluation (Enforced)</span>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD NEW PRODUCT */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Register New Inventory Item">
        <form onSubmit={handleAddProduct} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">SKU Code *</label>
              <input
                type="text"
                required
                placeholder="e.g. LAP-ROG-005"
                value={newProduct.sku}
                onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-darkbg-border bg-gray-50 dark:bg-darkbg"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">Brand *</label>
              <input
                type="text"
                required
                placeholder="e.g. ASUS, Logitech, Corsair"
                value={newProduct.brand}
                onChange={(e) => setNewProduct({ ...newProduct, brand: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-darkbg-border bg-gray-50 dark:bg-darkbg"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">Product Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. ASUS ROG Strix B760-F Gaming WiFi Motherboard"
              value={newProduct.name}
              onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-darkbg-border bg-gray-50 dark:bg-darkbg"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">Category *</label>
              <select
                value={newProduct.category_id}
                onChange={(e) => setNewProduct({ ...newProduct, category_id: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-darkbg-border bg-gray-50 dark:bg-darkbg"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">Cost Price (PHP) *</label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="Cost per unit"
                value={newProduct.cost_price}
                onChange={(e) => setNewProduct({ ...newProduct, cost_price: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-darkbg-border bg-gray-50 dark:bg-darkbg"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">Initial Stock</label>
              <input
                type="number"
                min="0"
                value={newProduct.stock_quantity}
                onChange={(e) => setNewProduct({ ...newProduct, stock_quantity: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-darkbg-border bg-gray-50 dark:bg-darkbg"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">Reorder Level</label>
              <input
                type="number"
                min="1"
                value={newProduct.reorder_level}
                onChange={(e) => setNewProduct({ ...newProduct, reorder_level: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-darkbg-border bg-gray-50 dark:bg-darkbg"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">Retail Price (PHP)</label>
              <input
                type="number"
                step="0.01"
                placeholder="Initial retail"
                value={newProduct.selling_price}
                onChange={(e) => setNewProduct({ ...newProduct, selling_price: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-darkbg-border bg-gray-50 dark:bg-darkbg"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">Technical Specifications & Notes</label>
            <textarea
              rows="2"
              placeholder="Specs, warranty period, package contents..."
              value={newProduct.description}
              onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-darkbg-border bg-gray-50 dark:bg-darkbg"
            ></textarea>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-darkbg-border">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 rounded-lg text-gray-600 bg-gray-100 dark:bg-darkbg dark:text-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-navy hover:bg-navy-light text-white font-bold"
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
            <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">Product Name</label>
            <input
              type="text"
              required
              value={editProduct.name || ''}
              onChange={(e) => setEditProduct({ ...editProduct, name: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-darkbg-border bg-gray-50 dark:bg-darkbg"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">Brand</label>
              <input
                type="text"
                required
                value={editProduct.brand || ''}
                onChange={(e) => setEditProduct({ ...editProduct, brand: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-darkbg-border bg-gray-50 dark:bg-darkbg"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">Category</label>
              <select
                value={editProduct.category_id || 1}
                onChange={(e) => setEditProduct({ ...editProduct, category_id: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-darkbg-border bg-gray-50 dark:bg-darkbg"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">Cost Price (PHP)</label>
              <input
                type="number"
                step="0.01"
                required
                value={editProduct.cost_price || 0}
                onChange={(e) => setEditProduct({ ...editProduct, cost_price: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-darkbg-border bg-gray-50 dark:bg-darkbg"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">Reorder Level</label>
              <input
                type="number"
                required
                value={editProduct.reorder_level || 5}
                onChange={(e) => setEditProduct({ ...editProduct, reorder_level: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-darkbg-border bg-gray-50 dark:bg-darkbg"
              />
            </div>
          </div>

          {/* Locked Selling Price Note for Inventory Clerk */}
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300">
            <p className="font-semibold">Security Permission Notice</p>
            <p className="text-[11px] text-amber-700 dark:text-amber-400">
              Selling Price (PHP {Number(editProduct.selling_price || 0).toLocaleString()}) is locked. Only Admin accounts are authorized to modify retail customer pricing.
            </p>
          </div>

          <div>
            <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">Description</label>
            <textarea
              rows="2"
              value={editProduct.description || ''}
              onChange={(e) => setEditProduct({ ...editProduct, description: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-darkbg-border bg-gray-50 dark:bg-darkbg"
            ></textarea>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-darkbg-border">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 rounded-lg text-gray-600 bg-gray-100 dark:bg-darkbg dark:text-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-navy hover:bg-navy-light text-white font-bold"
            >
              Update Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: STOCK IN (WITH CONFIRMATION DIALOG) */}
      <Modal isOpen={isStockInModalOpen} onClose={() => setIsStockInModalOpen(false)} title={`Stock In Delivery: ${selectedProduct?.name}`}>
        <div className="space-y-4 text-xs">
          <div className="p-3 rounded-xl bg-gray-50 dark:bg-darkbg border border-gray-200 dark:border-darkbg-border flex items-center justify-between">
            <div>
              <p className="font-mono text-xs text-navy dark:text-blue-400 font-bold">{selectedProduct?.sku}</p>
              <p className="text-gray-500">Current On-Hand Stock: <strong>{selectedProduct?.stock_quantity} units</strong></p>
            </div>
            {selectedProduct && getStatusBadge(selectedProduct.status, selectedProduct.stock_quantity, selectedProduct.reorder_level)}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">Quantity to Add *</label>
              <input
                type="number"
                min="1"
                required
                value={stockActionData.quantity}
                onChange={(e) => setStockActionData({ ...stockActionData, quantity: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-darkbg-border bg-gray-50 dark:bg-darkbg font-bold text-sm"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">Supplier / Distro</label>
              <select
                value={stockActionData.supplier_id}
                onChange={(e) => setStockActionData({ ...stockActionData, supplier_id: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-darkbg-border bg-gray-50 dark:bg-darkbg"
              >
                <option value="">Select Supplier (Optional)</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">Delivery Notes / PO Reference</label>
            <input
              type="text"
              placeholder="e.g. PO-2026-9901 / ASUS Phils delivery"
              value={stockActionData.notes}
              onChange={(e) => setStockActionData({ ...stockActionData, notes: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-darkbg-border bg-gray-50 dark:bg-darkbg"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-darkbg-border">
            <button
              onClick={() => setIsStockInModalOpen(false)}
              className="px-4 py-2 rounded-lg text-gray-600 bg-gray-100 dark:bg-darkbg dark:text-gray-300"
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
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5"
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
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-900 dark:text-red-300 flex items-center justify-between">
            <div>
              <p className="font-mono text-xs font-bold text-red-700 dark:text-red-400">{selectedProduct?.sku}</p>
              <p className="text-xs">Current Available Stock: <strong>{selectedProduct?.stock_quantity} units</strong></p>
            </div>
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">Quantity to Deduct *</label>
              <input
                type="number"
                min="1"
                max={selectedProduct?.stock_quantity || 1}
                required
                value={stockActionData.quantity}
                onChange={(e) => setStockActionData({ ...stockActionData, quantity: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-darkbg-border bg-gray-50 dark:bg-darkbg font-bold text-sm"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">Reason Category *</label>
              <select
                value={stockActionData.reason}
                onChange={(e) => setStockActionData({ ...stockActionData, reason: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-darkbg-border bg-gray-50 dark:bg-darkbg"
              >
                <option value="Damaged in transit / unboxing">Damaged in transit / unboxing</option>
                <option value="Customer Warranty RMA Replacement">Customer Warranty RMA Replacement</option>
                <option value="Store Display & Demo Unit">Store Display & Demo Unit</option>
                <option value="Internal Office Equipment Transfer">Internal Office Equipment Transfer</option>
                <option value="Warehouse inventory write-off">Warehouse inventory write-off</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-darkbg-border">
            <button
              onClick={() => setIsStockOutModalOpen(false)}
              className="px-4 py-2 rounded-lg text-gray-600 bg-gray-100 dark:bg-darkbg dark:text-gray-300"
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
            <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">Supplier / Company Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. MSI Philippines Distribution"
              value={newSupplier.name}
              onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-darkbg-border bg-gray-50 dark:bg-darkbg"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">Contact Person</label>
              <input
                type="text"
                placeholder="Account Manager"
                value={newSupplier.contact_person}
                onChange={(e) => setNewSupplier({ ...newSupplier, contact_person: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-darkbg-border bg-gray-50 dark:bg-darkbg"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">Contact Number</label>
              <input
                type="text"
                placeholder="+63 2 8xxx xxxx"
                value={newSupplier.phone}
                onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-darkbg-border bg-gray-50 dark:bg-darkbg"
              />
            </div>
          </div>
          <div>
            <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">Email</label>
            <input
              type="email"
              placeholder="orders@supplier.ph"
              value={newSupplier.email}
              onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-darkbg-border bg-gray-50 dark:bg-darkbg"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">Warehouse Address</label>
            <input
              type="text"
              placeholder="Office / Warehouse Location"
              value={newSupplier.address}
              onChange={(e) => setNewSupplier({ ...newSupplier, address: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-darkbg-border bg-gray-50 dark:bg-darkbg"
            />
          </div>
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-darkbg-border">
            <button
              type="button"
              onClick={() => setIsSupplierModalOpen(false)}
              className="px-4 py-2 rounded-lg text-gray-600 bg-gray-100 dark:bg-darkbg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-navy hover:bg-navy-light text-white font-bold"
            >
              Save Supplier
            </button>
          </div>
        </form>
      </Modal>

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

