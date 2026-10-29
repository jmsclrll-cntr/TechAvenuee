import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, 
  Search, 
  Trash2, 
  Save, 
  ArrowRight, 
  FileText, 
  RotateCcw, 
  XCircle, 
  CheckCircle2, 
  AlertTriangle,
  Package,
  Layers,
  Clock,
  User,
  Percent
} from 'lucide-react';
import Modal, { ConfirmDialog } from '../components/Modal';
import { api } from '../api';

export default function NewTransaction({ onProceedToPos, user }) {
  const [drafts, setDrafts] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchProduct, setSearchProduct] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Active Draft Editing State
  const [activeDraftId, setActiveDraftId] = useState(null);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [discountPct, setDiscountPct] = useState(0);
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState(null);

  // Confirmation dialog state
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({});

  const showNotification = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [draftsRes, posRes] = await Promise.all([
        api.getDrafts(),
        api.getPosProducts()
      ]);
      if (draftsRes.status === 'success') setDrafts(draftsRes.drafts);
      if (posRes.status === 'success') setProducts(posRes.products);
    } catch (err) {
      console.error('Error loading transaction draft data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Reset form to start a fresh draft
  const handleStartNewDraft = () => {
    setActiveDraftId(null);
    setReferenceNumber('');
    setCustomerName('Walk-in Customer');
    setDiscountPct(0);
    setNotes('');
    setItems([]);
  };

  // Resume or load an existing draft
  const handleLoadDraft = async (draftId) => {
    try {
      const res = await api.getDraftDetail(draftId);
      if (res.status === 'success') {
        const d = res.draft;
        setActiveDraftId(d.id);
        setReferenceNumber(d.invoice_number);
        setCustomerName(d.customer_name);
        setDiscountPct(Number(d.discount_pct || 0));
        setNotes(d.notes || '');
        setItems(d.items.map(i => ({
          product_id: i.product_id,
          name: i.name,
          sku: i.sku,
          brand: i.brand,
          unit_price: Number(i.unit_price),
          available_stock: i.available_stock,
          image_url: i.image_url,
          quantity: i.quantity
        })));
        showNotification(`Loaded draft ${d.invoice_number} for editing`);
      }
    } catch (err) {
      alert(`Error loading draft: ${err.message}`);
    }
  };

  // Add line item
  const handleAddItem = (product) => {
    const existing = items.find(i => i.product_id === product.id);
    if (existing) {
      setItems(items.map(i => 
        i.product_id === product.id ? { ...i, quantity: i.quantity + 1 } : i
      ));
    } else {
      setItems([...items, {
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

  const handleUpdateQuantity = (productId, newQty) => {
    const q = parseInt(newQty, 10);
    if (isNaN(q) || q <= 0) {
      handleRemoveItem(productId);
      return;
    }
    setItems(items.map(i => i.product_id === productId ? { ...i, quantity: q } : i));
  };

  const handleRemoveItem = (productId) => {
    setItems(items.filter(i => i.product_id !== productId));
  };

  // Calculate pricing
  const grossSubtotal = items.reduce((acc, cur) => acc + (cur.unit_price * cur.quantity), 0);
  const discountAmount = Math.round(grossSubtotal * (Number(discountPct) / 100.0) * 100) / 100;
  const netSubtotal = Math.round((grossSubtotal - discountAmount) * 100) / 100;
  const vatAmount = Math.round(netSubtotal * 0.12 * 100) / 100; // 12% VAT
  const totalAmount = Math.round((netSubtotal + vatAmount) * 100) / 100;

  // Save Draft (does NOT deduct stock)
  const handleSaveDraft = async () => {
    if (items.length === 0) {
      alert('Please add at least one product line item to save this draft');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        items: items.map(i => ({ product_id: i.product_id, quantity: i.quantity })),
        customer_name: customerName,
        discount_pct: Number(discountPct),
        notes: notes
      };

      if (activeDraftId) {
        await api.updateDraft(activeDraftId, payload);
        showNotification(`Draft ${referenceNumber} updated successfully in MySQL`);
      } else {
        const res = await api.saveDraft(payload);
        setActiveDraftId(res.draft_id);
        setReferenceNumber(res.reference_number);
        showNotification(`Draft ${res.reference_number} saved (Inventory untouched)`);
      }
      loadData();
    } catch (err) {
      alert(`Save draft failed: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Cancel Draft
  const handleCancelDraftClick = (draft) => {
    setConfirmConfig({
      title: 'Cancel Transaction Draft',
      message: `Are you sure you want to cancel draft ${draft.reference_number} for customer "${draft.customer_name}"? This draft will be archived and will not proceed to checkout.`,
      action: async () => {
        try {
          await api.cancelDraft(draft.id);
          showNotification(`Draft ${draft.reference_number} has been cancelled`);
          if (activeDraftId === draft.id) {
            handleStartNewDraft();
          }
          setIsConfirmOpen(false);
          loadData();
        } catch (err) {
          alert(`Cancellation error: ${err.message}`);
        }
      },
      style: 'danger'
    });
    setIsConfirmOpen(true);
  };

  // Proceed to POS Checkout
  const handleProceedToCheckout = () => {
    if (items.length === 0) {
      alert('Cannot proceed to POS: draft has no items');
      return;
    }

    // Check if any item exceeds available stock and display friendly notice
    const overStock = items.filter(i => i.quantity > i.available_stock);
    if (overStock.length > 0) {
      alert(`Warning: The following item(s) exceed current warehouse stock: ${overStock.map(o => `${o.name} (Req: ${o.quantity}, Stock: ${o.available_stock})`).join(', ')}. Please adjust quantities before checkout.`);
      return;
    }

    // If draft is modified or not saved yet, save it first
    handleSaveDraft().then(() => {
      if (onProceedToPos) {
        onProceedToPos(activeDraftId);
      }
    });
  };

  const categoriesList = ['All', ...new Set(products.map(p => p.category_name))];
  const filteredProducts = products.filter(p => {
    const matchesCat = selectedCategory === 'All' || p.category_name === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchProduct.toLowerCase()) || 
                          p.sku.toLowerCase().includes(searchProduct.toLowerCase()) ||
                          p.brand.toLowerCase().includes(searchProduct.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 text-white shadow-xl text-sm animate-bounce">
          <CheckCircle2 className="w-4 h-4" />
          <span>{notification.msg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-gray-200 dark:border-darkbg-border">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-navy dark:text-greige" />
            New Transaction — Draft Preparation
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Record customer requests, customize line items, and verify warehouse stock before transferring to the POS.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeDraftId && (
            <button
              onClick={handleStartNewDraft}
              className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-darkbg-border bg-white dark:bg-darkbg-card hover:bg-gray-100 dark:hover:bg-darkbg-hover text-xs font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-1.5 shadow-sm"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              New Blank Draft
            </button>
          )}
          <button
            onClick={handleSaveDraft}
            disabled={isSaving || items.length === 0}
            className="px-4 py-1.5 rounded-lg bg-navy hover:bg-navy-light text-white text-xs font-bold flex items-center gap-1.5 shadow-sm disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            {activeDraftId ? 'Update Draft' : 'Save Draft (MySQL)'}
          </button>
          <button
            onClick={handleProceedToCheckout}
            disabled={items.length === 0}
            className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md disabled:opacity-50"
          >
            <span>Proceed to POS Checkout</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Grid: Left Catalog & Existing Drafts, Right Draft Editor & Review */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Product Picker (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-border rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-sm text-gray-900 dark:text-white">Product Catalog & Inventory Check</h3>
                <p className="text-[11px] text-gray-400">Click products to add to current transaction draft</p>
              </div>
              <div className="relative w-full sm:w-60">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search SKU, name, brand..."
                  value={searchProduct}
                  onChange={(e) => setSearchProduct(e.target.value)}
                  className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-gray-200 dark:border-darkbg-border bg-gray-50 dark:bg-darkbg"
                />
              </div>
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {categoriesList.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === cat
                      ? 'bg-navy text-white font-bold'
                      : 'bg-gray-100 dark:bg-darkbg text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-darkbg-hover'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Products Grid with Photos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 max-h-[460px] overflow-y-auto pr-1">
              {filteredProducts.map((p) => {
                const inDraft = items.find(i => i.product_id === p.id);
                return (
                  <div
                    key={p.id}
                    onClick={() => handleAddItem(p)}
                    className="p-3 rounded-xl border border-gray-200 dark:border-darkbg-border hover:border-navy hover:shadow-md transition-all cursor-pointer bg-gray-50/50 dark:bg-darkbg/40 flex flex-col justify-between group"
                  >
                    <div>
                      {/* Product Thumbnail & Meta */}
                      <div className="flex items-start gap-2.5">
                        <div className="w-12 h-12 rounded-lg bg-gray-200 dark:bg-darkbg-card border border-gray-300 dark:border-darkbg-border p-1 shrink-0 overflow-hidden flex items-center justify-center">
                          <img
                            src={p.image_url || '/products/default.svg'}
                            alt={p.name}
                            className="w-full h-full object-contain"
                            onError={(e) => { e.target.src = '/products/default.svg'; }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="font-mono text-[9px] font-bold text-gray-400 uppercase">{p.sku}</span>
                          <h4 className="font-semibold text-xs text-gray-900 dark:text-white line-clamp-1 group-hover:text-navy dark:group-hover:text-blue-400">
                            {p.name}
                          </h4>
                          <span className="text-[10px] text-gray-400">{p.brand}</span>
                        </div>
                      </div>

                      <div className="mt-2.5 flex items-center justify-between text-xs">
                        <span className="font-bold font-mono text-navy dark:text-greige">
                          PHP {Number(p.selling_price).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          p.stock_quantity <= p.reorder_level
                            ? 'bg-amber-500/10 text-amber-500'
                            : 'bg-emerald-500/10 text-emerald-600'
                        }`}>
                          {p.stock_quantity} in stock
                        </span>
                      </div>
                    </div>

                    <div className="mt-2 pt-2 border-t border-gray-100 dark:border-darkbg-border flex items-center justify-between text-[11px]">
                      <span className="text-gray-400">
                        {inDraft ? `${inDraft.quantity} in draft` : 'Click to add'}
                      </span>
                      <span className="text-navy dark:text-greige font-bold text-xs">+ Add</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Existing Saved Drafts List (Resume or Cancel) */}
          <div className="bg-white dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-border rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-navy dark:text-greige" />
                Existing Active Transaction Drafts ({drafts.length})
              </h3>
              <span className="text-[11px] text-gray-400">Persisted in MySQL</span>
            </div>

            {drafts.length === 0 ? (
              <p className="text-xs text-gray-400 py-3 text-center">No active drafts found.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto">
                {drafts.map((d) => (
                  <div
                    key={d.id}
                    className={`p-3 rounded-lg border text-xs transition-all flex flex-col justify-between ${
                      activeDraftId === d.id
                        ? 'border-navy bg-navy/5 dark:border-greige dark:bg-darkbg-hover'
                        : 'border-gray-200 dark:border-darkbg-border bg-gray-50/50 dark:bg-darkbg/40'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-navy dark:text-blue-400 text-[11px]">
                          {d.reference_number}
                        </span>
                        <span className="text-[10px] text-gray-400">{d.created_at?.substring(5, 16)}</span>
                      </div>
                      <p className="font-semibold text-gray-900 dark:text-white mt-1">{d.customer_name}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        {d.item_count} items • Total: <strong className="font-mono text-emerald-600">PHP {Number(d.total_amount).toLocaleString()}</strong>
                      </p>
                    </div>

                    <div className="flex items-center justify-end gap-2 mt-2 pt-2 border-t border-gray-100 dark:border-darkbg-border">
                      <button
                        onClick={() => handleCancelDraftClick(d)}
                        className="px-2 py-1 rounded text-red-500 hover:bg-red-500/10 text-[10px] font-semibold"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleLoadDraft(d.id)}
                        className="px-2.5 py-1 rounded bg-navy text-white hover:bg-navy-light text-[10px] font-bold"
                      >
                        Resume Draft
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Transaction Draft Details & Review (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-border rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-darkbg-border">
            <div>
              <h3 className="font-bold text-sm text-gray-900 dark:text-white">Transaction Draft Preparation</h3>
              <p className="text-[11px] text-gray-400">
                {referenceNumber ? `Ref: ${referenceNumber}` : 'New Unsaved Draft'}
              </p>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
              STATUS: DRAFT
            </span>
          </div>

          {/* Customer & Discount Information */}
          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">Customer Name / Corporate Client</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Walk-in Customer"
                className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-darkbg-border bg-gray-50 dark:bg-darkbg"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">Applicable Discount %</label>
                <div className="relative">
                  <Percent className="w-3.5 h-3.5 absolute right-2.5 top-2.5 text-gray-400" />
                  <input
                    type="number"
                    min="0"
                    max="50"
                    step="0.5"
                    value={discountPct}
                    onChange={(e) => setDiscountPct(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-darkbg-border bg-gray-50 dark:bg-darkbg font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">Prepared By</label>
                <input
                  type="text"
                  disabled
                  value={user?.full_name || 'Cashier'}
                  className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-darkbg-border bg-gray-100 dark:bg-darkbg text-gray-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">Internal Preparation Notes / Instructions</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Quotation for client, requested bundle cable"
                className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-darkbg-border bg-gray-50 dark:bg-darkbg"
              />
            </div>
          </div>

          {/* Line Items Table */}
          <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-darkbg-border">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-gray-700 dark:text-gray-300">Transaction Line Items ({items.length})</span>
              {items.length > 0 && (
                <button
                  onClick={() => setItems([])}
                  className="text-red-500 hover:text-red-700 text-[11px]"
                >
                  Clear Items
                </button>
              )}
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {items.length === 0 ? (
                <div className="py-8 text-center text-gray-400 text-xs">
                  No line items added yet. Click items from the catalog on the left.
                </div>
              ) : (
                items.map((item) => (
                  <div
                    key={item.product_id}
                    className="p-2.5 rounded-lg bg-gray-50 dark:bg-darkbg border border-gray-200 dark:border-darkbg-border flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0 pr-2">
                      <div className="w-8 h-8 rounded bg-gray-200 dark:bg-darkbg-card p-0.5 shrink-0 overflow-hidden flex items-center justify-center">
                        <img
                          src={item.image_url || '/products/default.svg'}
                          alt={item.name}
                          className="w-full h-full object-contain"
                          onError={(e) => { e.target.src = '/products/default.svg'; }}
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-white truncate">{item.name}</p>
                        <p className="text-[10px] text-gray-400 font-mono">
                          {item.sku} • PHP {item.unit_price.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-gray-400">Qty:</span>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleUpdateQuantity(item.product_id, e.target.value)}
                          className="w-14 px-1.5 py-1 text-center font-bold font-mono rounded border border-gray-300 dark:border-darkbg-border bg-white dark:bg-darkbg-card"
                        />
                      </div>
                      <span className="w-20 text-right font-mono font-bold text-gray-900 dark:text-white">
                        PHP {(item.unit_price * item.quantity).toLocaleString()}
                      </span>
                      <button
                        onClick={() => handleRemoveItem(item.product_id)}
                        className="text-red-500 hover:text-red-700 p-1"
                        title="Remove Line Item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Pricing Calculation Summary */}
          <div className="pt-3 border-t border-gray-100 dark:border-darkbg-border space-y-1.5 text-xs">
            <div className="flex justify-between text-gray-500">
              <span>Gross Subtotal:</span>
              <span className="font-mono">PHP {grossSubtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
            {discountPct > 0 && (
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span>Discount ({discountPct}%):</span>
                <span className="font-mono">- PHP {discountAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-500">
              <span>Net Taxable Subtotal:</span>
              <span className="font-mono">PHP {netSubtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>12% Output VAT:</span>
              <span className="font-mono">PHP {vatAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-navy dark:text-white pt-2 border-t border-gray-200 dark:border-darkbg-border">
              <span>Calculated Total Amount:</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400">
                PHP {totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 space-y-2">
            <button
              onClick={handleProceedToCheckout}
              disabled={items.length === 0}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
            >
              <span>Transfer & Proceed to POS Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={handleSaveDraft}
              disabled={isSaving || items.length === 0}
              className="w-full py-2 rounded-xl border border-gray-200 dark:border-darkbg-border bg-gray-50 dark:bg-darkbg hover:bg-gray-100 dark:hover:bg-darkbg-hover text-gray-700 dark:text-gray-200 text-xs font-semibold flex items-center justify-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{activeDraftId ? 'Update Draft in Database' : 'Save as Draft in Database'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
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

