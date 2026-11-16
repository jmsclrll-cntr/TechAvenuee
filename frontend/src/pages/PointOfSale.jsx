import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  Search, 
  Trash2, 
  Banknote, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Minus, 
  ArrowRight,
  ShieldCheck,
  FileText,
  Save,
  Clock,
  X
} from 'lucide-react';
import Modal, { ConfirmDialog } from '../components/Modal';
import OfficialReceiptModal from '../components/OfficialReceiptModal';
import { api } from '../api';

export default function PointOfSale({ user, initialDraftId, onClearDraft }) {
  const [products, setProducts] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Unified Right Panel Mode: 'pos' (Current Sale Cart) or 'draft' (Draft Preparation)
  const [panelMode, setPanelMode] = useState('pos');

  // POS State (Current Sale Cart)
  const [cart, setCart] = useState([]);
  const [activeDraft, setActiveDraft] = useState(null);
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [discountPct, setDiscountPct] = useState(0);
  const [amountTendered, setAmountTendered] = useState('');
  const [notes, setNotes] = useState('');

  // Draft Preparation State
  const [draftActiveId, setDraftActiveId] = useState(null);
  const [draftReferenceNumber, setDraftReferenceNumber] = useState('');
  const [draftCustomerName, setDraftCustomerName] = useState('Walk-in Customer');
  const [draftDiscountPct, setDraftDiscountPct] = useState(0);
  const [draftNotes, setDraftNotes] = useState('');
  const [draftItems, setDraftItems] = useState([]);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  // Checkout & Receipt modal state
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [completedTransaction, setCompletedTransaction] = useState(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Resume Drafts selection modal
  const [isDraftsModalOpen, setIsDraftsModalOpen] = useState(false);

  // Confirmation dialog state
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({});

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

  // Resume a saved draft into Current Sale Cart
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

    const itemsFromDraft = fullDraft.items || [];
    const cartItems = itemsFromDraft.map(item => {
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
    setPanelMode('pos');

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

  // Add product to Cart or Draft based on active panelMode
  const handleProductClick = (product) => {
    if (panelMode === 'pos') {
      addToCart(product);
    } else {
      addToDraft(product);
    }
  };

  // POS Cart operations
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

  const updateCartQuantity = (productId, newQty) => {
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

  // Draft operations
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
        brand: product.brand,
        unit_price: Number(product.selling_price),
        available_stock: product.stock_quantity,
        image_url: product.image_url,
        quantity: 1
      }]);
    }
  };

  const updateDraftQuantity = (productId, newQty) => {
    const q = parseInt(newQty, 10);
    if (isNaN(q) || q <= 0) {
      removeDraftItem(productId);
      return;
    }
    setDraftItems(draftItems.map(i => i.product_id === productId ? { ...i, quantity: q } : i));
  };

  const removeDraftItem = (productId) => {
    setDraftItems(draftItems.filter(i => i.product_id !== productId));
  };

  const resetDraftForm = () => {
    setDraftActiveId(null);
    setDraftReferenceNumber('');
    setDraftCustomerName('Walk-in Customer');
    setDraftDiscountPct(0);
    setDraftNotes('');
    setDraftItems([]);
  };

  const handleLoadDraftForEditing = async (draftId) => {
    try {
      const res = await api.getDraftDetail(draftId);
      if (res.status === 'success') {
        const d = res.draft;
        setDraftActiveId(d.id);
        setDraftReferenceNumber(d.invoice_number || d.reference_number || `DFT-${d.id}`);
        setDraftCustomerName(d.customer_name || 'Walk-in Customer');
        setDraftDiscountPct(Number(d.discount_pct || 0));
        setDraftNotes(d.notes || '');
        setDraftItems((d.items || []).map(i => ({
          product_id: i.product_id,
          name: i.name,
          sku: i.sku,
          brand: i.brand,
          unit_price: Number(i.unit_price),
          available_stock: i.available_stock,
          image_url: i.image_url,
          quantity: i.quantity
        })));
        setPanelMode('draft');
        setIsDraftsModalOpen(false);
        showFeedback(`Loaded draft ${d.invoice_number || d.reference_number || d.id} into Draft Preparation.`);
      }
    } catch (err) {
      showFeedback(`Error loading draft: ${err.message}`, 'error');
    }
  };

  const handleSaveDraft = async () => {
    if (draftItems.length === 0) {
      showFeedback('Please add at least one product line item to save this draft.', 'error');
      return;
    }

    setIsSavingDraft(true);
    try {
      const payload = {
        items: draftItems.map(i => ({ product_id: i.product_id, quantity: i.quantity })),
        customer_name: draftCustomerName.trim() || 'Walk-in Customer',
        discount_pct: Number(draftDiscountPct),
        notes: draftNotes
      };

      if (draftActiveId) {
        await api.updateDraft(draftActiveId, payload);
        showFeedback(`Draft ${draftReferenceNumber} updated successfully.`);
      } else {
        const res = await api.saveDraft(payload);
        setDraftActiveId(res.draft_id);
        setDraftReferenceNumber(res.reference_number);
        showFeedback(`Draft ${res.reference_number} saved (Inventory untouched).`);
      }
      loadInitialData();
    } catch (err) {
      showFeedback(`Save draft failed: ${err.message}`, 'error');
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleProceedDraftToPos = () => {
    if (draftItems.length === 0) {
      showFeedback('Cannot proceed to POS: draft has no items.', 'error');
      return;
    }

    const overStock = draftItems.filter(i => i.quantity > i.available_stock);
    if (overStock.length > 0) {
      showFeedback(`Warning: Some item(s) exceed warehouse stock: ${overStock.map(o => o.name).join(', ')}. Adjust quantities before checkout.`, 'error');
      return;
    }

    handleSaveDraft().then(() => {
      // Transfer draft items into active cart
      const cartFormatted = draftItems.map(item => ({
        product_id: item.product_id,
        name: item.name,
        sku: item.sku,
        unit_price: item.unit_price,
        quantity: item.quantity,
        image_url: item.image_url,
        max_stock: item.available_stock
      }));
      setCart(cartFormatted);
      setCustomerName(draftCustomerName);
      setDiscountPct(draftDiscountPct);
      setNotes(draftNotes);
      setActiveDraft({
        id: draftActiveId,
        reference_number: draftReferenceNumber,
        customer_name: draftCustomerName
      });
      setPanelMode('pos');
      showFeedback('Draft items transferred to Current Sale Cart. Ready for checkout.');
    });
  };

  const handleCancelDraftClick = (draft) => {
    setConfirmConfig({
      title: 'Cancel Transaction Draft',
      message: `Are you sure you want to cancel draft ${draft.reference_number || draft.invoice_number || draft.id} for customer "${draft.customer_name}"? This draft will be archived and will not proceed to checkout.`,
      action: async () => {
        try {
          await api.cancelDraft(draft.id);
          showFeedback(`Draft ${draft.reference_number || draft.invoice_number || draft.id} has been cancelled.`);
          if (draftActiveId === draft.id) {
            resetDraftForm();
          }
          setIsConfirmOpen(false);
          loadInitialData();
        } catch (err) {
          showFeedback(`Cancellation error: ${err.message}`, 'error');
        }
      },
      style: 'danger'
    });
    setIsConfirmOpen(true);
  };

  // Financial calculations for POS Cart
  const grossSubtotal = cart.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
  const discountAmount = grossSubtotal * (Number(discountPct) / 100);
  const discountedTotal = Math.max(0, grossSubtotal - discountAmount);
  const vatExclusiveSubtotal = +(discountedTotal / 1.12).toFixed(2);
  const vatAmount = +(discountedTotal - vatExclusiveSubtotal).toFixed(2);
  const totalAmountDue = discountedTotal;

  // Tender & Change calculation
  const numericTendered = parseFloat(amountTendered) || 0;
  const changeDue = Math.max(0, numericTendered - totalAmountDue);
  const isTenderInsufficient = numericTendered < totalAmountDue;

  // Financial calculations for Draft Preparation
  const draftGrossSubtotal = draftItems.reduce((acc, cur) => acc + (cur.unit_price * cur.quantity), 0);
  const draftDiscountAmount = Math.round(draftGrossSubtotal * (Number(draftDiscountPct) / 100.0) * 100) / 100;
  const draftNetSubtotal = Math.round((draftGrossSubtotal - draftDiscountAmount) * 100) / 100;
  const draftVatAmount = Math.round(draftNetSubtotal * 0.12 * 100) / 100;
  const draftTotalAmount = Math.round((draftNetSubtotal + draftVatAmount) * 100) / 100;

  // Checkout submission
  const handleCheckout = async () => {
    if (cart.length === 0) {
      showFeedback('Shopping cart is empty. Add at least one product to checkout.', 'error');
      return;
    }

    const validCustomerName = customerName.trim() || 'Walk-in Customer';

    if (!amountTendered || isNaN(numericTendered) || numericTendered <= 0) {
      showFeedback('Please enter the cash amount tendered by the customer.', 'error');
      return;
    }

    if (numericTendered < totalAmountDue) {
      showFeedback(`Amount tendered (₱${numericTendered.toFixed(2)}) is less than total amount due (₱${totalAmountDue.toFixed(2)}).`, 'error');
      return;
    }

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
          showFeedback(`Payment verified! Official Receipt ${receiptData.invoice_number} saved to MySQL.`);

          setCart([]);
          setActiveDraft(null);
          setAmountTendered('');
          setNotes('');
          setCustomerName('Walk-in Customer');
          setDiscountPct(0);
          if (onClearDraft) onClearDraft();

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

  // Dynamic categories from database
  const dynamicCategories = ['All', ...new Set(products.map(p => p.category_name || p.category).filter(Boolean))];
  const filteredProducts = products.filter(p => {
    const catName = p.category_name || p.category;
    const matchesCategory = selectedCategory === 'All' || catName === selectedCategory;
    const matchesSearch = !searchQuery || 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.brand && p.brand.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Page Title & Register Status Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200 dark:border-[#292524]">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-navy dark:text-white tracking-tight flex items-center gap-2">
              <ShoppingCart className="w-7 h-7 text-[#F97316]" />
              Point of Sale &amp; Drafts
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-[#292524] text-[#FB923C] border border-[#44403C] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#F97316] animate-pulse"></span>
              Cash Register Ready
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-stone-400 mt-1">
            Over-the-counter cash checkout, draft quotations preparation, and instant official transaction receipts.
          </p>
        </div>

        {/* Top actions: Enlarge Resume Saved Draft button */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsDraftsModalOpen(true)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-extrabold rounded-xl border border-[#F97316]/40 bg-[#292524] text-[#FB923C] hover:bg-[#342F2D] shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <FileText className="w-4 h-4 text-[#F97316]" />
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

      {/* Active Draft Alert Banner */}
      {activeDraft && panelMode === 'pos' && (
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

      {/* Main Grid: Catalog (Left) + Unified Right Panel (Right) */}
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

              {/* Dynamic Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                {dynamicCategories.map(cat => (
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

            {/* Product Cards Grid: Clean cards without SKU and without category label */}
            {loading ? (
              <div className="p-12 text-center text-xs text-gray-500">
                <div className="animate-spin w-6 h-6 border-2 border-[#F97316] border-t-transparent rounded-full mx-auto mb-2"></div>
                Loading POS Product Catalog from MySQL...
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="p-12 text-center text-xs text-gray-500">
                No products match the selected criteria.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[560px] overflow-y-auto pr-1">
                {filteredProducts.map(p => {
                  const inCartItem = panelMode === 'pos' 
                    ? cart.find(i => i.product_id === p.id)
                    : draftItems.find(i => i.product_id === p.id);
                  const isOutOfStock = p.stock_quantity <= 0;
                  const isMaxedInCart = panelMode === 'pos' && inCartItem && inCartItem.quantity >= p.stock_quantity;

                  return (
                    <div 
                      key={p.id}
                      className={`flex flex-col justify-between p-3 rounded-xl border transition-all text-left group ${
                        isOutOfStock
                          ? 'border-red-200 dark:border-red-900/40 bg-red-50/20 dark:bg-red-950/20 opacity-60'
                          : 'border-gray-200 dark:border-[#292524] bg-gray-50/50 dark:bg-[#1C1917] hover:border-[#F97316] hover:shadow-md'
                      }`}
                    >
                      <div>
                        {/* Thumbnail Image */}
                        <div className="w-full h-24 bg-white dark:bg-[#292524] rounded-lg border border-gray-200 dark:border-[#383330] p-2 mb-2 flex items-center justify-center overflow-hidden">
                          <img
                            src={p.image_url || '/products/default.svg'}
                            alt={p.name}
                            className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform"
                            onError={(e) => { e.target.src = '/products/default.svg'; }}
                          />
                        </div>

                        {/* Name (SKU and category label removed) */}
                        <h4 className="text-xs font-bold text-gray-900 dark:text-white line-clamp-2 leading-snug" title={p.name}>
                          {p.name}
                        </h4>
                      </div>

                      {/* Price & Stock & Action Button */}
                      <div className="mt-3 pt-2 border-t border-gray-200 dark:border-[#292524]">
                        <div className="flex items-baseline justify-between mb-2">
                          <span className="text-xs font-black text-[#F97316]">
                            PHP {Number(p.selling_price).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            isOutOfStock 
                              ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' 
                              : p.stock_quantity <= (p.reorder_level || 5)
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                              : 'bg-[#292524] text-[#FB923C] border border-[#44403C]'
                          }`}>
                            {p.stock_quantity} in stock
                          </span>
                        </div>

                        <button
                          type="button"
                          disabled={isOutOfStock || isMaxedInCart}
                          onClick={() => handleProductClick(p)}
                          className={`w-full py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                            isOutOfStock
                              ? 'bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                              : isMaxedInCart
                              ? 'bg-amber-200 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 cursor-not-allowed'
                              : inCartItem
                              ? 'bg-[#F97316] text-white hover:bg-[#EA580C] shadow-sm'
                              : 'bg-white dark:bg-[#292524] border border-[#F97316]/40 text-[#F97316] hover:bg-[#F97316] hover:text-white'
                          }`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                          {isOutOfStock 
                            ? 'Out of Stock' 
                            : isMaxedInCart 
                            ? `Max (${inCartItem.quantity})` 
                            : inCartItem 
                            ? (panelMode === 'pos' ? `Add More (${inCartItem.quantity})` : `In Draft (${inCartItem.quantity})`)
                            : (panelMode === 'pos' ? 'Add to Cart' : 'Add to Draft')}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right 5 Columns: UNIFIED RIGHT PANEL (DUAL-MODE) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-border rounded-xl p-5 shadow-sm space-y-4">
            
            {/* Segmented Toggle at the top of Unified Panel */}
            <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-darkbg rounded-xl border border-slate-200 dark:border-darkbg-border">
              <button
                type="button"
                onClick={() => setPanelMode('pos')}
                className={`py-2 px-3 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  panelMode === 'pos'
                    ? 'bg-white dark:bg-darkbg-card text-navy dark:text-cyan-400 shadow-sm'
                    : 'text-slate-600 dark:text-gray-400 hover:text-navy dark:hover:text-white'
                }`}
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>Current Sale Cart ({cart.reduce((s, i) => s + i.quantity, 0)})</span>
              </button>

              <button
                type="button"
                onClick={() => setPanelMode('draft')}
                className={`py-2 px-3 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  panelMode === 'draft'
                    ? 'bg-white dark:bg-darkbg-card text-navy dark:text-cyan-400 shadow-sm'
                    : 'text-slate-600 dark:text-gray-400 hover:text-navy dark:hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Draft Preparation ({draftItems.reduce((s, i) => s + i.quantity, 0)})</span>
              </button>
            </div>

            {/* ========================================================= */}
            {/* MODE 1: CURRENT SALE CART (Immediate Checkout)            */}
            {/* ========================================================= */}
            {panelMode === 'pos' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-darkbg-border">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4 text-navy dark:text-greige" />
                    <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                      Active Customer Order
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
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1 divide-y divide-gray-100 dark:divide-darkbg-border">
                  {cart.length === 0 ? (
                    <div className="py-7 text-center text-xs text-gray-400">
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
                              PHP {item.unit_price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                        </div>

                        {/* Quantity controls */}
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="flex items-center border border-gray-300 dark:border-darkbg-border rounded-lg bg-gray-50 dark:bg-darkbg">
                            <button
                              type="button"
                              onClick={() => updateCartQuantity(item.product_id, item.quantity - 1)}
                              className="p-1 text-gray-500 hover:text-navy dark:hover:text-white"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-7 text-center text-xs font-bold">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateCartQuantity(item.product_id, item.quantity + 1)}
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

                {/* Price Calculations with Subtotal (Before Discount) */}
                <div className="p-3 bg-gray-50 dark:bg-darkbg rounded-xl space-y-1.5 text-xs border border-gray-200 dark:border-darkbg-border font-sans">
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Subtotal (Before Discount)</span>
                    <span className="font-mono">PHP {grossSubtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>

                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                      <span>Discount ({discountPct}%)</span>
                      <span className="font-mono">- PHP {discountAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Subtotal (Net of VAT)</span>
                    <span className="font-mono">PHP {vatExclusiveSubtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>

                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>12% Output VAT</span>
                    <span className="font-mono">PHP {vatAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>

                  <div className="pt-2 border-t border-gray-200 dark:border-darkbg-border flex justify-between items-baseline font-black text-base text-navy dark:text-greige">
                    <span>Total Amount Due</span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400">
                      PHP {totalAmountDue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Compact Minimalist Payment Method (Cash Accepted) */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-gray-400">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Banknote className="w-3.5 h-3.5 text-slate-500 dark:text-gray-400" />
                      Payment Method
                    </span>
                    <span className="font-semibold text-slate-700 dark:text-gray-300">
                      Cash
                    </span>
                  </div>

                  {/* Cash Amount Tendered & Single "Exact" Preset */}
                  <div className="p-3 bg-gray-50 dark:bg-darkbg rounded-xl border border-gray-200 dark:border-darkbg-border space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                        Amount Tendered (PHP) *
                      </label>
                      <button
                        type="button"
                        onClick={() => setAmountTendered(totalAmountDue > 0 ? totalAmountDue.toString() : '')}
                        className="px-2.5 py-0.5 text-[11px] font-bold rounded bg-gray-200 dark:bg-gray-700 hover:bg-navy hover:text-white transition cursor-pointer"
                      >
                        Exact
                      </button>
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
                      : 'bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white shadow-emerald-600/30 cursor-pointer'
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

            {/* ========================================================= */}
            {/* MODE 2: DRAFT PREPARATION (Save Quotations/Drafts)        */}
            {/* ========================================================= */}
            {panelMode === 'draft' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-darkbg-border">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-navy dark:text-greige" />
                    <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                      {draftActiveId ? `Editing Draft: ${draftReferenceNumber}` : 'Prepare Quotation / Draft'}
                    </h3>
                  </div>
                  {draftItems.length > 0 && (
                    <button
                      type="button"
                      onClick={resetDraftForm}
                      className="text-[11px] text-gray-500 hover:text-red-500 dark:text-gray-400 font-semibold"
                    >
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

                {/* Draft Notes */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-300 mb-1">
                    Quotation Notes / Terms
                  </label>
                  <input
                    type="text"
                    value={draftNotes}
                    onChange={(e) => setDraftNotes(e.target.value)}
                    placeholder="e.g. Valid for 7 days. Quote for PC upgrade package."
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-darkbg-border bg-gray-50 dark:bg-darkbg text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-navy"
                  />
                </div>

                {/* Draft Line Items */}
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1 divide-y divide-gray-100 dark:divide-darkbg-border">
                  {draftItems.length === 0 ? (
                    <div className="py-7 text-center text-xs text-gray-400">
                      <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      No items in draft. Select products from the left catalog to prepare quotation.
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
                              className="p-1 text-gray-500 hover:text-navy dark:hover:text-white"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-7 text-center text-xs font-bold">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateDraftQuantity(item.product_id, item.quantity + 1)}
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
                            onClick={() => removeDraftItem(item.product_id)}
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

                {/* Draft Price Calculations */}
                <div className="p-3 bg-gray-50 dark:bg-darkbg rounded-xl space-y-1.5 text-xs border border-gray-200 dark:border-darkbg-border font-sans">
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Subtotal (Before Discount)</span>
                    <span className="font-mono">PHP {draftGrossSubtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>

                  {draftDiscountAmount > 0 && (
                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                      <span>Discount ({draftDiscountPct}%)</span>
                      <span className="font-mono">- PHP {draftDiscountAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Subtotal (Net of VAT)</span>
                    <span className="font-mono">PHP {draftNetSubtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>

                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>12% Output VAT</span>
                    <span className="font-mono">PHP {draftVatAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>

                  <div className="pt-2 border-t border-gray-200 dark:border-darkbg-border flex justify-between items-baseline font-black text-base text-navy dark:text-greige">
                    <span>Quotation Total</span>
                    <span className="font-mono text-blue-600 dark:text-blue-400">
                      PHP {draftTotalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Draft Actions: Single Primary Action is "Save Draft" */}
                <div className="space-y-2 pt-1">
                  <button
                    type="button"
                    disabled={isSavingDraft || draftItems.length === 0}
                    onClick={handleSaveDraft}
                    className="w-full py-3 rounded-xl bg-navy hover:bg-navy-light text-white text-xs font-black shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSavingDraft ? 'Saving Draft in MySQL...' : (draftActiveId ? 'Update Draft' : 'Save Draft')}</span>
                  </button>

                  {/* Below Draft Preparation: Two Neutral Options */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setIsDraftsModalOpen(true)}
                      className="py-2.5 px-3 text-xs font-bold rounded-xl border border-slate-300 dark:border-darkbg-border bg-white dark:bg-darkbg text-slate-700 dark:text-gray-200 hover:bg-slate-100 dark:hover:bg-darkbg-hover transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <FileText className="w-3.5 h-3.5 text-slate-500" />
                      <span>Saved Drafts ({drafts.length})</span>
                    </button>

                    <button
                      type="button"
                      disabled={draftItems.length === 0}
                      onClick={handleProceedDraftToPos}
                      className="py-2.5 px-3 text-xs font-bold rounded-xl border border-slate-300 dark:border-darkbg-border bg-white dark:bg-darkbg text-slate-700 dark:text-gray-200 hover:bg-slate-100 dark:hover:bg-darkbg-hover transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-40"
                    >
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                      <span>Proceed to POS</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL: RESUME SAVED DRAFTS (Large, consistent typography) */}
      <Modal
        isOpen={isDraftsModalOpen}
        onClose={() => setIsDraftsModalOpen(false)}
        title="Resume Saved Draft"
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-gray-300">
            Select a saved customer quotation/draft to load directly into the POS cart or edit its line items:
          </p>

          {drafts.length === 0 ? (
            <div className="p-10 text-center text-sm font-medium text-slate-500 border border-dashed border-slate-300 dark:border-darkbg-border rounded-xl">
              No saved draft transactions found in MySQL.
            </div>
          ) : (
            <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
              {drafts.map(d => (
                <div
                  key={d.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-darkbg-border hover:border-navy dark:hover:border-cyan-400 bg-white dark:bg-darkbg-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition shadow-xs hover:shadow-md"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-navy dark:text-cyan-400">
                        {d.transaction_number || d.reference_number || d.invoice_number || `DFT-${d.id}`}
                      </span>
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-darkbg text-slate-700 dark:text-gray-300 border border-slate-200 dark:border-darkbg-border">
                        Draft
                      </span>
                    </div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      Customer: {d.customer_name || 'Walk-in Customer'}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-gray-400">
                      Created: {formatDateTime(d.transaction_date || d.created_at)} • {d.item_count || d.items?.length || 0} line items
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-darkbg-border">
                    <div className="text-left sm:text-right">
                      <p className="text-base font-black text-slate-900 dark:text-white font-mono">
                        PHP {Number(d.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          handleLoadDraftForEditing(d.id);
                        }}
                        className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-300 dark:border-darkbg-border bg-slate-50 dark:bg-darkbg text-slate-700 dark:text-gray-200 hover:bg-slate-100 transition cursor-pointer"
                        title="Edit in Draft Preparation"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          applyDraftToCart(d);
                          setIsDraftsModalOpen(false);
                        }}
                        className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-navy hover:bg-navy-light text-white transition flex items-center gap-1 cursor-pointer shadow-xs"
                      >
                        <span>Load POS</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end pt-2 border-t border-slate-200 dark:border-darkbg-border">
            <button
              onClick={() => setIsDraftsModalOpen(false)}
              className="px-4 py-2 text-xs font-bold rounded-lg bg-slate-100 dark:bg-darkbg text-slate-700 dark:text-gray-300 hover:bg-slate-200 cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL: OFFICIAL TRANSACTION RECEIPT */}
      <OfficialReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => {
          setIsReceiptModalOpen(false);
          setCompletedTransaction(null);
        }}
        receipt={completedTransaction}
      />

      {/* CONFIRMATION DIALOG */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={confirmConfig.action}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText="Confirm"
        type={confirmConfig.style}
      />
    </div>
  );
}
