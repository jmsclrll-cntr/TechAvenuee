import React, { useState, useEffect } from 'react';
import {
  Truck,
  PlusCircle,
  Search,
  Package,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowDownLeft,
  Eye,
  Edit,
  Power,
  RotateCcw,
  FileText,
  DollarSign,
  Layers,
  Filter,
  X,
  AlertCircle,
  Building,
  User,
  Phone,
  Mail,
  MapPin,
  ClipboardList,
  PackageCheck
} from 'lucide-react';
import StatCard from '../components/StatCard';
import Modal, { ConfirmDialog } from '../components/Modal';
import { api } from '../api';

export default function PurchasingManagement({ user, initialTab = 'dashboard', clerkOnlyReceiving = false }) {
  const [subTab, setSubTab] = useState(clerkOnlyReceiving ? 'receiving' : initialTab);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);

  // Data states
  const [dashboardStats, setDashboardStats] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [productsCatalog, setProductsCatalog] = useState([]);

  // Modals state
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [supplierForm, setSupplierForm] = useState({
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    supplied_categories: '',
    status: 'active'
  });

  // Create PO Modal state
  const [isCreatePoModalOpen, setIsCreatePoModalOpen] = useState(false);
  const [newPoSupplierId, setNewPoSupplierId] = useState('');
  const [newPoDeliveryDate, setNewPoDeliveryDate] = useState('');
  const [newPoNotes, setNewPoNotes] = useState('');
  const [newPoItems, setNewPoItems] = useState([]);
  const [isSubmittingPo, setIsSubmittingPo] = useState(false);

  // View PO Details Modal
  const [isViewPoModalOpen, setIsViewPoModalOpen] = useState(false);
  const [selectedPo, setSelectedPo] = useState(null);

  // Stock Receiving Modal state
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [poToReceive, setPoToReceive] = useState(null);
  const [receivedQuantities, setReceivedQuantities] = useState({});
  const [receivingNotes, setReceivingNotes] = useState('');
  const [isSubmittingReceive, setIsSubmittingReceive] = useState(false);

  // Supplier History Modal
  const [supplierHistoryModalOpen, setSupplierHistoryModalOpen] = useState(false);
  const [selectedSupplierForHistory, setSelectedSupplierForHistory] = useState(null);
  const [supplierOrders, setSupplierOrders] = useState([]);

  // Search and Filter states
  const [supplierSearch, setSupplierSearch] = useState('');
  const [poSearch, setPoSearch] = useState('');
  const [poStatusFilter, setPoStatusFilter] = useState('All');

  const showFeedback = (msg, type = 'success') => {
    setFeedback({ msg, type });
    setTimeout(() => setFeedback(null), 4500);
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [dashRes, supRes, poRes, prodRes] = await Promise.all([
        api.getPurchasingDashboard(),
        api.getSuppliers(),
        api.getPurchaseOrders(),
        api.getPosProducts()
      ]);

      if (dashRes.status === 'success') setDashboardStats(dashRes.data);
      if (supRes.status === 'success') setSuppliers(supRes.suppliers);
      if (poRes.status === 'success') setPurchaseOrders(poRes.orders);
      if (prodRes.status === 'success') setProductsCatalog(prodRes.products);
    } catch (err) {
      console.error('Error loading purchasing module data:', err);
      showFeedback('Failed to load purchasing data from MySQL.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Sync subTab if initialTab changes
  useEffect(() => {
    if (clerkOnlyReceiving) {
      setSubTab('receiving');
    } else if (initialTab) {
      setSubTab(initialTab);
    }
  }, [initialTab, clerkOnlyReceiving]);

  // SUPPLIER CRUD OPERATIONS
  const handleOpenAddSupplier = () => {
    setEditingSupplier(null);
    setSupplierForm({
      name: '',
      contact_person: '',
      phone: '',
      email: '',
      address: '',
      supplied_categories: '',
      status: 'active'
    });
    setIsSupplierModalOpen(true);
  };

  const handleOpenEditSupplier = (supplier) => {
    setEditingSupplier(supplier);
    setSupplierForm({
      name: supplier.name || '',
      contact_person: supplier.contact_person || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || '',
      supplied_categories: supplier.supplied_categories || '',
      status: supplier.status || 'active'
    });
    setIsSupplierModalOpen(true);
  };

  const handleSaveSupplier = async (e) => {
    e.preventDefault();
    if (!supplierForm.name.trim()) {
      showFeedback('Supplier name is required.', 'error');
      return;
    }

    try {
      if (editingSupplier) {
        const res = await api.updateSupplier(editingSupplier.id, supplierForm);
        if (res.status === 'success') {
          showFeedback(`Supplier "${supplierForm.name}" updated successfully!`);
          setIsSupplierModalOpen(false);
          loadAllData();
        }
      } else {
        const res = await api.createSupplier(supplierForm);
        if (res.status === 'success') {
          showFeedback(`Supplier "${supplierForm.name}" added successfully!`);
          setIsSupplierModalOpen(false);
          loadAllData();
        }
      }
    } catch (err) {
      showFeedback(`Supplier operation failed: ${err.message}`, 'error');
    }
  };

  const handleToggleSupplierStatus = async (supplier) => {
    const nextStatus = supplier.status === 'active' ? 'inactive' : 'active';
    try {
      const res = await api.updateSupplierStatus(supplier.id, nextStatus);
      if (res.status === 'success') {
        showFeedback(`Supplier "${supplier.name}" marked as ${nextStatus}.`);
        loadAllData();
      }
    } catch (err) {
      showFeedback(`Failed to update supplier status: ${err.message}`, 'error');
    }
  };

  const handleViewSupplierHistory = async (supplier) => {
    setSelectedSupplierForHistory(supplier);
    setSupplierOrders([]);
    setSupplierHistoryModalOpen(true);
    try {
      const res = await api.getSupplierOrders(supplier.id);
      if (res.status === 'success') {
        setSupplierOrders(res.orders || []);
      }
    } catch (err) {
      console.error('Error fetching supplier orders:', err);
    }
  };

  // PURCHASE ORDER CREATION
  const handleOpenCreatePo = () => {
    if (suppliers.filter(s => s.status === 'active').length === 0) {
      showFeedback('No active suppliers found. Please register or activate a supplier first.', 'error');
      return;
    }
    const activeFirst = suppliers.find(s => s.status === 'active');
    setNewPoSupplierId(activeFirst ? activeFirst.id : '');
    // Default delivery date: 7 days from now
    const d = new Date();
    d.setDate(d.getDate() + 7);
    setNewPoDeliveryDate(d.toISOString().split('T')[0]);
    setNewPoNotes('');
    setNewPoItems([
      { product_id: productsCatalog[0]?.id || '', quantity_ordered: 10, unit_cost: productsCatalog[0]?.cost_price || 1000 }
    ]);
    setIsCreatePoModalOpen(true);
  };

  const handleAddPoItemRow = () => {
    const firstProd = productsCatalog[0];
    setNewPoItems([
      ...newPoItems,
      { product_id: firstProd ? firstProd.id : '', quantity_ordered: 5, unit_cost: firstProd ? firstProd.cost_price : 500 }
    ]);
  };

  const handleRemovePoItemRow = (idx) => {
    setNewPoItems(newPoItems.filter((_, i) => i !== idx));
  };

  const handlePoItemChange = (idx, field, value) => {
    const updated = [...newPoItems];
    if (field === 'product_id') {
      const p = productsCatalog.find(item => item.id === parseInt(value));
      updated[idx].product_id = parseInt(value);
      if (p) {
        updated[idx].unit_cost = p.cost_price || 0;
      }
    } else if (field === 'quantity_ordered') {
      updated[idx].quantity_ordered = Math.max(1, parseInt(value) || 1);
    } else if (field === 'unit_cost') {
      updated[idx].unit_cost = Math.max(0, parseFloat(value) || 0);
    }
    setNewPoItems(updated);
  };

  const poCalculatedTotal = newPoItems.reduce((sum, item) => sum + (item.quantity_ordered * item.unit_cost), 0);

  const handleSubmitPo = async (e) => {
    e.preventDefault();
    if (!newPoSupplierId) {
      showFeedback('Please select a supplier.', 'error');
      return;
    }
    if (newPoItems.length === 0) {
      showFeedback('Add at least one product line item to the order.', 'error');
      return;
    }

    setIsSubmittingPo(true);
    try {
      const payload = {
        supplier_id: parseInt(newPoSupplierId),
        expected_delivery_date: newPoDeliveryDate || null,
        notes: newPoNotes,
        items: newPoItems
      };

      const res = await api.createPurchaseOrder(payload);
      if (res.status === 'success') {
        showFeedback(`Purchase Order ${res.order.po_number} created successfully! Status set to Pending.`);
        setIsCreatePoModalOpen(false);
        loadAllData();
      } else {
        showFeedback(res.message || 'Failed to create purchase order.', 'error');
      }
    } catch (err) {
      showFeedback(`PO Creation failed: ${err.message}`, 'error');
    } finally {
      setIsSubmittingPo(false);
    }
  };

  // UPDATE PO STATUS (Pending -> Ordered -> Cancelled, etc.)
  const handleUpdatePoStatus = async (poId, nextStatus) => {
    try {
      const res = await api.updatePurchaseOrderStatus(poId, nextStatus);
      if (res.status === 'success') {
        showFeedback(`Order status updated to "${nextStatus}".`);
        loadAllData();
        if (selectedPo && selectedPo.id === poId) {
          const updatedPo = await api.getPurchaseOrder(poId);
          if (updatedPo.status === 'success') setSelectedPo(updatedPo.order);
        }
      }
    } catch (err) {
      showFeedback(`Status update failed: ${err.message}`, 'error');
    }
  };

  const handleViewPoDetails = async (poId) => {
    try {
      const res = await api.getPurchaseOrder(poId);
      if (res.status === 'success') {
        setSelectedPo(res.order);
        setIsViewPoModalOpen(true);
      }
    } catch (err) {
      showFeedback(`Failed to load PO details: ${err.message}`, 'error');
    }
  };

  // STOCK RECEIVING FLOW
  const handleOpenReceiveModal = async (po) => {
    try {
      const res = await api.getPurchaseOrder(po.id);
      if (res.status === 'success') {
        const fullPo = res.order;
        setPoToReceive(fullPo);

        // Pre-fill receivedQuantities with remaining unreceived amount
        const initialQtyMap = {};
        (fullPo.items || []).forEach(item => {
          const remaining = Math.max(0, item.quantity_ordered - (item.quantity_received || 0));
          initialQtyMap[item.id] = remaining;
        });
        setReceivedQuantities(initialQtyMap);
        setReceivingNotes('');
        setIsReceiveModalOpen(true);
      }
    } catch (err) {
      showFeedback(`Error opening receiving dialog: ${err.message}`, 'error');
    }
  };

  const handleSubmitStockReceiving = async (e) => {
    e.preventDefault();
    if (!poToReceive) return;

    // Validate quantities
    const itemsToReceive = [];
    for (const item of poToReceive.items || []) {
      const enteredQty = parseInt(receivedQuantities[item.id]) || 0;
      if (enteredQty < 0) {
        showFeedback(`Invalid negative quantity for ${item.product_name}.`, 'error');
        return;
      }
      const remaining = Math.max(0, item.quantity_ordered - (item.quantity_received || 0));
      if (enteredQty > remaining) {
        showFeedback(`Quantity for "${item.product_name}" exceeds outstanding balance (${remaining} units remaining).`, 'error');
        return;
      }
      if (enteredQty > 0) {
        itemsToReceive.push({
          order_item_id: item.id,
          product_id: item.product_id,
          quantity_received: enteredQty
        });
      }
    }

    if (itemsToReceive.length === 0) {
      showFeedback('Please enter at least 1 unit to receive.', 'error');
      return;
    }

    setIsSubmittingReceive(true);
    try {
      const res = await api.receivePurchaseOrderStock(poToReceive.id, {
        notes: receivingNotes,
        items: itemsToReceive
      });

      if (res.status === 'success') {
        showFeedback(`Stock successfully received! Added ${res.receiving_record.total_units} units to MySQL inventory.`);
        setIsReceiveModalOpen(false);
        setPoToReceive(null);
        loadAllData();
      } else {
        showFeedback(res.message || 'Receiving failed.', 'error');
      }
    } catch (err) {
      showFeedback(`Stock receiving error: ${err.message}`, 'error');
    } finally {
      setIsSubmittingReceive(false);
    }
  };

  // Status badge styling
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Draft':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">Draft</span>;
      case 'Pending':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">Pending Approval</span>;
      case 'Ordered':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">Ordered • Awaiting Delivery</span>;
      case 'Partially Received':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300">Partially Received</span>;
      case 'Received':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300">Received (Completed)</span>;
      case 'Cancelled':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300">Cancelled</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700">{status}</span>;
    }
  };

  // Filtered lists
  const filteredSuppliers = suppliers.filter(s => {
    if (!supplierSearch) return true;
    const q = supplierSearch.toLowerCase();
    return s.name.toLowerCase().includes(q) || 
      (s.contact_person && s.contact_person.toLowerCase().includes(q)) ||
      (s.supplied_categories && s.supplied_categories.toLowerCase().includes(q));
  });

  const filteredOrders = purchaseOrders.filter(po => {
    const matchesStatus = poStatusFilter === 'All' || po.status === poStatusFilter;
    const matchesSearch = !poSearch || 
      po.po_number.toLowerCase().includes(poSearch.toLowerCase()) ||
      po.supplier_name.toLowerCase().includes(poSearch.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const eligibleForReceivingOrders = purchaseOrders.filter(po => 
    po.status === 'Ordered' || po.status === 'Partially Received' || po.status === 'Pending'
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200 dark:border-darkbg-border">
        <div>
          <h1 className="text-2xl font-black text-navy dark:text-white tracking-tight flex items-center gap-2">
            <Truck className="w-7 h-7 text-navy dark:text-greige" />
            {clerkOnlyReceiving ? 'Authorized Stock Receiving' : 'Supplier & Purchasing Management'}
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {clerkOnlyReceiving 
              ? 'Receive verified vendor shipments against approved purchase orders and update physical inventory.'
              : 'End-to-end procurement lifecycle: manage verified vendors, draft purchase orders, and receive verified stock shipments.'}
          </p>
        </div>

        {/* Global Action buttons */}
        {!clerkOnlyReceiving && (
          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenAddSupplier}
              className="flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-lg border border-gray-300 dark:border-darkbg-border bg-white dark:bg-darkbg-card text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm transition"
            >
              <Building className="w-4 h-4 text-blue-600" />
              Add Supplier
            </button>
            <button
              onClick={handleOpenCreatePo}
              className="flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-lg bg-navy hover:bg-navy-dark text-white dark:bg-greige dark:text-navy shadow-sm transition"
            >
              <PlusCircle className="w-4 h-4" />
              Create Purchase Order
            </button>
          </div>
        )}
      </div>

      {/* Notification Toast */}
      {feedback && (
        <div className={`p-4 rounded-xl border text-sm font-semibold flex items-center justify-between shadow-md transition-all ${
          feedback.type === 'error' 
            ? 'bg-red-50 dark:bg-red-950/60 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800' 
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

      {/* Sub-navigation tabs (Hidden if clerkOnlyReceiving) */}
      {!clerkOnlyReceiving && (
        <div className="flex items-center gap-2 border-b border-gray-200 dark:border-darkbg-border pb-3">
          {[
            { id: 'dashboard', label: 'Purchasing Dashboard', icon: Layers },
            { id: 'orders', label: 'Purchase Orders', icon: ClipboardList, count: purchaseOrders.length },
            { id: 'receiving', label: 'Stock Receiving', icon: PackageCheck, count: eligibleForReceivingOrders.length },
            { id: 'suppliers', label: 'Suppliers Directory', icon: Building, count: suppliers.length }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = subTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSubTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
                  isActive
                    ? 'bg-navy text-white dark:bg-greige dark:text-navy shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-darkbg'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-white/20 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* SUB-TAB 1: PURCHASING DASHBOARD */}
      {subTab === 'dashboard' && !clerkOnlyReceiving && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <StatCard
              title="Active Suppliers"
              value={dashboardStats?.active_suppliers || 0}
              subtitle="Registered & active vendors"
              icon={Building}
              badgeColor="blue"
            />
            <StatCard
              title="Pending Approval"
              value={dashboardStats?.pending_pos || 0}
              subtitle="Draft & pending POs"
              icon={Clock}
              badgeColor="amber"
            />
            <StatCard
              title="Awaiting Delivery"
              value={dashboardStats?.orders_awaiting_delivery || 0}
              subtitle="Ordered shipments in transit"
              icon={Truck}
              badgeColor="blue"
            />
            <StatCard
              title="Recently Received"
              value={dashboardStats?.recently_received_count || 0}
              subtitle="Completed receiving batches"
              icon={CheckCircle2}
              badgeColor="green"
            />
            <StatCard
              title="Purchasing Spend"
              value={`PHP ${(dashboardStats?.total_purchasing_value || 0).toLocaleString('en-US', { minimumFractionDigits: 0 })}`}
              subtitle="Total procurement volume"
              icon={DollarSign}
              badgeColor="green"
            />
            <StatCard
              title="Needs Restock"
              value={dashboardStats?.low_stock_replenish?.length || 0}
              subtitle="Products at reorder level"
              icon={AlertTriangle}
              badgeColor="amber"
            />
          </div>

          {/* Quick Split: Low-Stock Products Requiring Replenishment & Recent Receiving Batches */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Low-Stock Products Replenishment List */}
            <div className="bg-white dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-border rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                    Low-Stock Products Requiring Replenishment
                  </h3>
                </div>
                <button
                  onClick={handleOpenCreatePo}
                  className="text-xs font-bold text-navy dark:text-greige hover:underline flex items-center gap-1"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Order Restock
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-50 dark:bg-darkbg text-gray-500 border-b border-gray-200 dark:border-darkbg-border">
                    <tr>
                      <th className="py-2.5 px-3 font-semibold">Product</th>
                      <th className="py-2.5 px-2 font-semibold">SKU</th>
                      <th className="py-2.5 px-2 font-semibold text-center">Stock</th>
                      <th className="py-2.5 px-2 font-semibold text-center">Reorder Level</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-darkbg-border">
                    {(dashboardStats?.low_stock_replenish || []).length === 0 ? (
                      <tr>
                        <td colSpan="5" className="py-6 text-center text-gray-400">
                          All products are currently well-stocked above reorder thresholds!
                        </td>
                      </tr>
                    ) : (
                      (dashboardStats?.low_stock_replenish || []).slice(0, 6).map(item => (
                        <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-darkbg">
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded bg-white dark:bg-darkbg border p-0.5 shrink-0 flex items-center justify-center">
                                <img 
                                  src={item.image_url || '/products/default.svg'} 
                                  alt={item.name} 
                                  className="max-h-full max-w-full object-contain"
                                  onError={(e) => { e.target.src = '/products/default.svg'; }}
                                />
                              </div>
                              <span className="font-bold text-gray-800 dark:text-gray-200 truncate max-w-[150px]">
                                {item.name}
                              </span>
                            </div>
                          </td>
                          <td className="py-2.5 px-2 font-mono text-gray-500">{item.sku}</td>
                          <td className="py-2.5 px-2 text-center font-bold text-red-600 dark:text-red-400">
                            {item.stock_quantity}
                          </td>
                          <td className="py-2.5 px-2 text-center text-gray-500">
                            {item.reorder_level}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              onClick={() => {
                                handleOpenCreatePo();
                                setNewPoItems([{ product_id: item.id, quantity_ordered: 20, unit_cost: item.cost_price || 1000 }]);
                              }}
                              className="text-[11px] font-bold text-navy dark:text-greige hover:underline"
                            >
                              Draft PO
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Inventory Receiving Activity */}
            <div className="bg-white dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-border rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <ArrowDownLeft className="w-5 h-5 text-green-600" />
                  <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                    Recent Stock Receiving Movements
                  </h3>
                </div>
                <button
                  onClick={() => setSubTab('receiving')}
                  className="text-xs font-bold text-navy dark:text-greige hover:underline"
                >
                  Go to Receiving
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-50 dark:bg-darkbg text-gray-500 border-b border-gray-200 dark:border-darkbg-border">
                    <tr>
                      <th className="py-2.5 px-3 font-semibold">Ref #</th>
                      <th className="py-2.5 px-3 font-semibold">Product</th>
                      <th className="py-2.5 px-2 font-semibold text-center">Qty Added</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-darkbg-border">
                    {(dashboardStats?.recent_movements || []).length === 0 ? (
                      <tr>
                        <td colSpan="4" className="py-6 text-center text-gray-400">
                          No recent receiving movements recorded.
                        </td>
                      </tr>
                    ) : (
                      (dashboardStats?.recent_movements || []).slice(0, 6).map(m => (
                        <tr key={m.id} className="hover:bg-gray-50 dark:hover:bg-darkbg">
                          <td className="py-2.5 px-3 font-mono font-bold text-navy dark:text-greige">
                            {m.reference_number || `RCV-${m.id}`}
                          </td>
                          <td className="py-2.5 px-3 text-gray-800 dark:text-gray-200 font-medium truncate max-w-[160px]">
                            {m.product_name}
                          </td>
                          <td className="py-2.5 px-2 text-center font-black text-green-600 dark:text-green-400">
                            +{m.quantity}
                          </td>
                          <td className="py-2.5 px-3 text-right text-gray-500 text-[11px]">
                            {new Date(m.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* SUB-TAB 2: PURCHASE ORDERS LIST */}
      {subTab === 'orders' && !clerkOnlyReceiving && (
        <div className="space-y-4">
          {/* Filters & Search */}
          <div className="bg-white dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-border rounded-xl p-4 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search PO number or supplier name..."
                value={poSearch}
                onChange={(e) => setPoSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-gray-300 dark:border-darkbg-border bg-gray-50 dark:bg-darkbg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-navy"
              />
            </div>

            {/* Status Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              {['All', 'Pending', 'Ordered', 'Partially Received', 'Received', 'Cancelled'].map(st => (
                <button
                  key={st}
                  onClick={() => setPoStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                    poStatusFilter === st
                      ? 'bg-navy text-white dark:bg-greige dark:text-navy shadow-sm'
                      : 'bg-gray-100 dark:bg-darkbg text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Orders Table */}
          <div className="bg-white dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-border rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50 dark:bg-darkbg text-gray-500 border-b border-gray-200 dark:border-darkbg-border">
                  <tr>
                    <th className="py-3 px-4 font-semibold">PO Number</th>
                    <th className="py-3 px-4 font-semibold">Supplier</th>
                    <th className="py-3 px-3 font-semibold">Order Date</th>
                    <th className="py-3 px-3 font-semibold">Expected Delivery</th>
                    <th className="py-3 px-3 font-semibold text-right">Total Amount</th>
                    <th className="py-3 px-3 font-semibold text-center">Status</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-darkbg-border">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-12 text-center text-gray-400">
                        No purchase orders found matching current filter.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map(po => (
                      <tr key={po.id} className="hover:bg-gray-50/80 dark:hover:bg-darkbg transition">
                        <td className="py-3 px-4 font-mono font-bold text-navy dark:text-greige">
                          {po.po_number}
                        </td>
                        <td className="py-3 px-4 font-bold text-gray-900 dark:text-white">
                          {po.supplier_name}
                        </td>
                        <td className="py-3 px-3 text-gray-500">
                          {new Date(po.order_date).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-3 text-gray-500">
                          {po.expected_delivery_date ? new Date(po.expected_delivery_date).toLocaleDateString() : 'Not specified'}
                        </td>
                        <td className="py-3 px-3 text-right font-black text-gray-900 dark:text-white">
                          PHP {Number(po.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {getStatusBadge(po.status)}
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <button
                            onClick={() => handleViewPoDetails(po.id)}
                            className="p-1.5 rounded-lg border border-gray-200 dark:border-darkbg-border hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
                            title="View Full PO Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {po.status === 'Pending' && (
                            <button
                              onClick={() => handleUpdatePoStatus(po.id, 'Ordered')}
                              className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px]"
                            >
                              Approve & Order
                            </button>
                          )}

                          {(po.status === 'Ordered' || po.status === 'Partially Received') && (
                            <button
                              onClick={() => handleOpenReceiveModal(po)}
                              className="px-2.5 py-1 rounded-lg bg-green-600 hover:bg-green-700 text-white font-bold text-[11px]"
                            >
                              Receive Stock
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: STOCK RECEIVING (ACCESSIBLE TO ADMIN & INVENTORY CLERK) */}
      {(subTab === 'receiving' || clerkOnlyReceiving) && (
        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <PackageCheck className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <div>
                <h3 className="text-xs font-bold text-blue-900 dark:text-blue-100 uppercase">
                  Verified Inbound Receiving Workflow
                </h3>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">
                  Select an active purchase order to process incoming shipments. Received items will be validated against outstanding quantities and automatically increment physical inventory in MySQL.
                </p>
              </div>
            </div>
          </div>

          {/* Outstanding POs Ready for Receiving */}
          <div className="bg-white dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-border rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-darkbg-border flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Truck className="w-4 h-4 text-navy dark:text-greige" />
                Orders Awaiting Stock Receiving ({eligibleForReceivingOrders.length})
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50 dark:bg-darkbg text-gray-500 border-b border-gray-200 dark:border-darkbg-border">
                  <tr>
                    <th className="py-3 px-4 font-semibold">PO Number</th>
                    <th className="py-3 px-4 font-semibold">Supplier</th>
                    <th className="py-3 px-3 font-semibold">Expected Date</th>
                    <th className="py-3 px-3 font-semibold text-center">Status</th>
                    <th className="py-3 px-4 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-darkbg-border">
                  {eligibleForReceivingOrders.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-12 text-center text-gray-400">
                        No outstanding purchase orders awaiting delivery at this time.
                      </td>
                    </tr>
                  ) : (
                    eligibleForReceivingOrders.map(po => (
                      <tr key={po.id} className="hover:bg-gray-50/80 dark:hover:bg-darkbg transition">
                        <td className="py-3 px-4 font-mono font-bold text-navy dark:text-greige">
                          {po.po_number}
                        </td>
                        <td className="py-3 px-4 font-bold text-gray-800 dark:text-gray-100">
                          {po.supplier_name}
                        </td>
                        <td className="py-3 px-3 text-gray-500">
                          {po.expected_delivery_date ? new Date(po.expected_delivery_date).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {getStatusBadge(po.status)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleOpenReceiveModal(po)}
                            className="px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white font-bold text-xs flex items-center gap-1.5 ml-auto shadow-sm"
                          >
                            <PackageCheck className="w-4 h-4" />
                            Process Receiving
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: SUPPLIERS DIRECTORY */}
      {subTab === 'suppliers' && !clerkOnlyReceiving && (
        <div className="space-y-4">
          {/* Search & Actions Bar */}
          <div className="bg-white dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-border rounded-xl p-4 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search suppliers by company name, contact person, or category..."
                value={supplierSearch}
                onChange={(e) => setSupplierSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-gray-300 dark:border-darkbg-border bg-gray-50 dark:bg-darkbg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-navy"
              />
            </div>
          </div>

          {/* Suppliers Table */}
          <div className="bg-white dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-border rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50 dark:bg-darkbg text-gray-500 border-b border-gray-200 dark:border-darkbg-border">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Supplier Name</th>
                    <th className="py-3 px-3 font-semibold">Contact Person</th>
                    <th className="py-3 px-3 font-semibold">Contact Info</th>
                    <th className="py-3 px-3 font-semibold">Supplied Categories</th>
                    <th className="py-3 px-3 font-semibold text-center">Status</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-darkbg-border">
                  {filteredSuppliers.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-gray-400">
                        No suppliers found in MySQL database.
                      </td>
                    </tr>
                  ) : (
                    filteredSuppliers.map(s => (
                      <tr key={s.id} className="hover:bg-gray-50/80 dark:hover:bg-darkbg transition">
                        <td className="py-3 px-4">
                          <div className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Building className="w-3.5 h-3.5 text-navy dark:text-greige" />
                            {s.name}
                          </div>
                          {s.address && (
                            <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3" />
                              {s.address}
                            </p>
                          )}
                        </td>
                        <td className="py-3 px-3 text-gray-700 dark:text-gray-300 font-medium">
                          {s.contact_person || 'N/A'}
                        </td>
                        <td className="py-3 px-3 text-gray-500 space-y-0.5">
                          {s.phone && (
                            <div className="flex items-center gap-1 text-[11px]">
                              <Phone className="w-3 h-3 text-gray-400" />
                              <span>{s.phone}</span>
                            </div>
                          )}
                          {s.email && (
                            <div className="flex items-center gap-1 text-[11px]">
                              <Mail className="w-3 h-3 text-gray-400" />
                              <span>{s.email}</span>
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <span className="text-[11px] font-semibold text-gray-600 dark:text-gray-400">
                            {s.supplied_categories || 'General Electronics'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            s.status === 'active'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
                              : 'bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                          }`}>
                            {s.status === 'active' ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right space-x-1.5">
                          <button
                            onClick={() => handleViewSupplierHistory(s)}
                            className="p-1.5 rounded-lg border border-gray-200 dark:border-darkbg-border hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
                            title="View PO History"
                          >
                            <ClipboardList className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEditSupplier(s)}
                            className="p-1.5 rounded-lg border border-gray-200 dark:border-darkbg-border hover:bg-gray-100 dark:hover:bg-gray-700 text-blue-600 dark:text-blue-400"
                            title="Edit Supplier"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleToggleSupplierStatus(s)}
                            className={`p-1.5 rounded-lg border border-gray-200 dark:border-darkbg-border ${
                              s.status === 'active' 
                                ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40' 
                                : 'text-green-600 hover:bg-green-50 dark:hover:bg-green-950/40'
                            }`}
                            title={s.status === 'active' ? 'Deactivate Supplier' : 'Activate Supplier'}
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD / EDIT SUPPLIER */}
      <Modal
        isOpen={isSupplierModalOpen}
        onClose={() => setIsSupplierModalOpen(false)}
        title={editingSupplier ? `Edit Supplier: ${editingSupplier.name}` : 'Register New Vendor / Supplier'}
        size="md"
      >
        <form onSubmit={handleSaveSupplier} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Supplier / Company Name *
            </label>
            <input
              type="text"
              required
              value={supplierForm.name}
              onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
              placeholder="e.g. Asus Philippines Corp."
              className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-darkbg-border bg-gray-50 dark:bg-darkbg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-navy"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Contact Person
              </label>
              <input
                type="text"
                value={supplierForm.contact_person}
                onChange={(e) => setSupplierForm({ ...supplierForm, contact_person: e.target.value })}
                placeholder="e.g. John Santos"
                className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-darkbg-border bg-gray-50 dark:bg-darkbg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-navy"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Phone Number
              </label>
              <input
                type="text"
                value={supplierForm.phone}
                onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                placeholder="e.g. +63 917 123 4567"
                className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-darkbg-border bg-gray-50 dark:bg-darkbg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-navy"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={supplierForm.email}
                onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
                placeholder="e.g. sales@asus-ph.com"
                className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-darkbg-border bg-gray-50 dark:bg-darkbg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-navy"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                value={supplierForm.status}
                onChange={(e) => setSupplierForm({ ...supplierForm, status: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-darkbg-border bg-gray-50 dark:bg-darkbg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-navy"
              >
                <option value="active">Active Vendor</option>
                <option value="inactive">Inactive / Suspended</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Supplied Product Categories
            </label>
            <input
              type="text"
              value={supplierForm.supplied_categories}
              onChange={(e) => setSupplierForm({ ...supplierForm, supplied_categories: e.target.value })}
              placeholder="e.g. Laptops, Desktops, Motherboards, GPUs"
              className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-darkbg-border bg-gray-50 dark:bg-darkbg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-navy"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Office / Warehouse Address
            </label>
            <textarea
              rows="2"
              value={supplierForm.address}
              onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
              placeholder="e.g. 120 Shaw Blvd, Mandaluyong City, Metro Manila"
              className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-darkbg-border bg-gray-50 dark:bg-darkbg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-navy"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-gray-200 dark:border-darkbg-border">
            <button
              type="button"
              onClick={() => setIsSupplierModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-gray-100 dark:bg-darkbg text-gray-700 dark:text-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold rounded-lg bg-navy text-white dark:bg-greige dark:text-navy hover:bg-navy-dark"
            >
              {editingSupplier ? 'Update Supplier' : 'Save Supplier'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: CREATE PURCHASE ORDER */}
      <Modal
        isOpen={isCreatePoModalOpen}
        onClose={() => setIsCreatePoModalOpen(false)}
        title="Draft New Purchase Order (PO)"
        size="lg"
      >
        <form onSubmit={handleSubmitPo} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Select Supplier *
              </label>
              <select
                required
                value={newPoSupplierId}
                onChange={(e) => setNewPoSupplierId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-darkbg-border bg-gray-50 dark:bg-darkbg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-navy"
              >
                {suppliers.filter(s => s.status === 'active').map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.contact_person || 'General'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Expected Delivery Date
              </label>
              <input
                type="date"
                value={newPoDeliveryDate}
                onChange={(e) => setNewPoDeliveryDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-darkbg-border bg-gray-50 dark:bg-darkbg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-navy"
              />
            </div>
          </div>

          {/* Line items section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                Order Line Items ({newPoItems.length})
              </label>
              <button
                type="button"
                onClick={handleAddPoItemRow}
                className="text-xs text-navy dark:text-greige font-bold flex items-center gap-1 hover:underline"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Add Line Item
              </button>
            </div>

            <div className="border border-gray-200 dark:border-darkbg-border rounded-xl overflow-hidden max-h-56 overflow-y-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50 dark:bg-darkbg text-gray-500 border-b border-gray-200 dark:border-darkbg-border">
                  <tr>
                    <th className="py-2 px-3 font-semibold">Product</th>
                    <th className="py-2 px-2 font-semibold w-24">Quantity</th>
                    <th className="py-2 px-2 font-semibold w-32">Unit Cost (PHP)</th>
                    <th className="py-2 px-3 font-semibold text-right w-28">Subtotal</th>
                    <th className="py-2 px-2 text-center w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-darkbg-border">
                  {newPoItems.map((item, idx) => {
                    const lineSubtotal = item.quantity_ordered * item.unit_cost;
                    return (
                      <tr key={idx}>
                        <td className="py-2 px-3">
                          <select
                            value={item.product_id}
                            onChange={(e) => handlePoItemChange(idx, 'product_id', e.target.value)}
                            className="w-full px-2 py-1 text-xs rounded border border-gray-300 dark:border-darkbg-border bg-white dark:bg-darkbg text-gray-900 dark:text-white"
                          >
                            {productsCatalog.map(p => (
                              <option key={p.id} value={p.id}>
                                {p.name} ({p.sku}) - Cur Stock: {p.stock_quantity}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity_ordered}
                            onChange={(e) => handlePoItemChange(idx, 'quantity_ordered', e.target.value)}
                            className="w-full px-2 py-1 text-xs rounded border border-gray-300 dark:border-darkbg-border bg-white dark:bg-darkbg text-gray-900 dark:text-white"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.unit_cost}
                            onChange={(e) => handlePoItemChange(idx, 'unit_cost', e.target.value)}
                            className="w-full px-2 py-1 text-xs rounded border border-gray-300 dark:border-darkbg-border bg-white dark:bg-darkbg text-gray-900 dark:text-white"
                          />
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-gray-800 dark:text-gray-100">
                          PHP {lineSubtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2 px-2 text-center">
                          {newPoItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemovePoItemRow(idx)}
                              className="text-gray-400 hover:text-red-500"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Calculated Order Total */}
            <div className="flex justify-between items-baseline p-3 bg-gray-50 dark:bg-darkbg rounded-xl text-xs">
              <span className="font-bold text-gray-600 dark:text-gray-400">Total Purchase Order Value:</span>
              <span className="text-sm font-black text-navy dark:text-greige">
                PHP {poCalculatedTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Procurement Notes & Delivery Instructions
            </label>
            <textarea
              rows="2"
              value={newPoNotes}
              onChange={(e) => setNewPoNotes(e.target.value)}
              placeholder="e.g. Deliver to Loading Bay B; fragile cargo; warranty certificates required."
              className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-darkbg-border bg-gray-50 dark:bg-darkbg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-navy"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-gray-200 dark:border-darkbg-border">
            <button
              type="button"
              onClick={() => setIsCreatePoModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-gray-100 dark:bg-darkbg text-gray-700 dark:text-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmittingPo}
              className="px-4 py-2 text-xs font-bold rounded-lg bg-navy text-white dark:bg-greige dark:text-navy hover:bg-navy-dark flex items-center gap-1.5"
            >
              {isSubmittingPo ? 'Submitting PO...' : 'Create Purchase Order'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: VIEW PURCHASE ORDER DETAILS */}
      <Modal
        isOpen={isViewPoModalOpen}
        onClose={() => setIsViewPoModalOpen(false)}
        title={selectedPo ? `Purchase Order: ${selectedPo.po_number}` : 'PO Details'}
        size="lg"
      >
        {selectedPo && (
          <div className="space-y-4 text-xs">
            {/* Top metadata grid */}
            <div className="p-4 bg-gray-50 dark:bg-darkbg rounded-xl border border-gray-200 dark:border-darkbg-border grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <span className="text-gray-400 block text-[10px] uppercase font-bold">Supplier</span>
                <span className="font-bold text-gray-900 dark:text-white">{selectedPo.supplier_name}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase font-bold">Order Date</span>
                <span className="font-medium text-gray-800 dark:text-gray-200">
                  {new Date(selectedPo.order_date).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase font-bold">Delivery Due</span>
                <span className="font-medium text-gray-800 dark:text-gray-200">
                  {selectedPo.expected_delivery_date ? new Date(selectedPo.expected_delivery_date).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase font-bold">Current Status</span>
                <div className="mt-0.5">{getStatusBadge(selectedPo.status)}</div>
              </div>
            </div>

            {/* Line items table with quantities ordered vs received */}
            <div>
              <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-2">Order Line Items</h4>
              <div className="border border-gray-200 dark:border-darkbg-border rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-50 dark:bg-darkbg text-gray-500 border-b border-gray-200 dark:border-darkbg-border">
                    <tr>
                      <th className="py-2.5 px-3 font-semibold">Product Description</th>
                      <th className="py-2.5 px-2 font-semibold">SKU</th>
                      <th className="py-2.5 px-2 font-semibold text-center">Ordered</th>
                      <th className="py-2.5 px-2 font-semibold text-center">Received</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Unit Cost</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Total Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-darkbg-border">
                    {(selectedPo.items || []).map((it, idx) => (
                      <tr key={idx}>
                        <td className="py-2.5 px-3 font-bold text-gray-800 dark:text-gray-200">{it.product_name}</td>
                        <td className="py-2.5 px-2 font-mono text-gray-500">{it.sku}</td>
                        <td className="py-2.5 px-2 text-center font-bold">{it.quantity_ordered}</td>
                        <td className="py-2.5 px-2 text-center font-bold text-green-600 dark:text-green-400">
                          {it.quantity_received || 0}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          PHP {Number(it.unit_cost).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-3 text-right font-black">
                          PHP {(it.quantity_ordered * it.unit_cost).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Receiving history batches if any */}
            {(selectedPo.receiving_history || []).length > 0 && (
              <div>
                <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-2">Receiving Log History</h4>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {selectedPo.receiving_history.map(rcv => (
                    <div key={rcv.id} className="p-2.5 rounded-lg bg-gray-50 dark:bg-darkbg border border-gray-200 dark:border-darkbg-border flex items-center justify-between text-[11px]">
                      <div>
                        <span className="font-mono font-bold text-navy dark:text-greige">{rcv.receiving_number}</span>
                        <span className="text-gray-500 ml-2">Received by {rcv.received_by_name || 'Staff'} on {new Date(rcv.received_date).toLocaleString()}</span>
                      </div>
                      <span className="font-bold text-green-600">+{rcv.total_quantity_received} units added to stock</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer actions */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-darkbg-border">
              <div className="flex items-center gap-2">
                {selectedPo.status === 'Pending' && (
                  <button
                    onClick={() => handleUpdatePoStatus(selectedPo.id, 'Ordered')}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700"
                  >
                    Approve Order
                  </button>
                )}
                {(selectedPo.status === 'Ordered' || selectedPo.status === 'Partially Received') && (
                  <button
                    onClick={() => {
                      setIsViewPoModalOpen(false);
                      handleOpenReceiveModal(selectedPo);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-green-600 text-white font-bold hover:bg-green-700 flex items-center gap-1.5"
                  >
                    <PackageCheck className="w-4 h-4" />
                    Receive Stock
                  </button>
                )}
              </div>

              <button
                onClick={() => setIsViewPoModalOpen(false)}
                className="px-4 py-2 bg-gray-100 dark:bg-darkbg text-gray-700 dark:text-gray-300 rounded-lg font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL 4: STOCK RECEIVING FORM */}
      <Modal
        isOpen={isReceiveModalOpen}
        onClose={() => setIsReceiveModalOpen(false)}
        title={poToReceive ? `Receive Shipment for ${poToReceive.po_number}` : 'Receive Stock'}
        size="lg"
      >
        {poToReceive && (
          <form onSubmit={handleSubmitStockReceiving} className="space-y-4 text-xs">
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-800 dark:text-amber-200">
              <p className="font-bold">Vendor: {poToReceive.supplier_name}</p>
              <p className="text-[11px] mt-0.5">
                Verify each physically delivered box against the order list below. Enter only the exact quantities counted. Stock will be incremented in MySQL atomically.
              </p>
            </div>

            <div className="border border-gray-200 dark:border-darkbg-border rounded-xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50 dark:bg-darkbg text-gray-500 border-b border-gray-200 dark:border-darkbg-border">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold">Product</th>
                    <th className="py-2.5 px-2 font-semibold text-center">Ordered</th>
                    <th className="py-2.5 px-2 font-semibold text-center">Prev. Received</th>
                    <th className="py-2.5 px-2 font-semibold text-center">Outstanding</th>
                    <th className="py-2.5 px-3 font-semibold w-28 text-right">Qty Received Today *</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-darkbg-border">
                  {(poToReceive.items || []).map(item => {
                    const outstanding = Math.max(0, item.quantity_ordered - (item.quantity_received || 0));
                    return (
                      <tr key={item.id}>
                        <td className="py-2.5 px-3">
                          <p className="font-bold text-gray-900 dark:text-white">{item.product_name}</p>
                          <p className="text-[10px] font-mono text-gray-400">{item.sku}</p>
                        </td>
                        <td className="py-2.5 px-2 text-center font-semibold">{item.quantity_ordered}</td>
                        <td className="py-2.5 px-2 text-center text-green-600 font-semibold">{item.quantity_received || 0}</td>
                        <td className="py-2.5 px-2 text-center font-black text-amber-600 dark:text-amber-400">{outstanding}</td>
                        <td className="py-2.5 px-3 text-right">
                          <input
                            type="number"
                            min="0"
                            max={outstanding}
                            value={receivedQuantities[item.id] !== undefined ? receivedQuantities[item.id] : outstanding}
                            onChange={(e) => setReceivedQuantities({
                              ...receivedQuantities,
                              [item.id]: parseInt(e.target.value) || 0
                            })}
                            className="w-20 px-2 py-1 text-xs font-mono font-bold text-right rounded border border-gray-300 dark:border-darkbg-border bg-white dark:bg-darkbg text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-green-500"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Receiving Notes / Condition of Goods
              </label>
              <textarea
                rows="2"
                value={receivingNotes}
                onChange={(e) => setReceivingNotes(e.target.value)}
                placeholder="e.g. Delivered intact in sealed cartons; serials verified."
                className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-darkbg-border bg-gray-50 dark:bg-darkbg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-navy"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-200 dark:border-darkbg-border">
              <button
                type="button"
                onClick={() => setIsReceiveModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-gray-100 dark:bg-darkbg text-gray-700 dark:text-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingReceive}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-green-600 text-white hover:bg-green-700 flex items-center gap-1.5 shadow"
              >
                {isSubmittingReceive ? 'Updating Stock...' : 'Confirm Stock Receiving'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* MODAL 5: SUPPLIER ORDER HISTORY */}
      <Modal
        isOpen={supplierHistoryModalOpen}
        onClose={() => setSupplierHistoryModalOpen(false)}
        title={selectedSupplierForHistory ? `Purchasing History: ${selectedSupplierForHistory.name}` : 'Supplier History'}
        size="md"
      >
        <div className="space-y-3 text-xs">
          {supplierOrders.length === 0 ? (
            <div className="py-8 text-center text-gray-400">
              No historical purchase orders recorded for this supplier.
            </div>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {supplierOrders.map(po => (
                <div key={po.id} className="p-3 rounded-lg border border-gray-200 dark:border-darkbg-border flex items-center justify-between">
                  <div>
                    <span className="font-mono font-bold text-navy dark:text-greige">{po.po_number}</span>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      Ordered: {new Date(po.order_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-gray-900 dark:text-white">
                      PHP {Number(po.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                    <div className="mt-1">{getStatusBadge(po.status)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              onClick={() => setSupplierHistoryModalOpen(false)}
              className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-darkbg text-gray-700 dark:text-gray-300 font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
}

