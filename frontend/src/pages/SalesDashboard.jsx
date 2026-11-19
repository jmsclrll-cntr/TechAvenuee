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
  UserCheck,
  Download,
  LayoutGrid,
  List,
  X
} from 'lucide-react';
import StatCard from '../components/StatCard';
import { ResponsiveLineChart, ResponsiveBarChart, ResponsiveDonutChart } from '../components/Charts';
import Modal from '../components/Modal';
import ProductDetailModal from '../components/ProductDetailModal';
import { api } from '../api';
import { printInventory } from '../utils/printInventory';
import OfficialReceiptModal from '../components/OfficialReceiptModal';
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
  const [salesHistorySearch, setSalesHistorySearch] = useState('');
  const [dateFilter, setDateFilter] = useState('all'); // 'all', 'today', 'week', 'month', 'custom'
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [amountTendered, setAmountTendered] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Modals
  const [activeReceipt, setActiveReceipt] = useState(null);
  const [receiptSearchQuery, setReceiptSearchQuery] = useState('');
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(null);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [shiftStartingCash, setShiftStartingCash] = useState(3000);

  // Product Lookup state
  const [lookupQuery, setLookupQuery] = useState('');
  const [suppliers, setSuppliers] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [inventoryProducts, setInventoryProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [lookupViewMode, setLookupViewMode] = useState('grid');
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [productImageFile, setProductImageFile] = useState(null);
  const [productImagePreview, setProductImagePreview] = useState(null);
  const [newProduct, setNewProduct] = useState({
    sku: '',
    name: '',
    brand: '',
    category_id: 1,
    cost_price: '',
    selling_price: '',
    stock_quantity: 10,
    description: ''
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, posRes, salesRes, shiftRes, suppliersRes, invRes] = await Promise.all([
        api.getDashboardStats('sales_personnel'),
        api.getPosProducts(),
        api.getSalesHistory(),
        api.getCurrentShift(),
        api.getSuppliers(),
        api.getInventory()
      ]);

      if (statsRes.status === 'success') setStats(statsRes.data);
      if (posRes.status === 'success') setPosProducts(posRes.products);
      if (salesRes.status === 'success') setSalesHistory(salesRes.transactions);
      if (shiftRes.status === 'success') setCurrentShift(shiftRes.shift);
      if (suppliersRes.status === 'success') setSuppliers(suppliersRes.suppliers || []);
      if (invRes.status === 'success') {
        setInventoryProducts(invRes.products || []);
        setCategories(invRes.categories || []);
        if (invRes.categories && invRes.categories.length > 0) {
          setNewProduct(prev => prev.category_id ? prev : { ...prev, category_id: invRes.categories[0].id });
        }
      }
    } catch (err) {
      console.error('Error fetching sales data:', err);
    } finally {
      setLoading(false);
    }
  };

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
      alert(`Product "${newProduct.name}" (${newProduct.sku}) added successfully!`);
      setIsAddProductModalOpen(false);
      setNewProduct({
        sku: '',
        name: '',
        brand: '',
        category_id: categories[0]?.id || 1,
        cost_price: '',
        selling_price: '',
        stock_quantity: 10,
        description: ''
      });
      setProductImageFile(null);
      setProductImagePreview(null);
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to add product');
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

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
      const receiptData = res.receipt || res.transaction;
      if (receiptData) {
        setActiveReceipt(receiptData);
        setIsReceiptModalOpen(true);
      } else {
        alert('Could not retrieve receipt data for transaction #' + transactionId);
      }
    } catch (err) {
      console.error('Error fetching receipt:', err);
      alert('Error fetching receipt: ' + err.message);
    }
  };

  const handlePrintReceiptById = async (transactionId) => {
    try {
      const res = await api.getReceipt(transactionId);
      const receiptData = res.receipt || res.transaction;
      if (receiptData) {
        handleSaveReceiptPdf(receiptData);
      }
    } catch (err) {
      alert('Failed to load receipt: ' + err.message);
    }
  };

  // Save Receipt as PDF function (styled 80mm thermal receipt format)
  const handleSaveReceiptPdf = (receipt) => {
    if (!receipt) return;
    const printWindow = window.open('', '_blank', 'width=450,height=700');
    if (!printWindow) {
      alert('Please allow popups to save or print receipt.');
      return;
    }

    const itemsHtml = (receipt.items || []).map(item => `
      <tr>
        <td style="padding: 4px 0; font-weight: 600;">
          ${item.name || item.product_name}
          <div style="font-size: 9px; color: #666; font-weight: normal;">${item.sku || ''}</div>
        </td>
        <td style="padding: 4px 0; text-align: center;">${item.quantity}</td>
        <td style="padding: 4px 0; text-align: right;">₱${Number(item.unit_price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        <td style="padding: 4px 0; text-align: right; font-weight: bold;">₱${Number(item.total_price || (item.quantity * item.unit_price)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
      </tr>
    `).join('');

    const subtotalNet = Number(receipt.subtotal || (Number(receipt.total_amount) / 1.12));
    const vatVal = Number(receipt.vat_amount || (Number(receipt.total_amount) - subtotalNet));
    const discountVal = Number(receipt.discount_amount || 0);
    const discountPctVal = Number(receipt.discount_pct || 0);

    const docContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>receipt_${receipt.invoice_number}.pdf</title>
        <style>
          @page {
            size: 80mm auto;
            margin: 4mm;
          }
          body {
            font-family: 'Courier New', Courier, monospace, -apple-system, sans-serif;
            font-size: 11px;
            color: #111;
            margin: 0;
            padding: 8px;
            width: 72mm;
            background: #fff;
          }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .bold { font-weight: bold; }
          .border-b { border-bottom: 1px dashed #888; padding-bottom: 6px; margin-bottom: 6px; }
          .border-t { border-top: 1px dashed #888; padding-top: 6px; margin-top: 6px; }
          table { width: 100%; border-collapse: collapse; font-size: 10px; }
          th { border-bottom: 1px solid #444; padding-bottom: 3px; font-size: 9px; text-transform: uppercase; }
          .row { display: flex; justify-content: space-between; margin-bottom: 2px; }
          .total-row { display: flex; justify-content: space-between; font-size: 13px; font-weight: 900; margin: 4px 0; }
          .footer { text-align: center; font-size: 9px; color: #555; margin-top: 10px; }
          @media print {
            body { width: 100%; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="text-center border-b">
          <div style="font-size: 15px; font-weight: 900; letter-spacing: 1px;">TECH AVENUE</div>
          <div style="font-size: 9px; font-weight: bold;">COMPUTER & ACCESSORIES STORE</div>
          <div style="font-size: 8px; color: #444;">Unit 402, Cyberzone Tech Plaza, Metro Manila, Philippines</div>
          <div style="font-size: 8px; color: #444;">Tel: (02) 8821-4920 • VAT Reg TIN: 401-889-223-000</div>
          <div style="font-size: 10px; font-weight: bold; margin-top: 4px; text-transform: uppercase;">Official Transaction Receipt</div>
        </div>

        <div class="border-b" style="font-size: 10px;">
          <div class="row"><span>Receipt No:</span><span class="bold">${receipt.invoice_number}</span></div>
          <div class="row"><span>Date & Time:</span><span>${receipt.created_at || new Date().toLocaleString()}</span></div>
          <div class="row"><span>Cashier:</span><span>${receipt.cashier || user?.full_name || 'Sales Staff'}</span></div>
          <div class="row"><span>Customer:</span><span>${receipt.customer_name || 'Walk-in Customer'}</span></div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="text-align: left;">Item</th>
              <th style="text-align: center;">Qty</th>
              <th style="text-align: right;">Price</th>
              <th style="text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="border-t" style="font-size: 10px;">
          <div class="row">
            <span>Subtotal (Net of VAT):</span>
            <span>₱${subtotalNet.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div class="row">
            <span>12% Output VAT:</span>
            <span>₱${vatVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          ${discountVal > 0 ? `
            <div class="row" style="color: #059669;">
              <span>Discount (${discountPctVal}%):</span>
              <span>-₱${discountVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          ` : ''}
          <div class="total-row border-t border-b">
            <span>TOTAL AMOUNT DUE:</span>
            <span>₱${Number(receipt.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div class="row">
            <span>Payment Method:</span>
            <span class="bold">${receipt.payment_method || 'Cash'}</span>
          </div>
          ${(receipt.payment_method === 'Cash' || !receipt.payment_method) ? `
            <div class="row">
              <span>Amount Tendered:</span>
              <span>₱${Number(receipt.amount_tendered || receipt.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div class="row bold">
              <span>Change:</span>
              <span>₱${Number(receipt.change_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          ` : `
            <div class="row">
              <span>Payment Ref / Auth:</span>
              <span>${receipt.payment_reference || 'N/A'}</span>
            </div>
          `}
        </div>

        <div class="footer">
          <div class="bold">THANK YOU FOR YOUR PURCHASE!</div>
          <div>Items eligible for 7-day warranty/replacement with this receipt.</div>
          <div style="font-size: 8px; margin-top: 4px;">*** THIS SERVES AS AN OFFICIAL RECEIPT ***</div>
        </div>

        <script>
          window.onload = function() {
            window.document.title = "receipt_" + "${receipt.invoice_number}" + ".pdf";
            window.print();
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(docContent);
    printWindow.document.close();
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

    // Date filtering logic for Sales History
  const filteredSalesHistory = salesHistory.filter(s => {
    // Search query check
    if (salesHistorySearch) {
      const q = salesHistorySearch.toLowerCase();
      const matchesSearch = (s.invoice_number || '').toLowerCase().includes(q) ||
                            (s.customer_name || '').toLowerCase().includes(q) ||
                            (s.cashier || s.cashier_name || '').toLowerCase().includes(q);
      if (!matchesSearch) return false;
    }

    // Date range check
    if (dateFilter === 'all') return true;

    const rawDate = s.created_at || s.transaction_date;
    if (!rawDate) return true;
    const txDate = new Date(rawDate);
    if (isNaN(txDate.getTime())) return true;

    const now = new Date();

    if (dateFilter === 'today') {
      return txDate.toDateString() === now.toDateString();
    }

    if (dateFilter === 'week') {
      const startOfWeek = new Date(now);
      const day = now.getDay() || 7; // get current day of week (1=Mon ... 7=Sun)
      if (day !== 1) startOfWeek.setHours(-24 * (day - 1));
      startOfWeek.setHours(0, 0, 0, 0);
      return txDate >= startOfWeek;
    }

    if (dateFilter === 'month') {
      return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
    }

    if (dateFilter === 'custom') {
      if (customStartDate) {
        const start = new Date(customStartDate);
        start.setHours(0, 0, 0, 0);
        if (txDate < start) return false;
      }
      if (customEndDate) {
        const end = new Date(customEndDate);
        end.setHours(23, 59, 59, 999);
        if (txDate > end) return false;
      }
      return true;
    }

    return true;
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
          <div className="bg-[#1C1917] border border-[#292524] p-5 rounded-2xl text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#14B8A6] animate-pulse"></span>
                <span className="text-xs font-bold uppercase tracking-wider text-orange-400">Register Ready &bull; Live Operations</span>
              </div>
              <h2 className="text-lg font-black tracking-tight mt-0.5 text-white">
                Quick Sales Actions &amp; Transaction Flow
              </h2>
              <p className="text-xs text-stone-400 mt-0.5">
                Prepare draft customer quotations or immediately process checkout in Point of Sale &amp; Drafts.
              </p>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setActiveTab('pos')}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#14B8A6] hover:bg-[#0F766E] text-white font-bold text-xs shadow-md transition"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Point of Sale &amp; Drafts</span>
              </button>
            </div>
          </div>

          {/* Low-Stock Notifications for Cashiers */}
          {posProducts.filter(p => p.stock_quantity > 0 && (p.stock_quantity <= 5 || p.status === 'low_stock')).length > 0 && (
            <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl flex items-center justify-between text-xs text-amber-900 dark:text-amber-200">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <span className="font-bold">Inventory Low-Stock Warning: </span>
                  <span>{posProducts.filter(p => p.stock_quantity > 0 && (p.stock_quantity <= 5 || p.status === 'low_stock')).length} products have reached critical low stock (≤ 5 units). Check available units before confirming sales.</span>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
            <div className="bg-[#1C1917] border border-[#292524] rounded-xl p-5 shadow-sm">
              <ResponsiveLineChart
                title="Hourly Sales Trend Today (PHP)"
                data={charts.hourly_sales || []}
                xKey="hour"
                yKey="sales"
                strokeColor="#14B8A6"
              />
            </div>
            <div className="bg-[#1C1917] border border-[#292524] rounded-xl p-5 shadow-sm">
              <ResponsiveBarChart
                title="Daily Transaction Count"
                data={charts.daily_transactions || []}
                xKey="day"
                yKey="transactions"
                barColor="#14B8A6"
              />
            </div>
            <div className="bg-[#1C1917] border border-[#292524] rounded-xl p-5 shadow-sm">
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
            <div className="bg-[#1C1917] border border-[#292524] rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-[#14B8A6]" />
                  <h3 className="font-bold text-sm text-[#FAFAF9]">Recent Completed Transactions</h3>
                </div>
                <button
                  onClick={() => setActiveTab('sales_history')}
                  className="text-xs text-[#14B8A6] hover:underline font-semibold"
                >
                  View All History
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#141210] text-stone-400 uppercase font-extrabold border-b border-[#292524]">
                    <tr>
                      <th className="py-2.5 px-3">Invoice #</th>
                      <th className="py-2.5 px-3">Date/Time</th>
                      <th className="py-2.5 px-3 text-right">Total</th>
                      <th className="py-2.5 px-3 text-center">Payment</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#292524] text-stone-200">
                    {(tables.recent_transactions || []).slice(0, 5).map((t) => (
                      <tr key={t.id} className="hover:bg-[#292524]/50">
                        <td className="py-2.5 px-3 font-mono font-medium text-[#14B8A6]">{t.invoice_number}</td>
                        <td className="py-2.5 px-3 text-gray-500">{t.created_at?.substring(5, 16)}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold">PHP {Number(t.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-navy/10 text-[#14B8A6]">
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
                            className="p-1 rounded bg-[#141210] hover:bg-[#292524] text-[#14B8A6]"
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
            <div className="bg-[#1C1917] border border-[#292524] rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  <h3 className="font-bold text-sm text-[#FAFAF9]">Best-Selling Items Today</h3>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#141210] text-stone-400 uppercase font-extrabold border-b border-[#292524]">
                    <tr>
                      <th className="py-2.5 px-3">Product Name</th>
                      <th className="py-2.5 px-3">SKU</th>
                      <th className="py-2.5 px-3 text-center">Units Sold</th>
                      <th className="py-2.5 px-3 text-right">Gross Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#292524] text-stone-200">
                    {(tables.best_selling_today || []).map((p, idx) => (
                      <tr key={idx} className="hover:bg-[#292524]/50">
                        <td className="py-2.5 px-3 font-medium truncate max-w-[170px]">{p.name}</td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-gray-400">{p.sku}</td>
                        <td className="py-2.5 px-3 text-center font-bold text-[#14B8A6]">{p.units_sold}</td>
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
        />
      )}

      {/* LEGACY COMBINED VIEW (DISABLED) */}
      {false && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Product Catalog (7 cols) */}
          <div className="lg:col-span-7 bg-[#1C1917] border border-[#292524] rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-[#FAFAF9] flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-[#14B8A6]" />
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
                  className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-[#292524] bg-[#141210] text-[#FAFAF9] focus:outline-none focus:ring-1 focus:ring-navy"
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
                      : 'bg-[#141210] text-stone-300 hover:bg-[#292524]'
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
                  className="p-3.5 rounded-xl border border-[#292524] hover:border-[#14B8A6] hover:shadow-md transition-all cursor-pointer bg-[#141210]/40 flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <span className="font-mono text-[10px] font-bold text-stone-500 uppercase">{p.sku}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/10 text-emerald-600">
                        {p.stock_quantity} in stock
                      </span>
                    </div>
                    <h4 className="font-semibold text-xs mt-1 text-[#FAFAF9] line-clamp-2 group-hover:text-[#14B8A6]">
                      {p.name}
                    </h4>
                    <p className="text-[10px] text-gray-400 mt-0.5">{p.brand} • {p.category_name}</p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-gray-100 dark:border-darkbg-border flex items-center justify-between">
                    <span className="text-sm font-bold text-[#14B8A6]">
                      PHP {Number(p.selling_price).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                    <button
                      className="p-1 rounded-md bg-[#F97316] text-white hover:bg-orange-600 text-xs font-bold transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Checkout & Cart Panel (5 cols) */}
          <div className="lg:col-span-5 bg-[#1C1917] border border-[#292524] rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-darkbg-border pb-3">
              <div>
                <h3 className="font-bold text-sm text-[#FAFAF9]">Active Customer Cart</h3>
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
              <label className="font-semibold text-stone-300">Customer Name / Account</label>
              <input
                type="text"
                placeholder="Walk-in Customer"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-[#292524] bg-[#141210]"
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
                    className="p-2.5 rounded-lg bg-[#141210] border border-[#292524] flex items-center justify-between text-xs"
                  >
                    <div className="flex-1 pr-2">
                      <p className="font-semibold text-[#FAFAF9] truncate">{item.name}</p>
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
              <div className="flex justify-between text-base font-bold text-[#14B8A6] dark:text-white pt-1 border-t border-[#292524]">
                <span>Total Amount Due:</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400">
                  PHP {totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-darkbg-border">
              <label className="text-xs font-semibold text-stone-300">Payment Method</label>
              <div className="grid grid-cols-3 gap-2">
                {['Cash', 'Card', 'GCash'].map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={`py-2 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                      paymentMethod === method
                        ? 'bg-navy text-white border-navy shadow-sm'
                        : 'bg-[#141210] text-stone-300 border-[#292524] hover:bg-gray-100'
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
              <div className="space-y-2 text-xs bg-[#141210] p-3 rounded-lg border border-[#292524]">
                <div className="flex items-center justify-between">
                  <label className="font-semibold">Amount Tendered (PHP):</label>
                  <input
                    type="number"
                    min={totalAmount}
                    placeholder="Enter cash given"
                    value={amountTendered}
                    onChange={(e) => setAmountTendered(e.target.value)}
                    className="w-36 px-2.5 py-1.5 rounded border border-gray-300 dark:border-darkbg-border bg-[#1C1917] text-right font-mono font-bold"
                  />
                </div>
                <div className="flex items-center justify-between text-xs pt-1 border-t border-[#292524]">
                  <span className="font-semibold text-stone-400">Change Due:</span>
                  <span className="font-mono font-bold text-sm text-emerald-600">
                    PHP {changeAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            )}

            {/* Card / GCash Reference Input */}
            {(paymentMethod === 'Card' || paymentMethod === 'GCash') && (
              <div className="text-xs space-y-1">
                <label className="font-semibold text-stone-300">
                  {paymentMethod} Reference / Approval Code:
                </label>
                <input
                  type="text"
                  placeholder="e.g. GCASH-REF-88912 or Card Auth #991"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-[#292524] bg-[#141210]"
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

      {/* VIEW: SALES HISTORY & RECEIPTS */}
      {(activeTab === 'sales_history' || activeTab === 'receipts') && (
        <div className="bg-[#1C1917] border border-[#292524] rounded-2xl p-4 sm:p-6 shadow-sm space-y-5">
          {/* Header Title & Dynamic Counter */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#292524]">
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-xl sm:text-2xl font-black text-[#FAFAF9] tracking-tight">
                  Sales History & Receipts
                </h2>
                {/* Dynamic Transaction Counter Badge */}
                <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-[#14B8A6]/10 text-[#14B8A6] dark:bg-cyan-500/15 dark:text-cyan-300 border border-navy/20 dark:border-cyan-400/30">
                  Showing {filteredSalesHistory.length} of {salesHistory.length} Transactions
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
                Historical transaction ledger and verified official receipts saved in MySQL
              </p>
            </div>

            {/* Quick Actions (e.g. Export / Jump to POS) */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('pos')}
                className="px-3.5 py-2 text-xs font-bold rounded-xl bg-navy hover:bg-navy-light text-white shadow-sm transition-all cursor-pointer"
              >
                + New Sale / POS
              </button>
            </div>
          </div>

          {/* Filter Toolbar: Search Bar + Date Range Dropdown & Custom Pickers */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-slate-50 dark:bg-darkbg p-3.5 rounded-xl border border-[#292524]">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search by OR#, customer, or cashier..."
                value={salesHistorySearch}
                onChange={(e) => setSalesHistorySearch(e.target.value)}
                className="w-full text-xs pl-9 pr-8 py-2.5 rounded-xl border border-[#292524] bg-[#1C1917] text-[#FAFAF9] focus:outline-none focus:ring-2 focus:ring-navy dark:focus:ring-cyan-500/30 font-medium"
              />
              {salesHistorySearch && (
                <button
                  type="button"
                  onClick={() => setSalesHistorySearch('')}
                  className="absolute right-2.5 top-2.5 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Date Range Selector Dropdown */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative min-w-[200px]">
                <Calendar className="w-4 h-4 absolute left-3 top-3 text-slate-400 pointer-events-none" />
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full text-xs pl-9 pr-4 py-2.5 rounded-xl border border-[#292524] bg-[#1C1917] text-[#FAFAF9] focus:outline-none focus:ring-2 focus:ring-navy dark:focus:ring-cyan-500/30 font-bold cursor-pointer"
                >
                  <option value="all">All Transactions</option>
                  <option value="today">Today's Transactions</option>
                  <option value="week">This Week's Transactions</option>
                  <option value="month">This Month's Transactions</option>
                  <option value="custom">Custom Date Range...</option>
                </select>
              </div>

              {/* Custom Date Pickers (Shown only when 'custom' is selected) */}
              {dateFilter === 'custom' && (
                <div className="flex items-center gap-1.5 animate-in fade-in duration-200">
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="text-xs px-2.5 py-2 rounded-xl border border-[#292524] bg-[#1C1917] text-[#FAFAF9]"
                    title="Start Date"
                  />
                  <span className="text-xs text-slate-400 font-bold">to</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="text-xs px-2.5 py-2 rounded-xl border border-[#292524] bg-[#1C1917] text-[#FAFAF9]"
                    title="End Date"
                  />
                </div>
              )}

              {/* Reset Filters button */}
              {(salesHistorySearch || dateFilter !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setSalesHistorySearch('');
                    setDateFilter('all');
                    setCustomStartDate('');
                    setCustomEndDate('');
                  }}
                  className="px-3 py-2 text-xs font-bold text-stone-300 hover:text-red-500 bg-[#1C1917] rounded-xl border border-[#292524] transition-colors shrink-0"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Desktop & Tablet Table (Horizontal Scrolling, responsive text & touch) */}
          <div className="hidden md:block overflow-x-auto rounded-xl border border-[#292524]">
            <table className="w-full text-center text-xs font-sans">
              <thead className="bg-[#141210] text-stone-300 uppercase font-black text-sm border-b border-[#292524]">
                <tr>
                  <th className="py-3.5 px-3 text-center text-sm font-black whitespace-nowrap">Invoice Number</th>
                  <th className="py-3.5 px-3 text-center text-sm font-black whitespace-nowrap">Date & Time</th>
                  <th className="py-3.5 px-3 text-center text-sm font-black whitespace-nowrap">Customer</th>
                  <th className="py-3.5 px-3 text-center text-sm font-black whitespace-nowrap">Cashier</th>
                  <th className="py-3.5 px-3 text-center text-sm font-black whitespace-nowrap">Subtotal</th>
                  <th className="py-3.5 px-3 text-center text-sm font-black whitespace-nowrap">12% VAT</th>
                  <th className="py-3.5 px-3 text-center text-sm font-black whitespace-nowrap">Total Amount</th>
                  <th className="py-3.5 px-3 text-center text-sm font-black whitespace-nowrap">Payment</th>
                  <th className="py-3.5 px-3 text-center text-sm font-black whitespace-nowrap">Status</th>
                  <th className="py-3.5 px-3 text-center text-sm font-black whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#292524] text-xs font-sans">
                {filteredSalesHistory.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400 font-medium">
                      No transactions match the selected date range and search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredSalesHistory.map((s) => (
                    <tr key={s.id} className="hover:bg-[#292524]/50 transition-colors">
                      <td className="py-3 px-3 text-center text-xs text-white font-sans font-mono whitespace-nowrap">{s.invoice_number}</td>
                      <td className="py-3 px-3 text-center text-xs text-white font-sans whitespace-nowrap">{s.created_at || s.transaction_date}</td>
                      <td className="py-3 px-3 text-center text-xs text-white font-sans whitespace-nowrap font-medium">{s.customer_name || 'Walk-in Customer'}</td>
                      <td className="py-3 px-3 text-center text-xs text-white font-sans whitespace-nowrap">{s.cashier || s.cashier_name || 'Cashier'}</td>
                      <td className="py-3 px-3 text-center text-xs text-white font-sans font-mono whitespace-nowrap">PHP {Number(s.subtotal).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      <td className="py-3 px-3 text-center text-xs text-white font-sans font-mono whitespace-nowrap">PHP {Number(s.vat_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      <td className="py-3 px-3 text-center text-xs text-white font-sans font-mono whitespace-nowrap font-bold text-emerald-400">PHP {Number(s.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      <td className="py-3 px-3 text-center text-xs text-white font-sans whitespace-nowrap">{s.payment_method || 'Cash'}</td>
                      <td className="py-3 px-3 text-center text-xs whitespace-nowrap">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          Completed
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center text-xs whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleViewReceipt(s.id)}
                          className="px-3.5 py-1.5 rounded-xl bg-navy hover:bg-navy-light text-white text-xs font-bold shadow-xs transition cursor-pointer active:scale-95"
                        >
                          View Receipt
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile View: Stacked Transaction Cards (< 768px) */}
          <div className="md:hidden space-y-3">
            {filteredSalesHistory.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 border border-dashed rounded-xl">
                No transactions match the selected date range and search criteria.
              </div>
            ) : (
              filteredSalesHistory.map((s) => (
                <div
                  key={s.id}
                  className="p-4 rounded-xl border border-[#292524] bg-[#141210] space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-navy dark:text-cyan-400">
                      {s.invoice_number}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                      Completed
                    </span>
                  </div>

                  <div className="text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Customer:</span>
                      <span className="font-bold text-[#FAFAF9]">{s.customer_name || 'Walk-in Customer'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Date & Time:</span>
                      <span className="text-stone-300">{s.created_at || s.transaction_date}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Cashier:</span>
                      <span className="text-stone-300">{s.cashier || s.cashier_name || 'Cashier'}</span>
                    </div>
                    <div className="flex justify-between items-baseline pt-1 border-t border-[#292524]">
                      <span className="text-stone-300 font-bold">Total Amount:</span>
                      <span className="font-mono font-black text-sm text-emerald-600 dark:text-emerald-400">
                        PHP {Number(s.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleViewReceipt(s.id)}
                    className="w-full py-2 rounded-xl bg-navy hover:bg-navy-light text-white text-xs font-bold transition-all shadow-xs"
                  >
                    View Receipt
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* VIEW: PRODUCT LOOKUP / INVENTORY */}
      {(activeTab === 'product_lookup' || activeTab === 'inventory') && (
        <div className="bg-[#1C1917] border border-[#292524] rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-[#292524]">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#14B8A6]"></span>
                <span className="text-xs font-bold uppercase tracking-wider text-[#14B8A6]">Store Catalog &amp; Specifications</span>
              </div>
              <h2 className="text-lg font-black tracking-tight text-[#FAFAF9] mt-0.5">
                Product Lookup &amp; Inventory Management
              </h2>
              <p className="text-xs text-stone-400">
                Check specifications, stock levels, and retail prices during customer consultations, or register new catalog items.
              </p>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              {/* Print All Products Button */}
              <button
                type="button"
                onClick={() => printInventory({
                  products: inventoryProducts.length > 0 ? inventoryProducts : posProducts,
                  suppliers,
                  user
                })}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-[#292524] hover:bg-[#3E3835] text-stone-200 border border-[#44403C] text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
                title="Print full catalog with specifications and supplier information"
              >
                <Printer className="w-4 h-4 text-emerald-400" />
                <span>Print All Products (PDF)</span>
              </button>

              {/* Add New Product Button */}
              <button
                type="button"
                onClick={() => setIsAddProductModalOpen(true)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Product</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
              <input
                type="text"
                placeholder="Search by SKU, product name, or brand..."
                value={lookupQuery}
                onChange={(e) => setLookupQuery(e.target.value)}
                className="w-full text-xs pl-9 pr-8 py-2 rounded-lg border border-[#292524] bg-[#141210] text-[#FAFAF9] placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-[#F97316]"
              />
              {lookupQuery && (
                <button
                  type="button"
                  onClick={() => setLookupQuery('')}
                  className="absolute right-2.5 top-2.5 text-stone-400 hover:text-stone-200"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* View Mode Toggle: Grid Cards vs Full Table */}
            <div className="flex items-center gap-1 bg-[#141210] border border-[#292524] p-1 rounded-lg self-end sm:self-auto">
              <button
                type="button"
                onClick={() => setLookupViewMode('grid')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition cursor-pointer ${
                  lookupViewMode === 'grid'
                    ? 'bg-[#292524] text-white shadow-xs'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
                title="Cards Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Grid</span>
              </button>
              <button
                type="button"
                onClick={() => setLookupViewMode('table')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition cursor-pointer ${
                  lookupViewMode === 'table'
                    ? 'bg-[#292524] text-white shadow-xs'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
                title="Full Table View"
              >
                <List className="w-3.5 h-3.5" />
                <span>Table</span>
              </button>
            </div>
          </div>

          {/* List items rendering (Grid or Table) */}
          {(() => {
            const listSource = inventoryProducts.length > 0 ? inventoryProducts : posProducts;
            const displayedItems = listSource.filter(p =>
              !lookupQuery ||
              p.name.toLowerCase().includes(lookupQuery.toLowerCase()) ||
              p.sku.toLowerCase().includes(lookupQuery.toLowerCase()) ||
              (p.brand && p.brand.toLowerCase().includes(lookupQuery.toLowerCase()))
            );

            if (lookupViewMode === 'table') {
              return (
                <div className="overflow-x-auto rounded-lg border border-[#292524]">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[#141210] text-stone-300 uppercase font-extrabold text-[11px] tracking-wide border-b border-[#292524]">
                      <tr>
                        <th className="py-3 px-3">SKU</th>
                        <th className="py-3 px-3">Product Name</th>
                        <th className="py-3 px-3">Brand</th>
                        <th className="py-3 px-3">Category</th>
                        <th className="py-3 px-3 text-right">Retail Price</th>
                        <th className="py-3 px-3 text-center">Stock</th>
                        <th className="py-3 px-3 text-center">Status</th>
                        <th className="py-3 px-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#292524] text-stone-200">
                      {displayedItems.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="py-8 text-center text-stone-400 text-xs">
                            No matching products found.
                          </td>
                        </tr>
                      ) : (
                        displayedItems.map((p) => (
                          <tr
                            key={p.id}
                            onClick={() => { setSelectedProduct(p); setIsDetailModalOpen(true); }}
                            className="hover:bg-[#292524]/70 transition-colors cursor-pointer group"
                          >
                            <td className="py-2.5 px-3 font-mono font-bold text-[#F97316] group-hover:underline">{p.sku}</td>
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
                                <span className="group-hover:text-[#F97316] transition-colors font-bold text-[#FAFAF9]">{p.name}</span>
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-stone-300">{p.brand}</td>
                            <td className="py-2.5 px-3 text-stone-400">{p.category_name}</td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">
                              PHP {Number(p.selling_price).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-2.5 px-3 text-center font-bold">{p.stock_quantity}</td>
                            <td className="py-2.5 px-3 text-center">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                p.stock_quantity === 0 || p.status === 'out_of_stock'
                                  ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                  : (p.stock_quantity <= 5 || p.status === 'low_stock')
                                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              }`}>
                                {p.stock_quantity === 0 || p.status === 'out_of_stock' ? 'Out of Stock' : (p.stock_quantity <= 5 || p.status === 'low_stock') ? 'Low Stock' : 'In Stock'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setSelectedProduct(p); setIsDetailModalOpen(true); }}
                                className="px-2.5 py-1 rounded bg-[#292524] hover:bg-[#3E3835] text-stone-200 text-xs font-semibold border border-[#44403C] transition-colors"
                              >
                                Details
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                {displayedItems.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => { setSelectedProduct(p); setIsDetailModalOpen(true); }}
                    className="p-4 rounded-xl border border-[#292524] bg-[#141210]/40 space-y-2 cursor-pointer hover:border-[#14B8A6] hover:shadow-md transition-all duration-150 group"
                  >
                    <div className="flex items-start justify-between">
                      <span className="font-mono text-xs font-bold text-[#14B8A6]">{p.sku}</span>
                      <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                        p.stock_quantity === 0 || p.status === 'out_of_stock'
                          ? 'bg-red-500/10 text-red-600'
                          : (p.stock_quantity <= 5 || p.status === 'low_stock')
                            ? 'bg-amber-500/10 text-amber-600'
                            : 'bg-emerald-500/10 text-emerald-600'
                      }`}>
                        {p.stock_quantity === 0 || p.status === 'out_of_stock' ? 'Out of Stock' : `${p.stock_quantity} available`}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-[#141210] border border-[#292524] p-1 shrink-0 flex items-center justify-center overflow-hidden">
                        <img
                          src={p.image_url || '/products/desktop.svg'}
                          alt={p.name}
                          className="max-h-full max-w-full object-contain"
                          onError={(e) => { e.target.src = '/products/desktop.svg'; }}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-semibold text-sm text-[#FAFAF9] group-hover:text-[#14B8A6] transition-colors truncate">{p.name}</h4>
                        <p className="text-xs text-stone-400 truncate">{p.brand} &bull; {p.category_name}</p>
                      </div>
                    </div>
                    <div className="flex items-end justify-between pt-2">
                      <p className="text-lg font-bold text-[#14B8A6] font-mono">
                        PHP {Number(p.selling_price).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </p>
                      <span className="text-xs text-stone-400 group-hover:text-[#14B8A6] transition-colors">View details &rarr;</span>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}

          {/* Product Detail Modal */}
          <ProductDetailModal
            isOpen={isDetailModalOpen}
            onClose={() => { setIsDetailModalOpen(false); setSelectedProduct(null); }}
            product={selectedProduct}
            suppliers={suppliers}
            role="sales"
          />
        </div>
      )}

      {/* VIEW: SHIFT SUMMARY */}
      {activeTab === 'shift_summary' && (
        <div className="bg-[#1C1917] border border-[#292524] rounded-xl p-6 shadow-sm max-w-2xl mx-auto space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-darkbg-border">
            <div>
              <h2 className="text-lg font-bold text-[#FAFAF9]">Cashier Shift Summary</h2>
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
                <div className="p-3 rounded-lg bg-[#141210] border border-[#292524]">
                  <p className="text-gray-500">Starting Cash</p>
                  <p className="text-base font-bold font-mono text-[#FAFAF9]">
                    PHP {Number(currentShift.starting_cash).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-[#141210] border border-[#292524]">
                  <p className="text-gray-500">Cash Collections</p>
                  <p className="text-base font-bold font-mono text-emerald-600">
                    PHP {Number(currentShift.cash_sales).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-[#141210] border border-[#292524]">
                  <p className="text-gray-500">Card Receipts</p>
                  <p className="text-base font-bold font-mono text-blue-600">
                    PHP {Number(currentShift.card_sales).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-[#141210] border border-[#292524]">
                  <p className="text-gray-500">GCash Receipts</p>
                  <p className="text-base font-bold font-mono text-blue-400">
                    PHP {Number(currentShift.gcash_sales).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-[#141210] border border-[#292524]">
                  <p className="text-gray-500">Transactions Count</p>
                  <p className="text-base font-bold text-[#FAFAF9]">
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
        <div className="bg-[#1C1917] border border-[#292524] rounded-xl p-6 shadow-sm max-w-xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-navy text-white text-2xl font-bold flex items-center justify-center shadow-md">
              {user?.full_name?.charAt(0) || 'S'}
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#FAFAF9]">{user?.full_name}</h2>
              <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                ROLE: SALES PERSONNEL / CASHIER
              </span>
            </div>
          </div>

          <div className="space-y-3 text-xs border-t border-gray-100 dark:border-darkbg-border pt-4">
            <div className="flex justify-between py-2 border-b border-gray-50 dark:border-darkbg-border">
              <span className="text-gray-500">Cashier ID:</span>
              <span className="font-bold text-[#FAFAF9]">{user?.username}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-50 dark:border-darkbg-border">
              <span className="text-gray-500">Official Email:</span>
              <span className="font-bold text-[#FAFAF9]">{user?.email}</span>
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

      {/* OFFICIAL TRANSACTION RECEIPT MODAL (Dark Navy Theme) */}
      <OfficialReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        receipt={activeReceipt}
      />

{/* MODAL: OPEN SHIFT */}
      <Modal isOpen={isShiftModalOpen} onClose={() => setIsShiftModalOpen(false)} title="Open Cashier Register Shift">
        <div className="space-y-4 text-xs">
          <p className="text-stone-300">
            Enter the verified cash drawer float amount before opening this sales station.
          </p>
          <div>
            <label className="block font-semibold mb-1">Starting Float Cash (PHP) *</label>
            <input
              type="number"
              min="0"
              value={shiftStartingCash}
              onChange={(e) => setShiftStartingCash(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg border border-[#292524] bg-[#141210] font-mono font-bold text-base"
            />
          </div>
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-darkbg-border">
            <button
              onClick={() => setIsShiftModalOpen(false)}
              className="px-4 py-2 rounded-lg text-gray-600 bg-[#141210]"
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

      {/* MODAL: ADD PRODUCT (SALES PERSONNEL) */}
      <Modal isOpen={isAddProductModalOpen} onClose={() => setIsAddProductModalOpen(false)} title="Add Product to Store Catalog">
        <form onSubmit={handleAddProduct} className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-stone-300">SKU *</label>
              <input
                type="text"
                required
                placeholder="e.g. LAP-ROG-002"
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
                placeholder="e.g. ASUS"
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
              placeholder="e.g. ASUS ROG Strix G16 Gaming Laptop"
              value={newProduct.name}
              onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[#292524] bg-[#141210] text-[#FAFAF9]"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1 text-stone-300">Category *</label>
            <select
              value={newProduct.category_id}
              onChange={(e) => setNewProduct({ ...newProduct, category_id: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-lg border border-[#292524] bg-[#141210] text-[#FAFAF9]"
            >
              {categories && categories.length > 0 ? (
                categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))
              ) : (
                <option value={1}>Laptops &amp; Ultrabooks</option>
              )}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-stone-300">Cost Price (PHP) *</label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                value={newProduct.cost_price}
                onChange={(e) => setNewProduct({ ...newProduct, cost_price: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[#292524] bg-[#141210] text-[#FAFAF9]"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1 text-stone-300">Selling Price (PHP) *</label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                value={newProduct.selling_price}
                onChange={(e) => setNewProduct({ ...newProduct, selling_price: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[#292524] bg-[#141210] text-emerald-400 font-bold"
              />
            </div>
          </div>
          <div>
            <label className="block font-semibold mb-1 text-stone-300">Initial Stock Quantity (Max 100)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={newProduct.stock_quantity}
              onChange={(e) => setNewProduct({ ...newProduct, stock_quantity: Math.min(100, Math.max(0, Number(e.target.value))) })}
              className="w-full px-3 py-2 rounded-lg border border-[#292524] bg-[#141210] text-[#FAFAF9]"
            />
            <p className="text-[10px] text-stone-500 mt-1">Maximum 100 units limit. Auto-reorder alert triggers at ≤ 5 units.</p>
          </div>

          {/* Optional Product Photo Upload */}
          <div>
            <label className="block font-semibold mb-1 text-stone-300">Product Photo (Optional)</label>
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
                <p className="text-[10px] text-stone-500 mt-0.5">Optional image. Defaults to system placeholder if empty.</p>
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
            <label className="block font-semibold mb-1 text-stone-300">Description / Technical Specifications</label>
            <textarea
              rows="2"
              placeholder="Hardware specs, warranty terms, components..."
              value={newProduct.description}
              onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[#292524] bg-[#141210] text-[#FAFAF9]"
            ></textarea>
          </div>
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#292524]">
            <button
              type="button"
              onClick={() => setIsAddProductModalOpen(false)}
              className="px-3.5 py-1.5 rounded-lg bg-[#292524] hover:bg-[#3E3835] text-stone-300 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-[#F97316] hover:bg-[#EA580C] text-white font-bold"
            >
              Save Product
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

