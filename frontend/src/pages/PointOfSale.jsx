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
  X,
  Save,
  Layers
} from 'lucide-react';
import Modal from '../components/Modal';
import OfficialReceiptModal from '../components/OfficialReceiptModal';
import { api } from '../api';

export default function PointOfSale({ user, initialDraftId, onClearDraft, initialMode = 'cart' }) {
  const [products, setProducts] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Dual-mode Right Panel Toggle: 'cart' (Current Sale Cart) or 'draft' (Draft Preparation)
  const [panelMode, setPanelMode] = useState(initialMode || 'cart');

  // Mode 1: Active Sale / Cart state (Strictly Cash Only)
  const [cart, setCart] = useState([]);
  const [activeDraft, setActiveDraft] = useState(null);
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [discountPct, setDiscountPct] = useState(0);
  const [amountTendered, setAmountTendered] = useState('');
  const [notes, setNotes] = useState('');

  // Mode 2: Draft Preparation state
  const [draftItems, setDraftItems] = useState([]);
  const [draftCustomerName, setDraftCustomerName] = useState('Walk-in Customer');
  const [draftDiscountPct, setDraftDiscountPct] = useState(0);
  const [draftNotes, setDraftNotes] = useState('');
  const [activeEditingDraftId, setActiveEditingDraftId] = useState(null);
  const [activeDraftRefNumber, setActiveDraftRefNumber] = useState('');
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  // Checkout & Receipt modal state
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [completedTransaction, setCompletedTransaction] = useState(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Drafts selection modal
  const [isDraftsModalOpen, setIsDraftsModalOpen] = useState(false);

  useEffect(() => {
    if (initialMode) {
      setPanelMode(initialMode);
    }
  }, [initialMode]);

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
        setProducts(posRes.products || []);
      }
      if (draftsRes.status === 'success') {
        setDrafts(draftsRes.drafts || []);

        // If an initialDraftId was passed, load it automatically
        if (initialDraftId) {
          const target = (draftsRes.drafts || []).find(d => d.id === initialDraftId);
          if (target) {
            applyDraftToCart(target, posRes.products || []);
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

    const dItems = fullDraft.items || [];
    const cartItems = dItems.map(item => {
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
    setPanelMode('cart');

    const draftNumber = fullDraft.transaction_number || fullDraft.reference_number || fullDraft.invoice_number || `DFT-${fullDraft.id || fullDraft.draft_id}`;
    showFeedback(`Loaded Draft ${draftNumber} into Current Sale Cart!`);
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

  // CART OPERATIONS (Mode 1)
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

  // DRAFT ITEMS OPERATIONS (Mode 2)
  const addToDraft = (product) => {
    const existingIndex = draftItems.findIndex(i => i.product_id === product.id);
    if (existingIndex > -1) {
      const updated = [...draftItems];
      updated[existingIndex].quantity += 1;
      setDraftItems(updated);
    } else {
      setDraftItems([...draftItems, {
        product_id: product.id,
        name: product.name,
        sku: product.sku,
        unit_price: Number(product.selling_price),
        quantity: 1,
        image_url: product.image_url,
        max_stock: product.stock_quantity
      }]);
    }
    showFeedback(`Added "${product.name}" to Draft Preparation.`);
  };

  const updateDraftQuantity = (productId, newQty) => {
    if (newQty <= 0) {
      removeFromDraft(productId);
      return;
    }
    setDraftItems(draftItems.map(i => i.product_id === productId ? { ...i, quantity: newQty } : i));
  };

  const removeFromDraft = (productId) => {
    setDraftItems(draftItems.filter(i => i.product_id !== productId));
  };

  const clearDraft = () => {
    setDraftItems([]);
    setActiveEditingDraftId(null);
    setActiveDraftRefNumber('');
    setDraftCustomerName('Walk-in Customer');
    setDraftDiscountPct(0);
    setDraftNotes('');
  };

  // Save Draft (MySQL)
  const handleSaveDraft = async () => {
    if (draftItems.length === 0) {
      showFeedback('Draft has no line items. Click products to add items before saving.', 'error');
      return;
    }

    setIsSavingDraft(true);
    try {
      const payload = {
        items: draftItems.map(i => ({ product_id: i.product_id, quantity: i.quantity })),
        customer_name: draftCustomerName.trim() || 'Walk-in Customer',
        discount_pct: Number(draftDiscountPct) || 0,
        notes: draftNotes
      };

      if (activeEditingDraftId) {
        await api.updateDraft(activeEditingDraftId, payload);
        showFeedback(`Draft ${activeDraftRefNumber || activeEditingDraftId} updated successfully in MySQL!`);
      } else {
        const res = await api.saveDraft(payload);
        setActiveEditingDraftId(res.draft_id);
        setActiveDraftRefNumber(res.reference_number);
        showFeedback(`Draft quotation ${res.reference_number} saved to MySQL (Inventory untouched)!`);
      }

      // Refresh drafts list
      const updatedDrafts = await api.getDrafts();
      if (updatedDrafts.status === 'success') {
        setDrafts(updatedDrafts.drafts || []);
      }
    } catch (err) {
      console.error('Error saving draft:', err);
      showFeedback(`Failed to save draft: ${err.message}`, 'error');
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Proceed from Draft to POS
  const handleProceedToPosFromDraft = () => {
    if (draftItems.length === 0) {
      showFeedback('Cannot proceed with an empty draft. Add line items first.', 'error');
      return;
    }

    // Populate Current Sale Cart
    setCart(draftItems.map(i => ({ ...i })));
    setCustomerName(draftCustomerName.trim() || 'Walk-in Customer');
    setDiscountPct(Number(draftDiscountPct) || 0);
    setNotes(draftNotes);
    setPanelMode('cart');
    showFeedback('Draft items transferred into Current Sale Cart. Ready for checkout!');
  };

  // Dynamic Category Extraction: pulls distinct categories directly from live products
  const categories = ['All', ...Array.from(new Set(products.map(p => p.category_name || p.category).filter(Boolean))).sort()];

  // Product Filtering: guarantees dynamic matching without hardcoded tag mismatches
  const filteredProducts = products.filter(p => {
    const prodCategory = p.category_name || p.category;
    const matchesCategory = selectedCategory === 'All' || prodCategory === selectedCategory;
    const matchesSearch = !searchQuery || 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.brand && p.brand.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // Mode 1: Cart Pricing Calculations (12% Philippine VAT standard)
  const grossSubtotal = cart.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
  const discountAmount = grossSubtotal * (Number(discountPct) / 100);
  const discountedTotal = Math.max(0, grossSubtotal - discountAmount);
  const vatExclusiveSubtotal = +(discountedTotal / 1.12).toFixed(2);
  const vatAmount = +(discountedTotal - vatExclusiveSubtotal).toFixed(2);
  const totalAmountDue = discountedTotal;

  // Tender & Change calculation (Cash-only)
  const numericTendered = parseFloat(amountTendered) || 0;
  const changeDue = Math.max(0, numericTendered - totalAmountDue);
  const isTenderInsufficient = numericTendered < totalAmountDue;

  // Mode 2: Draft Pricing Calculations
  const draftGrossSubtotal = draftItems.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
  const draftDiscountAmount = draftGrossSubtotal * (Number(draftDiscountPct) / 100);
  const draftDiscountedTotal = Math.max(0, draftGrossSubtotal - draftDiscountAmount);
  const draftVatExclusiveSubtotal = +(draftDiscountedTotal / 1.12).toFixed(2);
  const draftVatAmount = +(draftDiscountedTotal - draftVatExclusiveSubtotal).toFixed(2);
  const draftTotalAmount = draftDiscountedTotal;

  // Complete Checkout validation & submission
  const handleCheckout = async () => {
    // 1. Validate cart contains at least one product
    if (cart.length === 0) {
      showFeedback('Shopping cart is empty. Add at least one product to complete checkout.', 'error');
      return;
    }

    // 2. Validate amount tendered is entered
    if (!amountTendered || isNaN(numericTendered) || numericTendered <= 0) {
      showFeedback('Please enter the cash amount tendered by the customer.', 'error');
      return;
    }

    // 3. Validate amount tendered is sufficient
    if (numericTendered < totalAmountDue) {
      showFeedback(`Amount tendered (₱${numericTendered.toFixed(2)}) is insufficient. Total due is ₱${totalAmountDue.toFixed(2)}.`, 'error');
      return;
    }

    // 4. Verify stock availability client-side before submission
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
        customer_name: customerName.trim() || 'Walk-in Customer',
        payment_method: 'Cash',
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
          setCompletedTransaction(receiptData);
          setIsReceiptModalOpen(true);
          showFeedback(`Payment verified! Official Receipt ${receiptData.invoice_number} saved.`);

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

  return (
    <div className="p-6 space-y-6">
      {/* Page Title & Register Status Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200 dark:border-darkbg-border">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-navy dark:text-white tracking-tight flex items-center gap-2">
              <ShoppingCart className="w-7 h-7 text-navy dark:text-greige" />
              Point of Sale & Drafts
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Cash Register Ready
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Over-the-counter cash checkout, draft preparation, quotation management, and instant official receipts.
          </p>
        </div>

        {/* Top Actions: Prominent Resume Saved Draft Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsDraftsModalOpen(true)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-extrabold rounded-xl border border-gray-300 dark:border-darkbg-border bg-white dark:bg-darkbg-card text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-darkbg-hover shadow-sm transition cursor-pointer"
          >
            <FileText className="w-4 h-4 text-blue-500 shrink-0" />
            <span>Resume Saved Draft ({drafts.length})</span>
          </button>
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

      {/* Active Draft Alert Banner (when a draft is loaded into Cart) */}
      {activeDraft && panelMode === 'cart' && (
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
                Customer: <strong>{activeDraft.customer_name || 'Walk-in Customer'}</strong> • Created {formatDateTime(activeDraft.transaction_date || activeDraft.created_at)}
              </p>
            </div>
          </div>
          <button
            onClick={handleUnloadDraft}
            className="text-xs px-3 py-1.5 rounded-lg border border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-200 hover:bg-blue-100 dark:hover:bg-blue-900/60 font-semibold cursor-pointer"
          >
            Unload Draft
          </button>
        </div>
      )}

      {/* Main Grid: Catalog (Left 7 Cols) + Unified Right Panel (Right 5 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left 7 Columns: Product Selection & Catalog */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-border rounded-xl p-4 shadow-sm">
            
            {/* Search & Dynamic Category Filter */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products by name or brand..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-gray-300 dark:border-darkbg-border bg-gray-50 dark:bg-darkbg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-navy"
                />
              </div>

              {/* Dynamic Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
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
                Loading Product Catalog from MySQL...
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="p-12 text-center text-xs text-gray-500">
                No products match the selected criteria.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[580px] overflow-y-auto pr-1">
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

                        {/* Product Name (SKU/PRD code and category label removed) */}
                        <h4 className="text-xs font-bold text-gray-900 dark:text-white line-clamp-2 leading-snug" title={p.name}>
                          {p.name}
                        </h4>
                      </div>

                      {/* Price & Stock & Action Button */}
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

                        {/* Action Button: Adds to Cart or Draft depending on active panel mode */}
                        <button
                          type="button"
                          disabled={isOutOfStock || (panelMode === 'cart' && isMaxedInCart)}
                          onClick={() => {
                            if (panelMode === 'draft') {
                              addToDraft(p);
                            } else {
                              addToCart(p);
                            }
                          }}
                          className={`w-full py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                            isOutOfStock
                              ? 'bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                              : panelMode === 'draft'
                              ? 'bg-slate-800 hover:bg-slate-700 text-white shadow-sm'
                              : isMaxedInCart
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 cursor-not-allowed'
                              : 'bg-navy hover:bg-navy-light text-white dark:bg-darkbg-border dark:hover:bg-gray-700 shadow-sm'
                          }`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>
                            {isOutOfStock 
                              ? 'Out of Stock' 
                              : panelMode === 'draft'
                              ? 'Add to Draft'
                              : isMaxedInCart 
                              ? 'Max Stock' 
                              : 'Add to Cart'}
                          </span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right 5 Columns: UNIFIED RIGHT PANEL (DUAL-MODE TOGGLE) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-border rounded-xl p-5 shadow-sm space-y-4">
            
            {/* Segmented Toggle: Current Sale Cart vs Draft Preparation */}
            <div className="flex items-center p-1 bg-gray-100 dark:bg-darkbg rounded-xl border border-gray-200 dark:border-darkbg-border">
              <button
                type="button"
                onClick={() => setPanelMode('cart')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  panelMode === 'cart'
                    ? 'bg-white dark:bg-darkbg-card text-navy dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Current Sale Cart ({cart.reduce((s, i) => s + i.quantity, 0)})</span>
              </button>
              <button
                type="button"
                onClick={() => setPanelMode('draft')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  panelMode === 'draft'
                    ? 'bg-white dark:bg-darkbg-card text-navy dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Draft Preparation ({draftItems.reduce((s, i) => s + i.quantity, 0)})</span>
              </button>
            </div>

            {/* ========================================================================= */}
            {/* MODE 1: CURRENT SALE CART & IMMEDIATE CHECKOUT                            */}
            {/* ========================================================================= */}
            {panelMode === 'cart' && (
              <div className="space-y-4">
                {/* Header Actions */}
                <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-darkbg-border">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                      Line Items ({cart.length})
                    </span>
                  </div>
                  {cart.length > 0 && (
                    <button
                      type="button"
                      onClick={clearCart}
                      className="text-[11px] text-red-600 hover:text-red-700 dark:text-red-400 flex items-center gap-1 font-semibold cursor-pointer"
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
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1 divide-y divide-gray-100 dark:divide-darkbg-border">
                  {cart.length === 0 ? (
                    <div className="py-8 text-center text-xs text-gray-400">
                      <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      Cart is empty. Select products from the catalog or load a saved draft.
                    </div>
                  ) : (
                    cart.map(item => (
                      <div key={item.product_id} className="pt-2 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded bg-white dark:bg-darkbg border border-gray-200 dark:border-darkbg-border p-1 shrink-0 flex items-center justify-center">
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
                              PHP {item.unit_price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="flex items-center border border-gray-300 dark:border-darkbg-border rounded-lg bg-gray-50 dark:bg-darkbg">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                              className="p-1 text-gray-500 hover:text-navy dark:hover:text-white cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-6 text-center text-xs font-bold">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                              className="p-1 text-gray-500 hover:text-navy dark:hover:text-white cursor-pointer"
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
                            className="text-gray-400 hover:text-red-500 p-1 cursor-pointer"
                            title="Remove Item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Pricing Summary (Includes Subtotal Before Discount) */}
                <div className="p-3 bg-gray-50 dark:bg-darkbg rounded-xl space-y-1.5 text-xs border border-gray-200 dark:border-darkbg-border font-sans">
                  <div className="flex justify-between text-gray-700 dark:text-gray-300 font-semibold">
                    <span>Subtotal (Before Discount)</span>
                    <span className="font-mono">PHP {grossSubtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>

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

                {/* Minimalist Payment Method (Compact, No Bulky Boxes or Loud Badges) */}
                <div className="flex items-center justify-between text-xs py-1 text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Banknote className="w-3.5 h-3.5 text-emerald-500" />
                    Payment Method:
                  </span>
                  <span className="font-semibold text-gray-700 dark:text-gray-300">Cash Accepted</span>
                </div>

                {/* Cash Amount Tendered (Exact Button Only) */}
                <div className="p-3 bg-gray-50 dark:bg-darkbg rounded-xl border border-gray-200 dark:border-darkbg-border space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                      Amount Tendered (PHP) *
                    </label>
                    <button
                      type="button"
                      onClick={() => setAmountTendered(totalAmountDue > 0 ? totalAmountDue.toString() : '')}
                      className="px-2.5 py-1 text-[11px] font-bold rounded bg-gray-200 dark:bg-gray-700 hover:bg-navy hover:text-white dark:hover:bg-greige dark:hover:text-navy transition cursor-pointer"
                    >
                      Exact
                    </button>
                  </div>

                  <div className="relative">
                    <span className="absolute left-3 top-2 text-sm font-bold text-gray-400">₱</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={amountTendered}
                      onChange={(e) => setAmountTendered(e.target.value)}
                      className="w-full pl-7 pr-3 py-1.5 text-sm font-mono font-bold rounded-lg border border-gray-300 dark:border-darkbg-border bg-white dark:bg-darkbg-card text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-navy"
                    />
                  </div>

                  {/* Change Due Display */}
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

                {/* Complete Checkout Action */}
                <button
                  type="button"
                  disabled={isCheckingOut || cart.length === 0 || isTenderInsufficient}
                  onClick={handleCheckout}
                  className={`w-full py-3.5 px-4 rounded-xl text-sm font-black tracking-wide flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
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
            )}

            {/* ========================================================================= */}
            {/* MODE 2: DRAFT QUOTATION PREPARATION                                      */}
            {/* ========================================================================= */}
            {panelMode === 'draft' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-darkbg-border">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-navy dark:text-greige" />
                    <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                      Draft Quotation Preparation
                    </h3>
                  </div>
                  {draftItems.length > 0 && (
                    <button
                      type="button"
                      onClick={clearDraft}
                      className="text-[11px] text-red-600 hover:text-red-700 dark:text-red-400 flex items-center gap-1 font-semibold cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Reset Form
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
                      value={draftCustomerName}
                      onChange={(e) => setDraftCustomerName(e.target.value)}
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
                      value={draftDiscountPct}
                      onChange={(e) => setDraftDiscountPct(Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-darkbg-border bg-gray-50 dark:bg-darkbg text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-navy"
                    />
                  </div>
                </div>

                {/* Quotation Notes / Terms */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-300 mb-1">
                    Quotation Notes / Terms
                  </label>
                  <input
                    type="text"
                    value={draftNotes}
                    onChange={(e) => setDraftNotes(e.target.value)}
                    placeholder="e.g. Customer holds quote valid for 3 days"
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-darkbg-border bg-gray-50 dark:bg-darkbg text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-navy"
                  />
                </div>

                {/* Draft Line Items */}
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1 divide-y divide-gray-100 dark:divide-darkbg-border">
                  {draftItems.length === 0 ? (
                    <div className="py-8 text-center text-xs text-gray-400">
                      <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      Draft has no line items. Click products from the catalog to build this quotation.
                    </div>
                  ) : (
                    draftItems.map(item => (
                      <div key={item.product_id} className="pt-2 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-gray-800 dark:text-gray-100 truncate" title={item.name}>
                            {item.name}
                          </p>
                          <p className="text-[10px] text-gray-400 font-mono">
                            PHP {item.unit_price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <div className="flex items-center border border-gray-300 dark:border-darkbg-border rounded-lg bg-gray-50 dark:bg-darkbg">
                            <button
                              type="button"
                              onClick={() => updateDraftQuantity(item.product_id, item.quantity - 1)}
                              className="p-1 text-gray-500 hover:text-navy dark:hover:text-white cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-6 text-center text-xs font-bold">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateDraftQuantity(item.product_id, item.quantity + 1)}
                              className="p-1 text-gray-500 hover:text-navy dark:hover:text-white cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <span className="text-xs font-black text-gray-900 dark:text-white w-20 text-right font-mono">
                            PHP {(item.unit_price * item.quantity).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>

                          <button
                            type="button"
                            onClick={() => removeFromDraft(item.product_id)}
                            className="text-gray-400 hover:text-red-500 p-1 cursor-pointer"
                            title="Remove from Draft"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Draft Pricing Summary */}
                <div className="p-3 bg-gray-50 dark:bg-darkbg rounded-xl space-y-1.5 text-xs border border-gray-200 dark:border-darkbg-border font-sans">
                  <div className="flex justify-between text-gray-700 dark:text-gray-300 font-semibold">
                    <span>Subtotal (Before Discount)</span>
                    <span className="font-mono">PHP {draftGrossSubtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>

                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Subtotal (Net of VAT)</span>
                    <span className="font-mono">PHP {draftVatExclusiveSubtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>

                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>12% Output VAT</span>
                    <span className="font-mono">PHP {draftVatAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>

                  <div className="pt-2 border-t border-gray-200 dark:border-darkbg-border flex justify-between items-baseline font-black text-base text-navy dark:text-greige">
                    <span>Draft Total Amount</span>
                    <span className="font-mono text-amber-500 dark:text-amber-400">
                      PHP {draftTotalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* 1. Primary Action: Save Draft (MySQL) */}
                <button
                  type="button"
                  disabled={isSavingDraft || draftItems.length === 0}
                  onClick={handleSaveDraft}
                  className={`w-full py-3 px-4 rounded-xl text-sm font-black tracking-wide flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer ${
                    isSavingDraft || draftItems.length === 0
                      ? 'bg-gray-300 dark:bg-gray-800 text-gray-500 cursor-not-allowed shadow-none'
                      : 'bg-navy hover:bg-navy-light text-white shadow-navy/30'
                  }`}
                >
                  {isSavingDraft ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                      <span>Saving Draft to MySQL...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Draft (MySQL)</span>
                    </>
                  )}
                </button>

                {/* 2. Below Draft Preparation: Two Neutral Options (Saved Drafts & Proceed to POS) */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsDraftsModalOpen(true)}
                    className="py-2.5 px-3 rounded-lg border border-gray-300 dark:border-darkbg-border bg-white dark:bg-darkbg text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-darkbg-hover text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Saved Drafts</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleProceedToPosFromDraft}
                    className="py-2.5 px-3 rounded-lg border border-gray-300 dark:border-darkbg-border bg-gray-50 dark:bg-darkbg-card text-gray-800 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-darkbg-hover text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <span>Proceed to POS</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-[11px] text-gray-400 text-center">
                  Saving a draft records quotation in MySQL without deducting physical warehouse inventory.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL 1: RESUME SAVED DRAFT (Larger, Consistent Font Style & Easy Reading) */}
      <Modal
        isOpen={isDraftsModalOpen}
        onClose={() => setIsDraftsModalOpen(false)}
        title="Resume Saved Draft"
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Select a saved customer quotation or draft transaction to load its line items, customer details, and discounts directly into the POS checkout cart.
          </p>

          {drafts.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500 border border-dashed rounded-xl">
              No saved draft quotations found in MySQL.
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {drafts.map(d => (
                <div
                  key={d.id}
                  className="p-4 rounded-xl border border-gray-200 dark:border-darkbg-border hover:border-navy dark:hover:border-greige flex items-center justify-between transition cursor-pointer bg-gray-50/50 dark:bg-darkbg"
                  onClick={() => {
                    applyDraftToCart(d);
                    setIsDraftsModalOpen(false);
                  }}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-navy dark:text-greige">
                        {d.transaction_number || d.reference_number || d.invoice_number || `DFT-${d.id}`}
                      </span>
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200">
                        Draft
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      Customer: {d.customer_name || 'Walk-in Customer'} • {d.item_count || d.items?.length || 0} items
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Created: {formatDateTime(d.transaction_date || d.created_at)}
                    </p>
                  </div>

                  <div className="text-right space-y-1">
                    <p className="text-base font-extrabold text-navy dark:text-white font-mono">
                      PHP {Number(d.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                    <span className="text-xs text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1 justify-end cursor-pointer">
                      Load into POS <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end pt-2 border-t border-gray-200 dark:border-darkbg-border">
            <button
              onClick={() => setIsDraftsModalOpen(false)}
              className="px-5 py-2 text-sm font-bold rounded-lg bg-gray-100 dark:bg-darkbg text-gray-700 dark:text-gray-300 hover:bg-gray-200 cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL 2: OFFICIAL TRANSACTION RECEIPT */}
      <OfficialReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        receipt={completedTransaction}
      />
    </div>
  );
}
