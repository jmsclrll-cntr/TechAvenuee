import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  Search, 
  Trash2, 
  Banknote, 
  CheckCircle2, 
  AlertCircle, 
  Printer, 
  FileText, 
  RotateCcw, 
  Plus, 
  Minus, 
  ArrowRight,
  ShieldCheck,
  Receipt as ReceiptIcon,
  X
} from 'lucide-react';
import Modal from '../components/Modal';
import OfficialReceiptModal from '../components/OfficialReceiptModal';
import { api } from '../api';

export default function PointOfSale({ user, initialDraftId, onClearDraft, onNavigateToNewTransaction }) {
  const [products, setProducts] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Active Sale / Cart state (Strictly Cash Only)
  const [cart, setCart] = useState([]);
  const [activeDraft, setActiveDraft] = useState(null);
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [discountPct, setDiscountPct] = useState(0);
  const [amountTendered, setAmountTendered] = useState('');
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

  // Safe Date Formatter helper
  const formatDateTime = (dateStr) => {
    if (!dateStr) return 'Recently';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return String(dateStr);
      return d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return String(dateStr);
    }
  };

  // Robust draft loading & cart hydration handler
  const applyDraftToCart = async (draft, productCatalog = products) => {
    if (!draft) return;

    let fullDraft = draft;
    if (!draft.items || draft.items.length === 0) {
      const draftIdentifier = draft.id || draft.draft_id;
      if (draftIdentifier) {
        try {
          const detailRes = await api.getDraftDetail(draftIdentifier);
          if (detailRes && detailRes.status === 'success' && detailRes.draft) {
            fullDraft = detailRes.draft;
          }
        } catch (fetchErr) {
          console.warn('Could not fetch detailed draft items, using available draft data:', fetchErr);
        }
      }
    }

    setActiveDraft(fullDraft);
    setCustomerName(fullDraft.customer_name || 'Walk-in Customer');
    setDiscountPct(Number(fullDraft.discount_pct || 0));
    setNotes(fullDraft.notes || '');

    const draftItems = fullDraft.items || [];
    const cartItems = draftItems.map(item => {
      const liveProd = (productCatalog || []).find(p => p.id === item.product_id);
      return {
        product_id: item.product_id,
        name: item.name || item.product_name || liveProd?.name || 'Item',
        sku: item.sku || liveProd?.sku || '',
        unit_price: Number(item.unit_price || liveProd?.selling_price || 0),
        quantity: Math.max(1, Number(item.quantity || 1)),
        image_url: item.image_url || liveProd?.image_url,
        max_stock: liveProd ? liveProd.stock_quantity : (item.available_stock || item.quantity || 999)
      };
    });

    setCart(cartItems);

    const draftNumber = fullDraft.transaction_number || fullDraft.reference_number || fullDraft.invoice_number || `DFT-${fullDraft.id || fullDraft.draft_id}`;
    showFeedback(`Loaded Draft ${draftNumber} for customer ${fullDraft.customer_name || 'Walk-in Customer'}!`);
  };

  const handleUnloadDraft = () => {
    setActiveDraft(null);
    setCustomerName('Walk-in Customer');
    setDiscountPct(0);
    setNotes('');
    setCart([]);
    if (onClearDraft) onClearDraft();
    showFeedback('Cleared draft. Switched to fresh direct sale.', 'info');
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
    setAmountTendered('');
    setCustomerName('Walk-in Customer');
    setDiscountPct(0);
    if (onClearDraft) onClearDraft();
  };

  // Calculation logic with 12% Philippine VAT standard (prices are VAT-inclusive)
  const grossSubtotal = cart.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
  const discountAmount = grossSubtotal * (Number(discountPct) / 100);
  const discountedTotal = Math.max(0, grossSubtotal - discountAmount);
  
  // Philippine VAT standard: Net of VAT = Total / 1.12
  const vatExclusiveSubtotal = +(discountedTotal / 1.12).toFixed(2);
  const vatAmount = +(discountedTotal - vatExclusiveSubtotal).toFixed(2);
  const totalAmountDue = discountedTotal;

  // Tender & Change calculation (Cash-only)
  const numericTendered = parseFloat(amountTendered) || 0;
  const changeDue = Math.max(0, numericTendered - totalAmountDue);
  const isTenderInsufficient = numericTendered < totalAmountDue;

  // Complete Checkout submission
  const handleCheckout = async () => {
    // 1. Validate cart contains at least one product
    if (cart.length === 0) {
      showFeedback('Shopping cart is empty. Add at least one product to checkout.', 'error');
      return;
    }

    // 2. Validate customer name
    const validCustomerName = customerName.trim() || 'Walk-in Customer';

    // 3. Validate amount tendered
    if (!amountTendered || isNaN(numericTendered) || numericTendered <= 0) {
      showFeedback('Please enter the cash amount tendered by the customer.', 'error');
      return;
    }

    // 4. Ensure amount tendered >= total amount due
    if (numericTendered < totalAmountDue) {
      showFeedback(`Amount tendered (₱${numericTendered.toFixed(2)}) is less than total amount due (₱${totalAmountDue.toFixed(2)}).`, 'error');
      return;
    }

    // 5. Verify product stock availability client-side before submission
    for (const item of cart) {
      const liveProd = products.find(p => p.id === item.product_id);
      if (liveProd && item.quantity > liveProd.stock_quantity) {
        showFeedback(`Cannot checkout: "${item.name}" only has ${liveProd.stock_quantity} units available.`, 'error');
        return;
      }
    }

    setIsCheckingOut(true);
    try {
      const payload = {
        draft_id: activeDraft ? activeDraft.id : null,
        customer_name: validCustomerName,
        payment_method: 'Cash', // Strictly Cash
        amount_tendered: numericTendered,
        change_amount: changeDue,
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
        const receiptData = res.receipt || res.transaction;
        if (receiptData) {
          // Immediately set completed transaction data and open official receipt modal
          setCompletedTransaction(receiptData);
          setIsReceiptModalOpen(true);
          showFeedback(`Payment verified! Official Receipt ${receiptData.invoice_number} saved to MySQL.`);

          // Reset cart & POS inputs
          setCart([]);
          setActiveDraft(null);
          setAmountTendered('');
          setNotes('');
          setCustomerName('Walk-in Customer');
          setDiscountPct(0);
          if (onClearDraft) onClearDraft();

          // Refresh products catalog & drafts in background
          loadInitialData();
        } else {
          showFeedback('Checkout saved, but receipt data was not returned.', 'error');
        }
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
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory || p.category_name === selectedCategory;
    const matchesSearch = !searchQuery || 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.brand && p.brand.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Page Title & Register Status Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200 dark:border-darkbg-border">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-navy dark:text-white tracking-tight flex items-center gap-2">
              <ShoppingCart className="w-7 h-7 text-navy dark:text-greige" />
              Point of Sale (POS Checkout)
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Cash Register Ready
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Over-the-counter cash checkout, automated MySQL inventory deduction, and instant official transaction receipts.
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
            : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800'
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
                  {activeDraft.transaction_number || activeDraft.reference_number || activeDraft.invoice_number || `DFT-${activeDraft.id}`}
                </span>
              </div>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">
                Customer: <strong>{activeDraft.customer_name || 'Walk-in Customer'}</strong> • Created {formatDateTime(activeDraft.transaction_date || activeDraft.created_at)} • Stock will be deducted upon cash payment.
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

      {/* Main Grid: Catalog (Left) + Current Sale Cart & Checkout Panel (Right) */}
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
                          <span className="truncate max-w-[80px]">{p.category || p.category_name}</span>
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
                              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
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

        {/* Right 5 Columns: Current Sale Cart, Pricing Breakdown & Cash Checkout */}
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
                  Customer Name *
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

                      <span className="text-xs font-black text-gray-900 dark:text-white w-20 text-right font-mono">
                        PHP {(item.unit_price * item.quantity).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>

                      <button
                        type="button"
                        onClick={() => removeFromCart(item.product_id)}
                        className="text-gray-400 hover:text-red-500 p-1"
                        title="Remove Item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Price Calculations */}
            <div className="p-3 bg-gray-50 dark:bg-darkbg rounded-xl space-y-1.5 text-xs border border-gray-200 dark:border-darkbg-border font-sans">
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Subtotal (Net of VAT)</span>
                <span className="font-mono">PHP {vatExclusiveSubtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>

              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>12% Output VAT</span>
                <span className="font-mono">PHP {vatAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                  <span>Discount ({discountPct}%)</span>
                  <span className="font-mono">- PHP {discountAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
              )}

              <div className="pt-2 border-t border-gray-200 dark:border-darkbg-border flex justify-between items-baseline font-black text-base text-navy dark:text-greige">
                <span>Total Amount Due</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400">
                  PHP {totalAmountDue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Payment Section: STRICTLY CASH ONLY (Card and GCash completely removed) */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-200 flex items-center gap-1.5">
                  <Banknote className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Payment Method
                </label>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                  Cash Only
                </span>
              </div>

              {/* Cash Indicator Card */}
              <div className="p-3 bg-emerald-50/50 dark:bg-darkbg rounded-xl border border-emerald-200 dark:border-emerald-900/40 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 rounded-lg">
                    <Banknote className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-gray-900 dark:text-white">Cash</span>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">Over-the-counter cash tender</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">Accepted</span>
              </div>

              {/* Cash Amount Tendered & Quick Presets */}
              <div className="p-3 bg-gray-50 dark:bg-darkbg rounded-xl border border-gray-200 dark:border-darkbg-border space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    Amount Tendered (PHP) *
                  </label>
                  {/* Quick Tender Presets */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setAmountTendered(totalAmountDue > 0 ? totalAmountDue.toString() : '')}
                      className="px-2 py-0.5 text-[10px] font-bold rounded bg-gray-200 dark:bg-gray-700 hover:bg-navy hover:text-white transition"
                    >
                      Exact
                    </button>
                    <button
                      type="button"
                      onClick={() => setAmountTendered(totalAmountDue > 0 ? (Math.ceil(totalAmountDue / 500) * 500).toString() : '')}
                      className="px-2 py-0.5 text-[10px] font-bold rounded bg-gray-200 dark:bg-gray-700 hover:bg-navy hover:text-white transition"
                    >
                      Round 500
                    </button>
                    <button
                      type="button"
                      onClick={() => setAmountTendered(totalAmountDue > 0 ? (Math.ceil(totalAmountDue / 1000) * 1000).toString() : '')}
                      className="px-2 py-0.5 text-[10px] font-bold rounded bg-gray-200 dark:bg-gray-700 hover:bg-navy hover:text-white transition"
                    >
                      Round 1000
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-sm font-bold text-gray-400">₱</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={amountTendered}
                    onChange={(e) => setAmountTendered(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 text-sm font-mono font-bold rounded-lg border border-gray-300 dark:border-darkbg-border bg-white dark:bg-darkbg-card text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-navy"
                  />
                </div>

                {/* Change Calculation Display */}
                <div className="flex items-center justify-between pt-1 border-t border-gray-200 dark:border-darkbg-border">
                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                    Change Due:
                  </span>
                  <span className={`text-sm font-black font-mono ${
                    isTenderInsufficient ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'
                  }`}>
                    {isTenderInsufficient 
                      ? `Short by PHP ${(totalAmountDue - numericTendered).toLocaleString('en-US', { minimumFractionDigits: 2 })}` 
                      : `PHP ${changeDue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                  </span>
                </div>
              </div>
            </div>

            {/* Complete Checkout Button */}
            <button
              type="button"
              disabled={isCheckingOut || cart.length === 0 || isTenderInsufficient}
              onClick={handleCheckout}
              className={`w-full py-3.5 px-4 rounded-xl text-sm font-black tracking-wide flex items-center justify-center gap-2 shadow-lg transition-all ${
                isCheckingOut || cart.length === 0 || isTenderInsufficient
                  ? 'bg-gray-300 dark:bg-gray-800 text-gray-500 cursor-not-allowed shadow-none'
                  : 'bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white shadow-emerald-600/30'
              }`}
            >
              {isCheckingOut ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>Processing Cash Checkout in MySQL...</span>
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
        maxWidth="max-w-xl"
      >
        <div className="space-y-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">
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
                        {d.transaction_number || d.reference_number || d.invoice_number || `DFT-${d.id}`}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200">
                        Draft
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-gray-800 dark:text-gray-100 mt-1">
                      Customer: {d.customer_name || 'Walk-in Customer'} • {d.item_count || d.items?.length || 0} items
                    </p>
                    <p className="text-[10px] text-gray-400">
                      Created: {formatDateTime(d.transaction_date || d.created_at)}
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

      {/* MODAL 2: OFFICIAL TRANSACTION RECEIPT (Dark Navy Theme, Immediate Display) */}
      <OfficialReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        receipt={completedTransaction}
      />
    </div>
  );
}
