import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  CircleDollarSign, 
  Receipt, 
  PackageCheck, 
  Clock, 
  TrendingUp, 
  Plus, 
  Minus, 
  Trash2, 
  Search, 
  CreditCard, 
  Banknote, 
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Eye,
  Printer,
  Calendar,
  Lock,
  Unlock,
  UserCheck
} from 'lucide-react';
import StatCard from '../components/StatCard';
import { ResponsiveLineChart, ResponsiveBarChart, ResponsiveDonutChart } from '../components/Charts';
import Modal from '../components/Modal';
import { api } from '../api';
import PointOfSale from './PointOfSale';
import NewTransaction from './NewTransaction';

export default function SalesDashboard({ activeTab, setActiveTab, user }) {
  const [stats, setStats] = useState(null);
  const [posProducts, setPosProducts] = useState([]);
  const [salesHistory, setSalesHistory] = useState([]);
  const [currentShift, setCurrentShift] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadedDraftId, setLoadedDraftId] = useState(null);

  // POS State
  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchProduct, setSearchProduct] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [amountTendered, setAmountTendered] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Modals
  const [activeReceipt, setActiveReceipt] = useState(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(null);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [shiftStartingCash, setShiftStartingCash] = useState(3000);

  // Product Lookup state
  const [lookupQuery, setLookupQuery] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, posRes, salesRes, shiftRes] = await Promise.all([
        api.getDashboardStats('sales_personnel'),
        api.getPosProducts(),
        api.getSalesHistory(),
        api.getCurrentShift()
      ]);

      if (statsRes.status === 'success') setStats(statsRes.data);
      if (posRes.status === 'success') setPosProducts(posRes.products);
      if (salesRes.status === 'success') setSalesHistory(salesRes.transactions);
      if (shiftRes.status === 'success') setCurrentShift(shiftRes.shift);
    } catch (err) {
      console.error('Error fetching sales data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Cart operations
  const addToCart = (product) => {
    const existing = cart.find(item => item.product_id === product.id);
    if (existing) {
      if (existing.quantity >= product.stock_quantity) {
        alert(`Cannot add more than available stock (${product.stock_quantity} units)`);
        return;
      }
      setCart(cart.map(item => 
        item.product_id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCart([...cart, {
        product_id: product.id,
        name: product.name,
        sku: product.sku,
        unit_price: Number(product.selling_price),
        max_stock: product.stock_quantity,
        quantity: 1
      }]);
    }
  };

  const updateQuantity = (productId, delta) => {
    setCart(cart.map(item => {
      if (item.product_id === productId) {
        const newQty = item.quantity + delta;
        if (newQty <= 0) return null;
        if (newQty > item.max_stock) {
          alert(`Max stock reached for ${item.name} (${item.max_stock} units)`);
          return item;
        }
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(Boolean));
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.product_id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setAmountTendered('');
    setPaymentReference('');
    setCustomerName('Walk-in Customer');
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
  const vatAmount = Math.round(subtotal * 0.12 * 100) / 100; // 12% VAT
  const totalAmount = Math.round((subtotal + vatAmount) * 100) / 100;
  const tenderedNum = Number(amountTendered) || 0;
  const changeAmount = paymentMethod === 'Cash' ? Math.max(0, tenderedNum - totalAmount) : 0;

  // Checkout process
  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert('Shopping cart is empty');
      return;
    }

    if (paymentMethod === 'Cash' && tenderedNum < totalAmount) {
      alert(`Amount tendered (PHP ${tenderedNum.toLocaleString()}) is less than total (PHP ${totalAmount.toLocaleString()})`);
      return;
    }

    setIsCheckingOut(true);
    try {
      const payload = {
        items: cart.map(i => ({ product_id: i.product_id, quantity: i.quantity })),
        payment_method: paymentMethod,
        amount_tendered: paymentMethod === 'Cash' ? tenderedNum : totalAmount,
        customer_name: customerName,
        payment_reference: paymentReference || null
      };

      const res = await api.checkout(payload);
      if (res.status === 'success') {
        setCheckoutSuccess(res.receipt);
        setActiveReceipt(res.receipt);
        setIsReceiptModalOpen(true);
        clearCart();
        loadData();
      }
    } catch (err) {
      alert(`Checkout failed: ${err.message}`);
    } finally {
      setIsCheckingOut(false);
    }
  };

  // View Receipt
  const handleViewReceipt = async (transactionId) => {
    try {
      const res = await api.getReceipt(transactionId);
      if (res.status === 'success') {
        setActiveReceipt(res.receipt);
        setIsReceiptModalOpen(true);
      }
    } catch (err) {
      alert('Error fetching receipt');
    }
  };

  // Shift Management
  const handleOpenShift = async () => {
    try {
      await api.openShift(shiftStartingCash);
      setIsShiftModalOpen(false);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCloseShift = async () => {
    if (!window.confirm('Are you sure you want to close this shift and reconcile register totals?')) return;
    try {
      await api.closeShift();
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  // Category filtering
  const categoriesList = ['All', ...new Set(posProducts.map(p => p.category_name))];
  const filteredProducts = posProducts.filter(p => {
    const matchesCat = selectedCategory === 'All' || p.category_name === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchProduct.toLowerCase()) || 
                          p.sku.toLowerCase().includes(searchProduct.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const cards = stats?.cards || {};
  const charts = stats?.charts || {};
  const tables = stats?.tables || {};

  return (
    <div className="p-6 space-y-6">
      {/* VIEW: MAIN DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Quick Access Actions & Shift Status Bar */}
          <div className="bg-gradient-to-r from-navy to-navy-dark dark:from-darkbg-card dark:to-darkbg p-5 rounded-2xl text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-xs font-bold uppercase tracking-wider text-greige">Register Ready • Live Operations</span>
              </div>
              <h2 className="text-lg font-black tracking-tight mt-0.5">
                Quick Sales Actions & Transaction Flow
              </h2>
              <p className="text-xs text-gray-300 mt-0.5">
                Prepare drafts in New Transaction, or immediately process customer checkout in Point of Sale.
              </p>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setActiveTab('new_transaction')}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-greige text-navy hover:bg-greige-light font-bold text-xs shadow-md transition"
              >
                <Plus className="w-4 h-4" />
                <span>New Transaction (Drafts)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('pos')}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Point of Sale (POS)</span>
              </button>
            </div>
          </div>

          {/* Low-Stock Notifications for Cashiers */}
          {posProducts.filter(p => p.stock_quantity > 0 && p.stock_quantity <= (p.reorder_level || 5)).length > 0 && (
            <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl flex items-center justify-between text-xs text-amber-900 dark:text-amber-200">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <span className="font-bold">Inventory Low-Stock Warning: </span>
                  <span>{posProducts.filter(p => p.stock_quantity > 0 && p.stock_quantity <= (p.reorder_level || 5)).length} products have reached critical reorder levels. Check available units before confirming sales.</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('product_lookup')}
                className="font-bold underline text-amber-800 dark:text-amber-300 ml-2 shrink-0"
              >
                Lookup Stock
              </button>
            </div>
          )}

          {/* Top KPI Cards (6 cards required) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <StatCard
              title="Sales Today"
              value={`PHP ${(cards.sales_today || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
              subtitle="Total gross receipts"
              icon={CircleDollarSign}
              badgeColor="green"
              trend="+8.4%"
            />
            <StatCard
              title="Transactions Today"
              value={cards.transactions_today || 0}
              subtitle="Completed register sales"
              icon={Receipt}
              badgeColor="blue"
            />
            <StatCard
              title="Avg. Transaction"
              value={`PHP ${(cards.average_transaction_value || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
              subtitle="Basket size per customer"
              icon={TrendingUp}
              badgeColor="green"
            />
            <StatCard
              title="Items Sold Today"
              value={cards.items_sold_today || 0}
              subtitle="Physical units checked out"
              icon={PackageCheck}
              badgeColor="blue"
            />
            <StatCard
              title="Current Shift Sales"
              value={`PHP ${(cards.current_shift_sales || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
              subtitle={currentShift ? `Shift #${currentShift.id} active` : 'No active shift'}
              icon={Clock}
              badgeColor="green"
            />
            <StatCard
              title="Recent Transactions"
              value={cards.recent_transactions_count || 0}
              subtitle="Invoices processed"
              icon={ShoppingCart}
              badgeColor="blue"
            />
          </div>

          {/* Charts Row (3 required) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-border rounded-xl p-5 shadow-sm">
              <ResponsiveLineChart
                title="Hourly Sales Trend Today (PHP)"
                data={charts.hourly_sales || []}
                xKey="hour"
                yKey="sales"
                strokeColor="#1E3A5F"
              />
            </div>
            <div className="bg-white dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-border rounded-xl p-5 shadow-sm">
              <ResponsiveBarChart
                title="Daily Transaction Count"
                data={charts.daily_transactions || []}
                xKey="day"
                yKey="transactions"
                barColor="#10B981"
              />
            </div>
            <div className="bg-white dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-border rounded-xl p-5 shadow-sm">
              <ResponsiveDonutChart
                title="Sales by Product Category"
                data={charts.sales_by_category || []}
                valueKey="value"
                labelKey="name"
                centerLabel="Revenue"
              />
            </div>
          </div>

          {/* Tables Row: Recent Transactions & Best-Selling Items Today */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Transactions Table */}
            <div className="bg-white dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-border rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-navy dark:text-blue-400" />
                  <h3 className="font-bold text-sm text-gray-900 dark:text-white">Recent Completed Transactions</h3>
                </div>
                <button
                  onClick={() => setActiveTab('sales_history')}
                  className="text-xs text-navy dark:text-greige hover:underline font-semibold"
                >
                  View All History
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 dark:bg-darkbg text-gray-500 dark:text-gray-400 uppercase font-semibold border-b border-gray-100 dark:border-darkbg-border">
                    <tr>
                      <th className="py-2.5 px-3">Invoice #</th>
                      <th className="py-2.5 px-3">Date/Time</th>
                      <th className="py-2.5 px-3 text-right">Total</th>
                      <th className="py-2.5 px-3 text-center">Payment</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-darkbg-border text-gray-700 dark:text-gray-300">
                    {(tables.recent_transactions || []).slice(0, 5).map((t) => (
                      <tr key={t.id} className="hover:bg-gray-50/50 dark:hover:bg-darkbg-hover/50">
                        <td className="py-2.5 px-3 font-mono font-medium text-navy dark:text-blue-400">{t.invoice_number}</td>
                        <td className="py-2.5 px-3 text-gray-500">{t.created_at?.substring(5, 16)}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold">PHP {Number(t.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-navy/10 text-navy dark:text-greige">
                            {t.payment_method}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600">
                            Completed
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => handleViewReceipt(t.id)}
                            className="p-1 rounded bg-gray-100 dark:bg-darkbg hover:bg-gray-200 dark:hover:bg-darkbg-hover text-navy dark:text-greige"
                            title="View Receipt"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Best-Selling Items Today Table */}
            <div className="bg-white dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-border rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  <h3 className="font-bold text-sm text-gray-900 dark:text-white">Best-Selling Items Today</h3>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 dark:bg-darkbg text-gray-500 dark:text-gray-400 uppercase font-semibold border-b border-gray-100 dark:border-darkbg-border">
                    <tr>
                      <th className="py-2.5 px-3">Product Name</th>
                      <th className="py-2.5 px-3">SKU</th>
                      <th className="py-2.5 px-3 text-center">Units Sold</th>
                      <th className="py-2.5 px-3 text-right">Gross Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-darkbg-border text-gray-700 dark:text-gray-300">
                    {(tables.best_selling_today || []).map((p, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-darkbg-hover/50">
                        <td className="py-2.5 px-3 font-medium truncate max-w-[170px]">{p.name}</td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-gray-400">{p.sku}</td>
                        <td className="py-2.5 px-3 text-center font-bold text-navy dark:text-blue-400">{p.units_sold}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600">
                          PHP {Number(p.revenue).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: NEW TRANSACTION (SEPARATE FEATURE: DRAFTS PREPARATION & REVIEW) */}
      {activeTab === 'new_transaction' && (
        <NewTransaction
          user={user}
          onProceedToPos={(draftId) => {
            setLoadedDraftId(draftId);
            setActiveTab('pos');
          }}
        />
      )}

      {/* VIEW: POINT OF SALE (SEPARATE FEATURE: POS CHECKOUT, TENDER & OFFICIAL RECEIPT) */}
      {activeTab === 'pos' && (
        <PointOfSale
          user={user}
          initialDraftId={loadedDraftId}
          onClearDraft={() => setLoadedDraftId(null)}
          onNavigateToNewTransaction={() => setActiveTab('new_transaction')}
        />
      )}

      {/* LEGACY COMBINED VIEW (DISABLED) */}
      {false && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Product Catalog (7 cols) */}
          <div className="lg:col-span-7 bg-white dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-border rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-navy dark:text-greige" />
                  Point of Sale (POS) Catalog
                </h2>
                <p className="text-xs text-gray-500">Select items to add to the customer order</p>
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products or SKU..."
                  value={searchProduct}
                  onChange={(e) => setSearchProduct(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-gray-200 dark:border-darkbg-border bg-gray-50 dark:bg-darkbg text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-navy"
                />
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {categoriesList.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    selectedCategory === cat
                      ? 'bg-navy text-white shadow-sm'
                      : 'bg-gray-100 dark:bg-darkbg text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-darkbg-hover'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 max-h-[560px] overflow-y-auto pr-1">
              {filteredProducts.map((p) => (
                <div
                  key={p.id}
                  onClick={() => addToCart(p)}
                  className="p-3.5 rounded-xl border border-gray-200 dark:border-darkbg-border hover:border-navy dark:hover:border-greige hover:shadow-md transition-all cursor-pointer bg-gray-50/50 dark:bg-darkbg/40 flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <span className="font-mono text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase">{p.sku}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/10 text-emerald-600">
                        {p.stock_quantity} in stock
                      </span>
                    </div>
                    <h4 className="font-semibold text-xs mt-1 text-gray-900 dark:text-white line-clamp-2 group-hover:text-navy dark:group-hover:text-blue-400">
                      {p.name}
                    </h4>
                    <p className="text-[10px] text-gray-400 mt-0.5">{p.brand} • {p.category_name}</p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-gray-100 dark:border-darkbg-border flex items-center justify-between">
                    <span className="text-sm font-bold text-navy dark:text-greige">
                      PHP {Number(p.selling_price).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                    <button
                      className="p-1 rounded-md bg-navy text-white hover:bg-navy-light text-xs font-bold"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Checkout & Cart Panel (5 cols) */}
          <div className="lg:col-span-5 bg-white dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-border rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-darkbg-border pb-3">
              <div>
                <h3 className="font-bold text-sm text-gray-900 dark:text-white">Active Customer Cart</h3>
                <p className="text-[11px] text-gray-400">{cart.length} unique items added</p>
              </div>
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 font-medium"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear Cart
                </button>
              )}
            </div>

            {/* Customer Details */}
            <div className="space-y-1 text-xs">
              <label className="font-semibold text-gray-700 dark:text-gray-300">Customer Name / Account</label>
              <input
                type="text"
                placeholder="Walk-in Customer"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-darkbg-border bg-gray-50 dark:bg-darkbg"
              />
            </div>

            {/* Cart Items List */}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {cart.length === 0 ? (
                <div className="py-8 text-center text-gray-400 text-xs">
                  <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  Cart is empty. Click items on the catalog to add.
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.product_id}
                    className="p-2.5 rounded-lg bg-gray-50 dark:bg-darkbg border border-gray-200 dark:border-darkbg-border flex items-center justify-between text-xs"
                  >
                    <div className="flex-1 pr-2">
                      <p className="font-semibold text-gray-900 dark:text-white truncate">{item.name}</p>
                      <p className="text-[10px] text-gray-400 font-mono">{item.sku} • PHP {item.unit_price.toLocaleString()}</p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => updateQuantity(item.product_id, -1)}
                        className="p-1 rounded bg-gray-200 dark:bg-darkbg-hover hover:bg-gray-300"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center font-bold">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product_id, 1)}
                        className="p-1 rounded bg-gray-200 dark:bg-darkbg-hover hover:bg-gray-300"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <span className="w-20 text-right font-mono font-bold">
                        PHP {(item.unit_price * item.quantity).toLocaleString()}
                      </span>
                      <button
                        onClick={() => removeFromCart(item.product_id)}
                        className="p-1 text-red-500 hover:text-red-700 ml-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Bill Summary */}
            <div className="pt-3 border-t border-gray-100 dark:border-darkbg-border space-y-1.5 text-xs">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal (Net):</span>
                <span className="font-mono">PHP {subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>VAT (12%):</span>
                <span className="font-mono">PHP {vatAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-navy dark:text-white pt-1 border-t border-gray-200 dark:border-darkbg-border">
                <span>Total Amount Due:</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400">
                  PHP {totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-darkbg-border">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Payment Method</label>
              <div className="grid grid-cols-3 gap-2">
                {['Cash', 'Card', 'GCash'].map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={`py-2 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                      paymentMethod === method
                        ? 'bg-navy text-white border-navy shadow-sm'
                        : 'bg-gray-50 dark:bg-darkbg text-gray-700 dark:text-gray-300 border-gray-200 dark:border-darkbg-border hover:bg-gray-100'
                    }`}
                  >
                    {method === 'Cash' && <Banknote className="w-4 h-4" />}
                    {method === 'Card' && <CreditCard className="w-4 h-4" />}
                    {method === 'GCash' && <Smartphone className="w-4 h-4" />}
                    {method}
                  </button>
                ))}
              </div>
            </div>

            {/* Cash Tender & Change Calculations */}
            {paymentMethod === 'Cash' && (
              <div className="space-y-2 text-xs bg-gray-50 dark:bg-darkbg p-3 rounded-lg border border-gray-200 dark:border-darkbg-border">
                <div className="flex items-center justify-between">
                  <label className="font-semibold">Amount Tendered (PHP):</label>
                  <input
                    type="number"
                    min={totalAmount}
                    placeholder="Enter cash given"
                    value={amountTendered}
                    onChange={(e) => setAmountTendered(e.target.value)}
                    className="w-36 px-2.5 py-1.5 rounded border border-gray-300 dark:border-darkbg-border bg-white dark:bg-darkbg-card text-right font-mono font-bold"
                  />
                </div>
                <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-200 dark:border-darkbg-border">
                  <span className="font-semibold text-gray-600 dark:text-gray-400">Change Due:</span>
                  <span className="font-mono font-bold text-sm text-emerald-600">
                    PHP {changeAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            )}

            {/* Card / GCash Reference Input */}
            {(paymentMethod === 'Card' || paymentMethod === 'GCash') && (
              <div className="text-xs space-y-1">
                <label className="font-semibold text-gray-700 dark:text-gray-300">
                  {paymentMethod} Reference / Approval Code:
                </label>
                <input
                  type="text"
                  placeholder="e.g. GCASH-REF-88912 or Card Auth #991"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-darkbg-border bg-gray-50 dark:bg-darkbg"
                />
              </div>
            )}

            {/* Checkout Button */}
            <button
              onClick={handleCheckout}
              disabled={isCheckingOut || cart.length === 0}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
            >
              {isCheckingOut ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Processing Transaction in MySQL...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  Complete Checkout (PHP {totalAmount.toLocaleString()})
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* VIEW: SALES HISTORY */}
      {activeTab === 'sales_history' && (
        <div className="bg-white dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-border rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Completed Sales Transactions</h2>
              <p className="text-xs text-gray-500">Historical transaction ledger saved directly into MySQL database</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-darkbg text-gray-500 dark:text-gray-400 uppercase font-semibold border-b border-gray-200 dark:border-darkbg-border">
                <tr>
                  <th className="py-3 px-3">Invoice Number</th>
                  <th className="py-3 px-3">Date & Time</th>
                  <th className="py-3 px-3">Customer</th>
                  <th className="py-3 px-3">Cashier</th>
                  <th className="py-3 px-3 text-right">Subtotal</th>
                  <th className="py-3 px-3 text-right">12% VAT</th>
                  <th className="py-3 px-3 text-right">Total Amount</th>
                  <th className="py-3 px-3 text-center">Payment</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-darkbg-border text-gray-800 dark:text-gray-200">
                {salesHistory.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50/50 dark:hover:bg-darkbg-hover/50">
                    <td className="py-2.5 px-3 font-mono font-bold text-navy dark:text-blue-400">{s.invoice_number}</td>
                    <td className="py-2.5 px-3 text-gray-500">{s.created_at}</td>
                    <td className="py-2.5 px-3 font-medium">{s.customer_name}</td>
                    <td className="py-2.5 px-3 text-gray-600 dark:text-gray-400">{s.cashier}</td>
                    <td className="py-2.5 px-3 text-right font-mono">PHP {Number(s.subtotal).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-gray-400">PHP {Number(s.vat_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600">PHP {Number(s.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-navy/10 text-navy dark:text-greige">
                        {s.payment_method}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600">
                        Completed
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => handleViewReceipt(s.id)}
                        className="px-2.5 py-1 rounded bg-navy text-white text-[11px] font-semibold hover:bg-navy-light flex items-center gap-1 ml-auto"
                      >
                        <Eye className="w-3 h-3" />
                        Receipt
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW: RECEIPTS ARCHIVE */}
      {activeTab === 'receipts' && (
        <div className="bg-white dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-border rounded-xl p-6 shadow-sm space-y-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Digital Receipts Lookup</h2>
            <p className="text-xs text-gray-500">Search customer receipts by invoice number or customer name</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {salesHistory.map((s) => (
              <div key={s.id} className="p-4 rounded-xl border border-gray-200 dark:border-darkbg-border bg-gray-50/50 dark:bg-darkbg/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-navy dark:text-blue-400">{s.invoice_number}</span>
                  <span className="text-[10px] text-gray-400">{s.created_at?.substring(0, 10)}</span>
                </div>
                <div className="text-xs space-y-1 text-gray-600 dark:text-gray-300">
                  <p>Customer: <strong>{s.customer_name}</strong></p>
                  <p>Payment: <strong>{s.payment_method}</strong></p>
                  <p className="text-sm font-bold text-emerald-600 font-mono pt-1">
                    PHP {Number(s.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <button
                  onClick={() => handleViewReceipt(s.id)}
                  className="w-full mt-2 py-1.5 rounded-lg bg-navy hover:bg-navy-light text-white text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  View & Print Receipt
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW: PRODUCT LOOKUP */}
      {activeTab === 'product_lookup' && (
        <div className="bg-white dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-border rounded-xl p-6 shadow-sm space-y-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Customer Product & Price Lookup</h2>
            <p className="text-xs text-gray-500">Quickly check specifications, availability, and retail price during customer consultations</p>
          </div>

          <div className="relative max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by SKU, product name, or brand..."
              value={lookupQuery}
              onChange={(e) => setLookupQuery(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-gray-200 dark:border-darkbg-border bg-gray-50 dark:bg-darkbg text-gray-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {posProducts
              .filter(p => !lookupQuery || p.name.toLowerCase().includes(lookupQuery.toLowerCase()) || p.sku.toLowerCase().includes(lookupQuery.toLowerCase()))
              .map((p) => (
                <div key={p.id} className="p-4 rounded-xl border border-gray-200 dark:border-darkbg-border bg-gray-50/50 dark:bg-darkbg/40 space-y-2">
                  <div className="flex items-start justify-between">
                    <span className="font-mono text-xs font-bold text-navy dark:text-blue-400">{p.sku}</span>
                    <span className="text-xs px-2 py-0.5 rounded font-bold bg-emerald-500/10 text-emerald-600">
                      {p.stock_quantity} available
                    </span>
                  </div>
                  <h4 className="font-semibold text-sm text-gray-900 dark:text-white">{p.name}</h4>
                  <p className="text-xs text-gray-500">{p.brand} • {p.category_name}</p>
                  <p className="text-lg font-bold text-navy dark:text-greige pt-2 font-mono">
                    PHP {Number(p.selling_price).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* VIEW: SHIFT SUMMARY */}
      {activeTab === 'shift_summary' && (
        <div className="bg-white dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-border rounded-xl p-6 shadow-sm max-w-2xl mx-auto space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-darkbg-border">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Cashier Shift Summary</h2>
              <p className="text-xs text-gray-500">Register drawer balance and shift reconciliation</p>
            </div>
            {currentShift ? (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                ACTIVE SHIFT #{currentShift.id}
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-200 text-gray-600">
                NO ACTIVE SHIFT
              </span>
            )}
          </div>

          {currentShift ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-darkbg border border-gray-200 dark:border-darkbg-border">
                  <p className="text-gray-500">Starting Cash</p>
                  <p className="text-base font-bold font-mono text-gray-900 dark:text-white">
                    PHP {Number(currentShift.starting_cash).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-darkbg border border-gray-200 dark:border-darkbg-border">
                  <p className="text-gray-500">Cash Collections</p>
                  <p className="text-base font-bold font-mono text-emerald-600">
                    PHP {Number(currentShift.cash_sales).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-darkbg border border-gray-200 dark:border-darkbg-border">
                  <p className="text-gray-500">Card Receipts</p>
                  <p className="text-base font-bold font-mono text-blue-600">
                    PHP {Number(currentShift.card_sales).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-darkbg border border-gray-200 dark:border-darkbg-border">
                  <p className="text-gray-500">GCash Receipts</p>
                  <p className="text-base font-bold font-mono text-blue-400">
                    PHP {Number(currentShift.gcash_sales).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-darkbg border border-gray-200 dark:border-darkbg-border">
                  <p className="text-gray-500">Transactions Count</p>
                  <p className="text-base font-bold text-gray-900 dark:text-white">
                    {currentShift.total_transactions}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <p className="text-emerald-700 dark:text-emerald-300 font-semibold">Total Shift Sales</p>
                  <p className="text-base font-bold font-mono text-emerald-700 dark:text-emerald-300">
                    PHP {Number(currentShift.total_sales).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-darkbg-border flex items-center justify-between">
                <span className="text-xs text-gray-500">Shift Started: {currentShift.start_time}</span>
                <button
                  onClick={handleCloseShift}
                  className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1.5"
                >
                  <Lock className="w-4 h-4" />
                  Close Shift & Reconcile
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 space-y-3">
              <p className="text-xs text-gray-500">No shift is currently active for this cashier station.</p>
              <button
                onClick={() => setIsShiftModalOpen(true)}
                className="px-4 py-2 rounded-lg bg-navy hover:bg-navy-light text-white text-xs font-bold inline-flex items-center gap-1.5"
              >
                <Unlock className="w-4 h-4" />
                Open New Cashier Shift
              </button>
            </div>
          )}
        </div>
      )}

      {/* VIEW: MY PROFILE */}
      {activeTab === 'profile' && (
        <div className="bg-white dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-border rounded-xl p-6 shadow-sm max-w-xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-navy text-white text-2xl font-bold flex items-center justify-center shadow-md">
              {user?.full_name?.charAt(0) || 'S'}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{user?.full_name}</h2>
              <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                ROLE: SALES PERSONNEL / CASHIER
              </span>
            </div>
          </div>

          <div className="space-y-3 text-xs border-t border-gray-100 dark:border-darkbg-border pt-4">
            <div className="flex justify-between py-2 border-b border-gray-50 dark:border-darkbg-border">
              <span className="text-gray-500">Cashier ID:</span>
              <span className="font-bold text-gray-900 dark:text-white">{user?.username}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-50 dark:border-darkbg-border">
              <span className="text-gray-500">Official Email:</span>
              <span className="font-bold text-gray-900 dark:text-white">{user?.email}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-50 dark:border-darkbg-border">
              <span className="text-gray-500">Permissions:</span>
              <span className="font-semibold text-emerald-600">POS Checkout, Customer Receipts, Shift Balancing</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-500">Restricted Features:</span>
              <span className="text-red-500 font-medium">User Admin, Inventory Base Cost Editing, ML Workspace (Enforced)</span>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DIGITAL RECEIPT */}
      <Modal isOpen={isReceiptModalOpen} onClose={() => setIsReceiptModalOpen(false)} title="Official Store Receipt" maxWidth="max-w-md">
        {activeReceipt && (
          <div className="space-y-4 text-xs font-mono">
            {/* Store Receipt Header */}
            <div className="text-center space-y-1 pb-3 border-b border-dashed border-gray-300 dark:border-darkbg-border">
              <h3 className="font-extrabold text-base tracking-wider text-navy dark:text-white">TECH AVENUE</h3>
              <p className="text-[11px] text-gray-500">Computer & Accessories Store Management</p>
              <p className="text-[10px] text-gray-400">Cyberzone Tech Hub, Metro Manila, Philippines</p>
              <p className="text-[10px] text-gray-400">VAT Reg TIN: 401-889-223-000</p>
            </div>

            {/* Receipt Meta */}
            <div className="space-y-1 text-[11px] text-gray-600 dark:text-gray-400 pb-2 border-b border-dashed border-gray-300 dark:border-darkbg-border">
              <div className="flex justify-between">
                <span>Invoice #:</span>
                <span className="font-bold text-gray-900 dark:text-white">{activeReceipt.invoice_number}</span>
              </div>
              <div className="flex justify-between">
                <span>Date & Time:</span>
                <span>{activeReceipt.created_at}</span>
              </div>
              <div className="flex justify-between">
                <span>Cashier:</span>
                <span>{activeReceipt.cashier}</span>
              </div>
              <div className="flex justify-between">
                <span>Customer:</span>
                <span>{activeReceipt.customer_name}</span>
              </div>
            </div>

            {/* Receipt Line Items */}
            <div className="space-y-2 py-2 border-b border-dashed border-gray-300 dark:border-darkbg-border">
              <div className="flex justify-between font-bold text-gray-500 uppercase text-[10px]">
                <span>Description</span>
                <span>Qty x Price</span>
                <span>Total</span>
              </div>
              {(activeReceipt.items || []).map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-[11px]">
                  <div className="max-w-[170px] truncate">
                    <p className="font-semibold text-gray-900 dark:text-white">{item.name}</p>
                    <p className="text-[9px] text-gray-400">{item.sku}</p>
                  </div>
                  <span className="text-gray-500">{item.quantity} @ {Number(item.unit_price).toLocaleString()}</span>
                  <span className="font-bold font-mono">PHP {Number(item.total_price).toLocaleString()}</span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="space-y-1 text-xs pt-1">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal (Net):</span>
                <span>PHP {Number(activeReceipt.subtotal).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>VAT (12%):</span>
                <span>PHP {Number(activeReceipt.vat_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-gray-900 dark:text-white pt-1 border-t border-gray-200 dark:border-darkbg-border">
                <span>TOTAL AMOUNT:</span>
                <span>PHP {Number(activeReceipt.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-gray-500 pt-1">
                <span>Payment Method:</span>
                <span className="font-semibold uppercase">{activeReceipt.payment_method}</span>
              </div>
              {activeReceipt.payment_method === 'Cash' && (
                <>
                  <div className="flex justify-between text-gray-500">
                    <span>Amount Tendered:</span>
                    <span>PHP {Number(activeReceipt.amount_tendered).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>Change:</span>
                    <span>PHP {Number(activeReceipt.change_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                </>
              )}
            </div>

            {/* Footer Message */}
            <div className="text-center pt-3 border-t border-dashed border-gray-300 dark:border-darkbg-border text-[10px] text-gray-400 space-y-1">
              <p>Thank you for purchasing at TECH AVENUE!</p>
              <p>Items eligible for 7-day replacement with this receipt.</p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-3">
              <button
                onClick={() => window.print()}
                className="px-3 py-1.5 rounded-lg bg-navy hover:bg-navy-light text-white text-xs font-semibold flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Receipt
              </button>
              <button
                onClick={() => setIsReceiptModalOpen(false)}
                className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-darkbg text-gray-700 dark:text-gray-300 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL: OPEN SHIFT */}
      <Modal isOpen={isShiftModalOpen} onClose={() => setIsShiftModalOpen(false)} title="Open Cashier Register Shift">
        <div className="space-y-4 text-xs">
          <p className="text-gray-600 dark:text-gray-300">
            Enter the verified cash drawer float amount before opening this sales station.
          </p>
          <div>
            <label className="block font-semibold mb-1">Starting Float Cash (PHP) *</label>
            <input
              type="number"
              min="0"
              value={shiftStartingCash}
              onChange={(e) => setShiftStartingCash(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-darkbg-border bg-gray-50 dark:bg-darkbg font-mono font-bold text-base"
            />
          </div>
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-darkbg-border">
            <button
              onClick={() => setIsShiftModalOpen(false)}
              className="px-4 py-2 rounded-lg text-gray-600 bg-gray-100 dark:bg-darkbg"
            >
              Cancel
            </button>
            <button
              onClick={handleOpenShift}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              Start Shift
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

