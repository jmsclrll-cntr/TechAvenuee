import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  Search, 
  Trash2, 
  CreditCard, 
  Banknote, 
  Smartphone, 
  CheckCircle2, 
  AlertCircle, 
  Printer, 
  FileText, 
  RotateCcw, 
  Plus, 
  Minus, 
  Layers, 
  ArrowRight,
  ShieldCheck,
  Receipt as ReceiptIcon,
  X
} from 'lucide-react';
import Modal, { ConfirmDialog } from '../components/Modal';
import { api } from '../api';
import logoImg from '../assets/logo.png';

export default function PointOfSale({ user, initialDraftId, onClearDraft, onNavigateToNewTransaction }) {
  const [products, setProducts] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Active Sale / Cart state
  const [cart, setCart] = useState([]);
  const [activeDraft, setActiveDraft] = useState(null);
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [discountPct, setDiscountPct] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('Cash'); // 'Cash', 'Card', 'GCash'
  const [amountTendered, setAmountTendered] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [notes, setNotes] = useState('');

  // Checkout & Receipt modal state
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [completedTransaction, setCompletedTransaction] = useState(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Drafts selection modal
  const [isDraftsModalOpen, setIsDraftsModalOpen] = useState(false);

  const showFeedback = (msg, type = 'success') => {
    setFeedback({ msg, type });
    setTimeout(() => setFeedback(null), 4500);
  };

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [posRes, draftsRes] = await Promise.all([
        api.getPosProducts(),
        api.getDrafts()
      ]);

      if (posRes.status === 'success') {
        setProducts(posRes.products);
      }
      if (draftsRes.status === 'success') {
        setDrafts(draftsRes.drafts);

        // If an initialDraftId was passed from New Transaction, load it automatically
        if (initialDraftId) {
          const target = draftsRes.drafts.find(d => d.id === initialDraftId);
          if (target) {
            applyDraftToCart(target, posRes.products);
          }
        }
      }
    } catch (err) {
      console.error('Error loading POS catalog:', err);
      showFeedback('Failed to load POS catalog from MySQL.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, [initialDraftId]);

  const applyDraftToCart = (draft, productCatalog = products) => {
    setActiveDraft(draft);
    setCustomerName(draft.customer_name || 'Walk-in Customer');
    setDiscountPct(draft.discount_pct || 0);
    setNotes(draft.notes || '');

    const cartItems = (draft.items || []).map(item => {
      const liveProd = productCatalog.find(p => p.id === item.product_id);
      return {
        product_id: item.product_id,
        name: item.product_name,
        sku: item.sku,
        unit_price: Number(item.unit_price),
        quantity: Number(item.quantity),
        image_url: item.image_url || liveProd?.image_url,
        max_stock: liveProd ? liveProd.stock_quantity : item.quantity
      };
    });

    setCart(cartItems);
    showFeedback(`Loaded Draft ${draft.transaction_number} for customer ${draft.customer_name || 'Walk-in'}!`);
  };

  const handleUnloadDraft = () => {
    setActiveDraft(null);
    setCustomerName('Walk-in Customer');
    setDiscountPct(0);
    setNotes('');
    setCart([]);
    if (onClearDraft) onClearDraft();
    showFeedback('Cleared draft. Started fresh direct sale.', 'info');
  };

  // Cart operations
  const addToCart = (product) => {
    if (product.stock_quantity <= 0) {
      showFeedback(`"${product.name}" is completely out of stock!`, 'error');
      return;
    }

    const existingIndex = cart.findIndex(i => i.product_id === product.id);
    if (existingIndex > -1) {
      const existing = cart[existingIndex];
      if (existing.quantity >= product.stock_quantity) {
        showFeedback(`Available stock limit reached for "${product.name}" (${product.stock_quantity} units available).`, 'error');
        return;
      }
      const updated = [...cart];
      updated[existingIndex].quantity += 1;
      setCart(updated);
    } else {
      setCart([...cart, {
        product_id: product.id,
        name: product.name,
        sku: product.sku,
        unit_price: Number(product.selling_price),
        quantity: 1,
        image_url: product.image_url,
        max_stock: product.stock_quantity
      }]);
    }
  };

  const updateQuantity = (productId, newQty) => {
    if (newQty <= 0) {
      removeFromCart(productId);
      return;
    }
    const item = cart.find(i => i.product_id === productId);
    if (!item) return;

    if (newQty > item.max_stock) {
      showFeedback(`Cannot exceed stock limit (${item.max_stock} units available).`, 'error');
      return;
    }

    setCart(cart.map(i => i.product_id === productId ? { ...i, quantity: newQty } : i));
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(i => i.product_id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setActiveDraft(null);
    if (onClearDraft) onClearDraft();
  };

  // Calculation logic with 12% Philippine VAT standard
  const grossSubtotal = cart.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
  const discountAmount = grossSubtotal * (Number(discountPct) / 100);
  const discountedTotal = Math.max(0, grossSubtotal - discountAmount);
  
  // In the Philippines standard: prices are VAT-inclusive (12%)
  const vatExclusiveSubtotal = +(discountedTotal / 1.12).toFixed(2);
  const vatAmount = +(discountedTotal - vatExclusiveSubtotal).toFixed(2);
  const totalAmountDue = discountedTotal;

  // Tender & Change calculation
  const numericTendered = parseFloat(amountTendered) || 0;
  const changeDue = paymentMethod === 'Cash' ? Math.max(0, numericTendered - totalAmountDue) : 0;
  const isTenderInsufficient = paymentMethod === 'Cash' && numericTendered < totalAmountDue;

  // Checkout submission
  const handleCheckout = async () => {
    if (cart.length === 0) {
      showFeedback('Cart is empty. Add at least one product to checkout.', 'error');
      return;
    }

    if (paymentMethod === 'Cash') {
      if (numericTendered < totalAmountDue) {
        showFeedback(`Amount tendered (PHP ${numericTendered.toFixed(2)}) is less than total due (PHP ${totalAmountDue.toFixed(2)}).`, 'error');
        return;
      }
    } else if (paymentMethod === 'Card' || paymentMethod === 'GCash') {
      if (!paymentReference.trim()) {
        showFeedback(`Please provide reference / authorization code for ${paymentMethod} payment.`, 'error');
        return;
      }
    }

    // Verify stock availability on client side before hitting backend
    for (const item of cart) {
      const liveProd = products.find(p => p.id === item.product_id);
      if (liveProd && item.quantity > liveProd.stock_quantity) {
        showFeedback(`Cannot checkout: "${item.name}" only has ${liveProd.stock_quantity} units in stock.`, 'error');
        return;
      }
    }

    setIsCheckingOut(true);
    try {
      const payload = {
        draft_id: activeDraft ? activeDraft.id : null,
        customer_name: customerName,
        payment_method: paymentMethod,
        amount_tendered: paymentMethod === 'Cash' ? numericTendered : totalAmountDue,
        change_amount: changeDue,
        payment_reference: paymentReference,
        discount_amount: discountAmount,
        discount_pct: Number(discountPct),
        notes: notes,
        items: cart.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price
        }))
      };

      const res = await api.posCheckout(payload);

      if (res.status === 'success') {
        setCompletedTransaction(res.transaction);
        setIsReceiptModalOpen(true);
        showFeedback(`Payment verified! Invoice ${res.transaction.invoice_number} successfully recorded in MySQL.`);

        // Reset POS State
        setCart([]);
        setActiveDraft(null);
        setAmountTendered('');
        setPaymentReference('');
        setNotes('');
        setCustomerName('Walk-in Customer');
        setDiscountPct(0);
        if (onClearDraft) onClearDraft();

        // Refresh products catalog & drafts in background
        loadInitialData();
      } else {
        showFeedback(res.message || 'Checkout failed.', 'error');
      }
    } catch (err) {
      console.error('POS Checkout error:', err);
      showFeedback(`Checkout transaction failed: ${err.message}`, 'error');
    } finally {
      setIsCheckingOut(false);
    }
  };

  // Filter products
  const categories = ['All', 'Laptops', 'Desktops', 'Components', 'Accessories', 'Networking'];
  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.brand && p.brand.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const printReceipt = () => {
    window.print();
  };

  return (
    <div className="p-6 space-y-6">
      {/* Page Title & Status Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200 dark:border-darkbg-border">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-navy dark:text-white tracking-tight flex items-center gap-2">
              <ShoppingCart className="w-7 h-7 text-navy dark:text-greige" />
              Point of Sale (POS Checkout)
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border border-green-300 dark:border-green-700">
              Live Register
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Complete customer checkouts, accept Cash / Card / GCash, atomically decrement MySQL inventory, and issue official receipts.
          </p>
        </div>

        {/* Top actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsDraftsModalOpen(true)}
            className="flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-lg border border-gray-300 dark:border-darkbg-border bg-white dark:bg-darkbg-card text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 shadow-sm transition"
          >
            <FileText className="w-4 h-4 text-blue-500" />
            Resume Saved Draft ({drafts.length})
          </button>

          {onNavigateToNewTransaction && (
            <button
              onClick={onNavigateToNewTransaction}
              className="flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-lg bg-greige text-navy hover:bg-greige-light shadow-sm transition"
            >
              <RotateCcw className="w-4 h-4" />
              New Transaction (Drafts)
            </button>
          )}
        </div>
      </div>

      {/* Notification Toast */}
      {feedback && (
        <div className={`p-4 rounded-xl border text-sm font-semibold flex items-center justify-between shadow-md transition-all ${
          feedback.type === 'error' 
            ? 'bg-red-50 dark:bg-red-950/60 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800' 
            : feedback.type === 'info'
            ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800'
            : 'bg-green-50 dark:bg-green-950/60 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800'
        }`}>
          <div className="flex items-center gap-3">
            {feedback.type === 'error' ? <AlertCircle className="w-5 h-5 shrink-0" /> : <CheckCircle2 className="w-5 h-5 shrink-0" />}
            <span>{feedback.msg}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="opacity-70 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Active Draft Alert Banner */}
      {activeDraft && (
        <div className="p-3.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-300 dark:border-blue-800 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg text-blue-700 dark:text-blue-300">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase text-blue-900 dark:text-blue-200">
                  Processing Draft Order:
                </span>
                <span className="font-mono text-xs font-bold text-navy dark:text-white bg-white dark:bg-darkbg px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                  {activeDraft.transaction_number}
                </span>
              </div>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">
                Customer: <strong>{activeDraft.customer_name || 'Walk-in'}</strong> • Created {new Date(activeDraft.transaction_date).toLocaleString()} • Draft will be completed in MySQL upon payment.
              </p>
            </div>
          </div>
          <button
            onClick={handleUnloadDraft}
            className="text-xs px-3 py-1.5 rounded-lg border border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-200 hover:bg-blue-100 dark:hover:bg-blue-900/60 font-semibold"
          >
            Unload & Switch to Fresh Sale
          </button>
        </div>
      )}

      {/* Main Grid: Catalog (Left) + Checkout / Payment Panel (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left 7 Columns: Product Selection & Catalog */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-border rounded-xl p-4 shadow-sm">
            
            {/* Search & Category Filter */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products by name, SKU, or brand..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-gray-300 dark:border-darkbg-border bg-gray-50 dark:bg-darkbg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-navy"
                />
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                      selectedCategory === cat
                        ? 'bg-navy text-white dark:bg-greige dark:text-navy shadow-sm'
                        : 'bg-gray-100 dark:bg-darkbg text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Product Cards Grid */}
            {loading ? (
              <div className="p-12 text-center text-xs text-gray-500">
                <div className="animate-spin w-6 h-6 border-2 border-navy border-t-transparent rounded-full mx-auto mb-2"></div>
                Loading POS Product Catalog from MySQL...
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="p-12 text-center text-xs text-gray-500">
                No products match the selected criteria.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[560px] overflow-y-auto pr-1">
                {filteredProducts.map(p => {
                  const inCartItem = cart.find(i => i.product_id === p.id);
                  const isOutOfStock = p.stock_quantity <= 0;
                  const isMaxedInCart = inCartItem && inCartItem.quantity >= p.stock_quantity;

                  return (
                    <div 
                      key={p.id}
                      className={`flex flex-col justify-between p-3 rounded-xl border transition-all text-left group ${
                        isOutOfStock
                          ? 'border-red-200 dark:border-red-900/40 bg-red-50/20 dark:bg-red-950/20 opacity-60'
                          : 'border-gray-200 dark:border-darkbg-border bg-gray-50/50 dark:bg-darkbg hover:border-navy dark:hover:border-greige hover:shadow-md'
                      }`}
                    >
                      <div>
                        {/* Thumbnail Image */}
                        <div className="w-full h-24 bg-white dark:bg-darkbg-card rounded-lg border border-gray-200 dark:border-darkbg-border p-2 mb-2 flex items-center justify-center overflow-hidden">
                          <img
                            src={p.image_url || '/products/default.svg'}
                            alt={p.name}
                            className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform"
                            onError={(e) => { e.target.src = '/products/default.svg'; }}
                          />
                        </div>

                        {/* SKU & Category badge */}
                        <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1">
                          <span className="font-mono">{p.sku}</span>
                          <span className="truncate max-w-[80px]">{p.category}</span>
                        </div>

                        {/* Name */}
                        <h4 className="text-xs font-bold text-gray-900 dark:text-white line-clamp-2 leading-snug" title={p.name}>
                          {p.name}
                        </h4>
                      </div>

                      {/* Price & Stock & Add Button */}
                      <div className="mt-3 pt-2 border-t border-gray-200 dark:border-darkbg-border">
                        <div className="flex items-baseline justify-between mb-2">
                          <span className="text-xs font-black text-navy dark:text-greige">
                            PHP {Number(p.selling_price).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            isOutOfStock 
                              ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' 
                              : p.stock_quantity <= (p.reorder_level || 5)
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                              : 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                          }`}>
                            {p.stock_quantity} in stock
                          </span>
                        </div>

                        <button
                          type="button"
                          disabled={isOutOfStock || isMaxedInCart}
                          onClick={() => addToCart(p)}
                          className={`w-full py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                            isOutOfStock
                              ? 'bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                              : isMaxedInCart
                              ? 'bg-amber-200 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 cursor-not-allowed'
                              : inCartItem
                              ? 'bg-navy text-white hover:bg-navy-dark dark:bg-greige dark:text-navy shadow-sm'
                              : 'bg-white dark:bg-darkbg-card border border-navy/40 dark:border-greige/40 text-navy dark:text-greige hover:bg-navy hover:text-white dark:hover:bg-greige dark:hover:text-navy'
                          }`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                          {isOutOfStock 
                            ? 'Out of Stock' 
                            : isMaxedInCart 
                            ? `Max (${inCartItem.quantity})` 
                            : inCartItem 
                            ? `Add More (${inCartItem.quantity})` 
                            : 'Add to Cart'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right 5 Columns: Cart, Totals, Payment & Final Checkout */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-border rounded-xl p-5 shadow-sm space-y-4">
            
            {/* Header of Checkout */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-darkbg-border">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-navy dark:text-greige" />
                <h3 className="text-sm font-black text-gray-900 dark:text-white">
                  Current Sale Cart ({cart.reduce((s, i) => s + i.quantity, 0)} items)
                </h3>
              </div>
              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={clearCart}
                  className="text-[11px] text-red-600 hover:text-red-700 dark:text-red-400 flex items-center gap-1 font-semibold"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear Cart
                </button>
              )}
            </div>

            {/* Customer Name & Discount */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-300 mb-1">
                  Customer Name
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Walk-in Customer"
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-darkbg-border bg-gray-50 dark:bg-darkbg text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-navy"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-300 mb-1">
                  Discount (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={discountPct}
                  onChange={(e) => setDiscountPct(Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-darkbg-border bg-gray-50 dark:bg-darkbg text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-navy"
                />
              </div>
            </div>

            {/* Cart Line Items */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1 divide-y divide-gray-100 dark:divide-darkbg-border">
              {cart.length === 0 ? (
                <div className="py-8 text-center text-xs text-gray-400">
                  <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  Cart is empty. Select products from the catalog or load a saved draft.
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.product_id} className="pt-2 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded bg-white dark:bg-darkbg border border-gray-200 dark:border-darkbg-border p-1 shrink-0 flex items-center justify-center">
                        <img 
                          src={item.image_url || '/products/default.svg'} 
                          alt={item.name} 
                          className="max-h-full max-w-full object-contain"
                          onError={(e) => { e.target.src = '/products/default.svg'; }}
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-800 dark:text-gray-100 truncate" title={item.name}>
                          {item.name}
                        </p>
                        <p className="text-[10px] text-gray-400 font-mono">
                          {item.sku} • PHP {item.unit_price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center border border-gray-300 dark:border-darkbg-border rounded-lg bg-gray-50 dark:bg-darkbg">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                          className="p-1 text-gray-500 hover:text-navy dark:hover:text-white"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-7 text-center text-xs font-bold">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                          className="p-1 text-gray-500 hover:text-navy dark:hover:text-white"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <span className="text-xs font-black text-gray-900 dark:text-white w-20 text-right">
                        PHP {(item.unit_price * item.quantity).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>

                      <button
                        type="button"
                        onClick={() => removeFromCart(item.product_id)}
                        className="text-gray-400 hover:text-red-500 p-1"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Price Calculations */}
            <div className="p-3 bg-gray-50 dark:bg-darkbg rounded-xl space-y-1.5 text-xs border border-gray-200 dark:border-darkbg-border">
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Subtotal (Net of VAT)</span>
                <span>PHP {vatExclusiveSubtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>

              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>12% Output VAT</span>
                <span>PHP {vatAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-green-600 dark:text-green-400 font-semibold">
                  <span>Discount ({discountPct}%)</span>
                  <span>- PHP {discountAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
              )}

              <div className="pt-2 border-t border-gray-200 dark:border-darkbg-border flex justify-between items-baseline font-black text-base text-navy dark:text-greige">
                <span>Total Amount Due</span>
                <span>PHP {totalAmountDue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-3 pt-1">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-200">
                Payment Method
              </label>
              
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'Cash', label: 'Cash', icon: Banknote },
                  { id: 'Card', label: 'Card', icon: CreditCard },
                  { id: 'GCash', label: 'GCash', icon: Smartphone }
                ].map(m => {
                  const Icon = m.icon;
                  const isSelected = paymentMethod === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id)}
                      className={`flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-xl border text-xs font-bold transition ${
                        isSelected
                          ? 'border-navy bg-navy text-white dark:border-greige dark:bg-greige dark:text-navy shadow'
                          : 'border-gray-200 dark:border-darkbg-border bg-gray-50 dark:bg-darkbg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{m.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Payment Details Based on Method */}
              {paymentMethod === 'Cash' ? (
                <div className="p-3 bg-gray-50 dark:bg-darkbg rounded-xl border border-gray-200 dark:border-darkbg-border space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                      Amount Tendered (PHP)
                    </label>
                    {/* Quick Tender Presets */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setAmountTendered(totalAmountDue.toString())}
                        className="px-2 py-0.5 text-[10px] font-bold rounded bg-gray-200 dark:bg-gray-700 hover:bg-navy hover:text-white"
                      >
                        Exact
                      </button>
                      <button
                        type="button"
                        onClick={() => setAmountTendered((Math.ceil(totalAmountDue / 500) * 500).toString())}
                        className="px-2 py-0.5 text-[10px] font-bold rounded bg-gray-200 dark:bg-gray-700 hover:bg-navy hover:text-white"
                      >
                        Round 500
                      </button>
                      <button
                        type="button"
                        onClick={() => setAmountTendered((Math.ceil(totalAmountDue / 1000) * 1000).toString())}
                        className="px-2 py-0.5 text-[10px] font-bold rounded bg-gray-200 dark:bg-gray-700 hover:bg-navy hover:text-white"
                      >
                        Round 1000
                      </button>
                    </div>
                  </div>

                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={amountTendered}
                    onChange={(e) => setAmountTendered(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono font-bold rounded-lg border border-gray-300 dark:border-darkbg-border bg-white dark:bg-darkbg-card text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-navy"
                  />

                  {/* Change Calculation Display */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                      Change Due:
                    </span>
                    <span className={`text-sm font-black font-mono ${
                      isTenderInsufficient ? 'text-red-500' : 'text-green-600 dark:text-green-400'
                    }`}>
                      {isTenderInsufficient 
                        ? `Short by PHP ${(totalAmountDue - numericTendered).toLocaleString('en-US', { minimumFractionDigits: 2 })}` 
                        : `PHP ${changeDue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-gray-50 dark:bg-darkbg rounded-xl border border-gray-200 dark:border-darkbg-border space-y-2">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    {paymentMethod === 'Card' ? 'Card Reference / Authorization Code' : 'GCash Reference Number'}
                  </label>
                  <input
                    type="text"
                    placeholder={paymentMethod === 'Card' ? 'e.g. AUTH-98231 (Terminal Ref)' : 'e.g. 100982374612'}
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-darkbg-border bg-white dark:bg-darkbg-card text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-navy"
                  />
                </div>
              )}
            </div>

            {/* Complete Checkout Button */}
            <button
              type="button"
              disabled={isCheckingOut || cart.length === 0 || isTenderInsufficient}
              onClick={handleCheckout}
              className={`w-full py-3 px-4 rounded-xl text-sm font-black tracking-wide flex items-center justify-center gap-2 shadow-lg transition ${
                isCheckingOut || cart.length === 0 || isTenderInsufficient
                  ? 'bg-gray-300 dark:bg-gray-800 text-gray-500 cursor-not-allowed shadow-none'
                  : 'bg-green-600 hover:bg-green-700 text-white shadow-green-600/30'
              }`}
            >
              {isCheckingOut ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>Processing Payment in MySQL...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5" />
                  <span>Complete Checkout • PHP {totalAmountDue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* MODAL 1: Select Draft to Resume */}
      <Modal
        isOpen={isDraftsModalOpen}
        onClose={() => setIsDraftsModalOpen(false)}
        title="Resume Eligible Transaction Draft"
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-xs text-gray-500">
            Select a saved draft created in <strong>New Transaction</strong> to load its line items, customer, and discounts into this POS checkout session.
          </p>

          {drafts.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-500 border border-dashed rounded-xl">
              No saved draft transactions found in MySQL.
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {drafts.map(d => (
                <div
                  key={d.id}
                  className="p-3.5 rounded-xl border border-gray-200 dark:border-darkbg-border hover:border-navy dark:hover:border-greige flex items-center justify-between transition cursor-pointer"
                  onClick={() => {
                    applyDraftToCart(d);
                    setIsDraftsModalOpen(false);
                  }}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-navy dark:text-greige">
                        {d.transaction_number}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200">
                        Draft
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-gray-800 dark:text-gray-100 mt-1">
                      Customer: {d.customer_name || 'Walk-in'} • {d.item_count || d.items?.length || 0} items
                    </p>
                    <p className="text-[10px] text-gray-400">
                      Created: {new Date(d.transaction_date).toLocaleString()}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-black text-navy dark:text-white">
                      PHP {Number(d.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                    <span className="text-xs text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1 justify-end mt-1">
                      Load into POS <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              onClick={() => setIsDraftsModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-gray-100 dark:bg-darkbg text-gray-700 dark:text-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL 2: Printable Official Receipt */}
      <Modal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        title="Official Transaction Receipt"
        size="md"
      >
        {completedTransaction && (
          <div className="space-y-4">
            {/* The printable receipt container */}
            <div 
              id="printable-receipt"
              className="p-6 bg-white dark:bg-white text-gray-900 rounded-xl border border-gray-300 font-sans shadow-sm"
              style={{ minHeight: '400px' }}
            >
              {/* Receipt Header */}
              <div className="text-center pb-4 border-b border-dashed border-gray-400">
                <div className="w-12 h-12 mx-auto mb-1 flex items-center justify-center">
                  <img src={logoImg} alt="Tech Avenue" className="max-h-full max-w-full object-contain" />
                </div>
                <h2 className="text-base font-black tracking-wider uppercase text-gray-900">
                  TECH AVENUE
                </h2>
                <p className="text-[11px] text-gray-600 uppercase font-semibold">
                  Computer and Accessories Store
                </p>
                <p className="text-[10px] text-gray-500">
                  Unit 402, Tech Avenue Cyber Plaza, Metro Manila
                </p>
                <p className="text-[10px] text-gray-500">
                  TIN: 402-881-992-000 • Tel: (02) 8821-4920
                </p>
              </div>

              {/* Receipt Meta */}
              <div className="py-3 border-b border-dashed border-gray-300 text-[11px] space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-600">Invoice No:</span>
                  <span className="font-mono font-bold text-gray-900">{completedTransaction.invoice_number}</span>
                </div>
                {completedTransaction.transaction_number && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ref No:</span>
                    <span className="font-mono text-gray-700">{completedTransaction.transaction_number}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Date & Time:</span>
                  <span className="text-gray-900">{new Date(completedTransaction.transaction_date).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cashier:</span>
                  <span className="font-medium text-gray-900">{completedTransaction.cashier_name || user?.full_name || 'Cashier'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Customer:</span>
                  <span className="font-medium text-gray-900">{completedTransaction.customer_name || 'Walk-in Customer'}</span>
                </div>
              </div>

              {/* Receipt Items Table */}
              <div className="py-3 border-b border-dashed border-gray-300">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="border-b border-gray-300 text-gray-600 font-bold">
                      <th className="text-left pb-1">Item</th>
                      <th className="text-center pb-1">Qty</th>
                      <th className="text-right pb-1">Price</th>
                      <th className="text-right pb-1">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(completedTransaction.items || []).map((it, idx) => (
                      <tr key={idx} className="py-1">
                        <td className="py-1 pr-1 font-medium">{it.product_name}</td>
                        <td className="text-center py-1">{it.quantity}</td>
                        <td className="text-right py-1">PHP {Number(it.unit_price).toFixed(2)}</td>
                        <td className="text-right py-1 font-bold">PHP {(it.quantity * it.unit_price).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Receipt Totals Breakdown */}
              <div className="py-3 border-b border-dashed border-gray-400 text-[11px] space-y-1">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal (Net of VAT)</span>
                  <span>PHP {(Number(completedTransaction.total_amount) / 1.12).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>12% Output VAT</span>
                  <span>PHP {(Number(completedTransaction.total_amount) - (Number(completedTransaction.total_amount) / 1.12)).toFixed(2)}</span>
                </div>
                {Number(completedTransaction.discount_amount) > 0 && (
                  <div className="flex justify-between text-green-700 font-semibold">
                    <span>Discount</span>
                    <span>- PHP {Number(completedTransaction.discount_amount).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-black pt-1 border-t border-gray-300 text-gray-900">
                  <span>TOTAL AMOUNT</span>
                  <span>PHP {Number(completedTransaction.total_amount).toFixed(2)}</span>
                </div>
              </div>

              {/* Payment Details */}
              <div className="py-3 text-[11px] space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Method:</span>
                  <span className="font-bold uppercase text-gray-900">{completedTransaction.payment_method}</span>
                </div>
                {completedTransaction.payment_method === 'Cash' ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Amount Tendered:</span>
                      <span className="font-mono text-gray-900">PHP {Number(completedTransaction.amount_tendered || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span className="text-gray-600">Change Due:</span>
                      <span className="font-mono text-green-700">PHP {Number(completedTransaction.change_amount || 0).toFixed(2)}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Reference No:</span>
                    <span className="font-mono text-gray-900">{completedTransaction.payment_reference || 'N/A'}</span>
                  </div>
                )}
              </div>

              {/* Receipt Footer */}
              <div className="text-center pt-3 border-t border-dashed border-gray-300 text-[10px] text-gray-500 space-y-0.5">
                <p className="font-bold text-gray-700">Thank you for shopping at TECH AVENUE!</p>
                <p>Items may be returned or exchanged within 7 days with this official receipt.</p>
                <p className="font-mono text-[9px] text-gray-400 mt-2">
                  *** OFFICIAL RECEIPT • SYSTEM GENERATED ***
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={printReceipt}
                className="flex items-center gap-2 px-4 py-2 bg-navy text-white rounded-lg text-xs font-bold hover:bg-navy-dark shadow transition"
              >
                <Printer className="w-4 h-4" />
                Print Receipt
              </button>

              <button
                type="button"
                onClick={() => setIsReceiptModalOpen(false)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg text-xs font-semibold hover:bg-gray-300"
              >
                Done / Start Next Sale
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

