import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  X,
  Search,
  CheckCircle2,
  Shield,
  Package,
  ShoppingCart,
  GraduationCap,
  ArrowRight,
  Info,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Lock,
  Database,
  Cpu,
  GitCompare,
  Save,
  History,
  Truck,
  Receipt,
  Users,
  BarChart3,
  Clock,
  CircleDollarSign,
  PlusCircle,
  TrendingUp,
  FileText
} from 'lucide-react';

/* ========================================================================= */
/* VISUAL UI MOCKUP & SVG DIAGRAM COMPONENT                                 */
/* Renders clean vector wireframes with leader arrows and callout labels     */
/* ========================================================================= */
function SectionDiagram({ role, sectionId }) {
  const key = `${role}_${sectionId}`;

  // Common SVG Markers for Directional Arrows
  const ArrowMarkers = () => (
    <defs>
      <marker id="arrow-cyan" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 1.5 L 7 5 L 0 8.5 z" fill="#38BDF8" />
      </marker>
      <marker id="arrow-emerald" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 1.5 L 7 5 L 0 8.5 z" fill="#34D399" />
      </marker>
      <marker id="arrow-amber" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 1.5 L 7 5 L 0 8.5 z" fill="#FBBF24" />
      </marker>
      <marker id="arrow-purple" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 1.5 L 7 5 L 0 8.5 z" fill="#C084FC" />
      </marker>
    </defs>
  );

  // Helper for diagram title bar
  const TitleBar = ({ title }) => (
    <g>
      <rect x="0" y="0" width="660" height="26" fill="#0F172A" rx="8" />
      <circle cx="16" cy="13" r="3.5" fill="#EF4444" />
      <circle cx="28" cy="13" r="3.5" fill="#F59E0B" />
      <circle cx="40" cy="13" r="3.5" fill="#10B981" />
      <text x="60" y="17" fill="#94A3B8" fontSize="10" fontWeight="600" fontFamily="sans-serif">
        TechAvenue Store Operations Portal — {title}
      </text>
    </g>
  );

  // Render specific diagram based on role + sectionId
  switch (key) {
    /* ------------------------ ADMIN DIAGRAMS ------------------------ */
    case 'admin_overview':
      return (
        <svg viewBox="0 0 660 210" className="w-full h-auto rounded-xl border border-gray-200 dark:border-darkbg-border bg-slate-900 shadow-inner select-none">
          <ArrowMarkers />
          <TitleBar title="Executive Dashboard Overview" />
          {/* Sidebar Wireframe */}
          <rect x="8" y="32" width="110" height="170" rx="6" fill="#1E293B" />
          <rect x="14" y="42" width="98" height="18" rx="4" fill="#0284C7" />
          <text x="24" y="55" fill="#FFFFFF" fontSize="9" fontWeight="700">① Dashboard</text>
          <rect x="14" y="66" width="98" height="14" rx="4" fill="#334155" />
          <rect x="14" y="86" width="98" height="14" rx="4" fill="#334155" />
          <rect x="14" y="106" width="98" height="14" rx="4" fill="#334155" />

          {/* Top KPI Cards */}
          <rect x="130" y="36" width="120" height="48" rx="6" fill="#1E293B" stroke="#334155" />
          <text x="140" y="52" fill="#94A3B8" fontSize="8" fontWeight="600">Total Revenue (PHP)</text>
          <text x="140" y="72" fill="#38BDF8" fontSize="13" fontWeight="800">₱458,920.00</text>

          <rect x="258" y="36" width="120" height="48" rx="6" fill="#1E293B" stroke="#334155" />
          <text x="268" y="52" fill="#94A3B8" fontSize="8" fontWeight="600">Stock Inventory Units</text>
          <text x="268" y="72" fill="#34D399" fontSize="13" fontWeight="800">1,248 Units</text>

          <rect x="386" y="36" width="120" height="48" rx="6" fill="#1E293B" stroke="#334155" />
          <text x="396" y="52" fill="#94A3B8" fontSize="8" fontWeight="600">Low Stock Reorders</text>
          <text x="396" y="72" fill="#F87171" fontSize="13" fontWeight="800">5 Products</text>

          <rect x="514" y="36" width="136" height="48" rx="6" fill="#1E293B" stroke="#334155" />
          <text x="524" y="52" fill="#94A3B8" fontSize="8" fontWeight="600">Active Staff Register</text>
          <text x="524" y="72" fill="#FBBF24" fontSize="13" fontWeight="800">8 Cashiers / Clerks</text>

          {/* Sales Trend Chart Wireframe */}
          <rect x="130" y="92" width="376" height="108" rx="6" fill="#1E293B" stroke="#334155" />
          <text x="142" y="108" fill="#E2E8F0" fontSize="9" fontWeight="700">Hourly &amp; Daily Sales Trend (Ground Truth vs ML Forecast)</text>
          <path d="M 144 180 L 190 155 L 240 162 L 290 135 L 340 142 L 390 120 L 440 128 L 485 105" fill="none" stroke="#10B981" strokeWidth="2.5" />
          <path d="M 144 180 L 190 165 L 240 150 L 290 145 L 340 130 L 390 135 L 440 115 L 485 110" fill="none" stroke="#38BDF8" strokeWidth="2" strokeDasharray="4 3" />

          {/* Recent Orders Wireframe */}
          <rect x="514" y="92" width="136" height="108" rx="6" fill="#1E293B" stroke="#334155" />
          <text x="524" y="108" fill="#E2E8F0" fontSize="9" fontWeight="700">Live Register</text>
          <rect x="522" y="116" width="120" height="20" rx="4" fill="#334155" />
          <text x="528" y="130" fill="#CBD5E1" fontSize="8">INV-2026-081 • ₱4,200</text>
          <rect x="522" y="142" width="120" height="20" rx="4" fill="#334155" />
          <text x="528" y="156" fill="#CBD5E1" fontSize="8">INV-2026-082 • ₱1,850</text>
          <rect x="522" y="168" width="120" height="20" rx="4" fill="#334155" />
          <text x="528" y="182" fill="#CBD5E1" fontSize="8">INV-2026-083 • ₱8,900</text>

          {/* Callout Arrow: Top Metrics */}
          <path d="M 210 24 L 210 32" stroke="#38BDF8" strokeWidth="1.5" markerEnd="url(#arrow-cyan)" />
          <rect x="155" y="12" width="110" height="16" rx="8" fill="#0284C7" />
          <text x="210" y="24" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="700">② Review Store KPIs</text>

          {/* Callout Arrow: Live Sales Plot */}
          <path d="M 330 196 L 330 188" stroke="#34D399" strokeWidth="1.5" markerEnd="url(#arrow-emerald)" />
          <rect x="275" y="194" width="110" height="15" rx="7" fill="#059669" />
          <text x="330" y="205" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="700">③ Live Trend Graph</text>
        </svg>
      );

    case 'admin_inventory':
      return (
        <svg viewBox="0 0 660 210" className="w-full h-auto rounded-xl border border-gray-200 dark:border-darkbg-border bg-slate-900 shadow-inner select-none">
          <ArrowMarkers />
          <TitleBar title="Product Catalog &amp; Inventory Management" />
          {/* Controls Bar */}
          <rect x="16" y="36" width="220" height="26" rx="6" fill="#1E293B" stroke="#334155" />
          <text x="28" y="52" fill="#94A3B8" fontSize="9">🔍 Search by SKU, brand, or name...</text>
          <rect x="520" y="36" width="124" height="26" rx="6" fill="#0284C7" />
          <text x="582" y="52" textAnchor="middle" fill="#FFFFFF" fontSize="9" fontWeight="700">+ Add Product</text>

          {/* Table Header */}
          <rect x="16" y="70" width="628" height="22" rx="4" fill="#334155" />
          <text x="26" y="85" fill="#E2E8F0" fontSize="8" fontWeight="700">SKU / ITEM NAME</text>
          <text x="200" y="85" fill="#E2E8F0" fontSize="8" fontWeight="700">CATEGORY</text>
          <text x="310" y="85" fill="#E2E8F0" fontSize="8" fontWeight="700">COST</text>
          <text x="390" y="85" fill="#E2E8F0" fontSize="8" fontWeight="700">SELLING PRICE</text>
          <text x="490" y="85" fill="#E2E8F0" fontSize="8" fontWeight="700">STOCK</text>
          <text x="580" y="85" fill="#E2E8F0" fontSize="8" fontWeight="700">ACTIONS</text>

          {/* Table Rows */}
          <rect x="16" y="96" width="628" height="24" rx="4" fill="#1E293B" stroke="#334155" />
          <text x="26" y="112" fill="#FFFFFF" fontSize="9" fontWeight="600">ASUS-ROG-STRIX-G16 (Gaming Laptop)</text>
          <text x="200" y="112" fill="#94A3B8" fontSize="8">Laptops &amp; PCs</text>
          <text x="310" y="112" fill="#94A3B8" fontSize="8">₱62,000</text>
          <text x="390" y="112" fill="#34D399" fontSize="9" fontWeight="700">₱74,990</text>
          <text x="490" y="112" fill="#FFFFFF" fontSize="9">14 Units</text>
          <rect x="575" y="100" width="36" height="16" rx="4" fill="#334155" />
          <text x="593" y="111" textAnchor="middle" fill="#38BDF8" fontSize="8">Edit</text>

          <rect x="16" y="124" width="628" height="24" rx="4" fill="#1E293B" />
          <text x="26" y="140" fill="#FFFFFF" fontSize="9" fontWeight="600">LOGI-MX-MASTER-3S (Wireless Mouse)</text>
          <text x="200" y="140" fill="#94A3B8" fontSize="8">Peripherals</text>
          <text x="310" y="140" fill="#94A3B8" fontSize="8">₱4,200</text>
          <text x="390" y="140" fill="#34D399" fontSize="9" fontWeight="700">₱5,690</text>
          <text x="490" y="140" fill="#F87171" fontSize="9" fontWeight="700">3 Units (Low)</text>
          <rect x="575" y="128" width="36" height="16" rx="4" fill="#334155" />
          <text x="593" y="139" textAnchor="middle" fill="#38BDF8" fontSize="8">Edit</text>

          <rect x="16" y="152" width="628" height="24" rx="4" fill="#1E293B" />
          <text x="26" y="168" fill="#FFFFFF" fontSize="9" fontWeight="600">SAMSUNG-990-PRO-2TB (NVMe SSD)</text>
          <text x="200" y="168" fill="#94A3B8" fontSize="8">Storage</text>
          <text x="310" y="168" fill="#94A3B8" fontSize="8">₱8,500</text>
          <text x="390" y="168" fill="#34D399" fontSize="9" fontWeight="700">₱10,800</text>
          <text x="490" y="168" fill="#FFFFFF" fontSize="9">28 Units</text>
          <rect x="575" y="156" width="36" height="16" rx="4" fill="#334155" />
          <text x="593" y="167" textAnchor="middle" fill="#38BDF8" fontSize="8">Edit</text>

          {/* Callout Arrow: Click Row to inspect Modal */}
          <path d="M 120 188 L 120 122" stroke="#38BDF8" strokeWidth="1.5" strokeDasharray="3 3" markerEnd="url(#arrow-cyan)" />
          <rect x="60" y="184" width="130" height="18" rx="9" fill="#0284C7" />
          <text x="125" y="196" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="700">① Click Any Row to Inspect Details</text>

          {/* Callout Arrow: Add Product */}
          <path d="M 580 22 L 580 34" stroke="#34D399" strokeWidth="1.5" markerEnd="url(#arrow-emerald)" />
          <rect x="525" y="10" width="110" height="16" rx="8" fill="#059669" />
          <text x="580" y="22" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="700">② Click to Add New Item</text>
        </svg>
      );

    case 'admin_sales':
      return (
        <svg viewBox="0 0 660 210" className="w-full h-auto rounded-xl border border-gray-200 dark:border-darkbg-border bg-slate-900 shadow-inner select-none">
          <ArrowMarkers />
          <TitleBar title="Store Sales Transactions &amp; Financial Ledger" />
          {/* Top Control Bar */}
          <rect x="16" y="36" width="180" height="26" rx="6" fill="#1E293B" stroke="#334155" />
          <text x="26" y="52" fill="#94A3B8" fontSize="9">Filter: All Transactions ▼</text>
          <rect x="496" y="36" width="148" height="26" rx="6" fill="#059669" />
          <text x="570" y="52" textAnchor="middle" fill="#FFFFFF" fontSize="9" fontWeight="700">📥 Export Transactions CSV</text>

          {/* Table Wireframe */}
          <rect x="16" y="70" width="628" height="22" rx="4" fill="#334155" />
          <text x="26" y="85" fill="#E2E8F0" fontSize="8" fontWeight="700">INVOICE #</text>
          <text x="140" y="85" fill="#E2E8F0" fontSize="8" fontWeight="700">DATE &amp; TIME</text>
          <text x="260" y="85" fill="#E2E8F0" fontSize="8" fontWeight="700">CUSTOMER</text>
          <text x="370" y="85" fill="#E2E8F0" fontSize="8" fontWeight="700">PAYMENT</text>
          <text x="460" y="85" fill="#E2E8F0" fontSize="8" fontWeight="700">12% VAT</text>
          <text x="540" y="85" fill="#E2E8F0" fontSize="8" fontWeight="700">TOTAL AMOUNT</text>

          <rect x="16" y="96" width="628" height="24" rx="4" fill="#1E293B" />
          <text x="26" y="112" fill="#38BDF8" fontSize="9" fontWeight="700">INV-2026-0042</text>
          <text x="140" y="112" fill="#94A3B8" fontSize="8">Today, 2:15 PM</text>
          <text x="260" y="112" fill="#FFFFFF" fontSize="8">Juan Dela Cruz</text>
          <text x="370" y="112" fill="#34D399" fontSize="8" fontWeight="700">GCash Ref: #9042</text>
          <text x="460" y="112" fill="#94A3B8" fontSize="8">₱1,200.00</text>
          <text x="540" y="112" fill="#FFFFFF" fontSize="9" fontWeight="700">₱11,200.00</text>

          <rect x="16" y="124" width="628" height="24" rx="4" fill="#1E293B" />
          <text x="26" y="140" fill="#38BDF8" fontSize="9" fontWeight="700">INV-2026-0041</text>
          <text x="140" y="140" fill="#94A3B8" fontSize="8">Today, 1:40 PM</text>
          <text x="260" y="140" fill="#FFFFFF" fontSize="8">Maria Santos</text>
          <text x="370" y="140" fill="#FBBF24" fontSize="8" fontWeight="700">Cash Tendered</text>
          <text x="460" y="140" fill="#94A3B8" fontSize="8">₱428.57</text>
          <text x="540" y="140" fill="#FFFFFF" fontSize="9" fontWeight="700">₱4,000.00</text>

          {/* Callout Arrow: Export CSV */}
          <path d="M 570 20 L 570 34" stroke="#34D399" strokeWidth="1.5" markerEnd="url(#arrow-emerald)" />
          <rect x="500" y="8" width="140" height="16" rx="8" fill="#059669" />
          <text x="570" y="19" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="700">① Download Audited CSV Ledger</text>
        </svg>
      );

    case 'admin_users':
    case 'admin_purchasing':
    case 'admin_reports':
    case 'admin_predictions':
      return (
        <svg viewBox="0 0 660 210" className="w-full h-auto rounded-xl border border-gray-200 dark:border-darkbg-border bg-slate-900 shadow-inner select-none">
          <ArrowMarkers />
          <TitleBar title="System Administration &amp; Access Controls" />
          <rect x="16" y="36" width="300" height="156" rx="6" fill="#1E293B" stroke="#334155" />
          <text x="28" y="56" fill="#FFFFFF" fontSize="11" fontWeight="700">Role &amp; Privilege Configuration</text>
          <rect x="28" y="70" width="276" height="30" rx="4" fill="#334155" />
          <text x="38" y="88" fill="#FFFFFF" fontSize="9">👤 Maria Santos • Inventory Clerk (Active)</text>
          <rect x="28" y="108" width="276" height="30" rx="4" fill="#334155" />
          <text x="38" y="126" fill="#FFFFFF" fontSize="9">👤 Carlos Reyes • Sales Cashier (Active)</text>
          <rect x="28" y="146" width="276" height="30" rx="4" fill="#334155" />
          <text x="38" y="164" fill="#FFFFFF" fontSize="9">👤 Dr. Eleanor Vance • Instructor Account</text>

          <rect x="330" y="36" width="314" height="156" rx="6" fill="#1E293B" stroke="#334155" />
          <text x="342" y="56" fill="#38BDF8" fontSize="11" fontWeight="700">Quick Access &amp; Role Management</text>
          <rect x="342" y="70" width="290" height="32" rx="6" fill="#0284C7" />
          <text x="487" y="90" textAnchor="middle" fill="#FFFFFF" fontSize="10" fontWeight="700">+ Add New Employee Account</text>
          <text x="342" y="126" fill="#94A3B8" fontSize="9" leading="14">
            Authorized roles: inventory_clerk, sales_personnel, instructor, admin.
          </text>
          <text x="342" y="146" fill="#34D399" fontSize="9">
            ✓ Role changes take effect immediately across all client terminals.
          </text>

          <path d="M 487 22 L 487 68" stroke="#38BDF8" strokeWidth="1.5" markerEnd="url(#arrow-cyan)" />
          <rect x="420" y="10" width="134" height="16" rx="8" fill="#0284C7" />
          <text x="487" y="21" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="700">① Click to Register New Staff</text>
        </svg>
      );

    /* ------------------------ INVENTORY CLERK DIAGRAMS ------------------------ */
    case 'inventory_clerk_overview':
      return (
        <svg viewBox="0 0 660 210" className="w-full h-auto rounded-xl border border-gray-200 dark:border-darkbg-border bg-slate-900 shadow-inner select-none">
          <ArrowMarkers />
          <TitleBar title="Clerk Warehouse Stock Status &amp; Reorder Alerts" />
          {/* Top Status Cards */}
          <rect x="16" y="36" width="198" height="60" rx="6" fill="#1E293B" stroke="#EF4444" strokeWidth="1.5" />
          <text x="28" y="56" fill="#F87171" fontSize="9" fontWeight="700">CRITICAL: LOW STOCK ITEMS</text>
          <text x="28" y="82" fill="#FFFFFF" fontSize="18" fontWeight="800">5 Products</text>
          <text x="140" y="82" fill="#F87171" fontSize="8">Needs PO Order</text>

          <rect x="226" y="36" width="198" height="60" rx="6" fill="#1E293B" stroke="#F59E0B" />
          <text x="238" y="56" fill="#FBBF24" fontSize="9" fontWeight="700">PENDING STOCK IN</text>
          <text x="238" y="82" fill="#FFFFFF" fontSize="18" fontWeight="800">2 Shipments</text>
          <text x="340" y="82" fill="#FBBF24" fontSize="8">In Transit</text>

          <rect x="436" y="36" width="208" height="60" rx="6" fill="#1E293B" stroke="#10B981" />
          <text x="448" y="56" fill="#34D399" fontSize="9" fontWeight="700">TOTAL UNITS IN WAREHOUSE</text>
          <text x="448" y="82" fill="#FFFFFF" fontSize="18" fontWeight="800">1,248 Units</text>

          {/* Quick Action Navigation */}
          <rect x="16" y="108" width="628" height="88" rx="6" fill="#1E293B" stroke="#334155" />
          <text x="28" y="128" fill="#FFFFFF" fontSize="10" fontWeight="700">Warehouse Quick Restock &amp; Movement Buttons</text>
          <rect x="28" y="140" width="180" height="36" rx="6" fill="#059669" />
          <text x="118" y="162" textAnchor="middle" fill="#FFFFFF" fontSize="10" fontWeight="700">📥 Stock In / Restock</text>
          <rect x="224" y="140" width="180" height="36" rx="6" fill="#DC2626" />
          <text x="314" y="162" textAnchor="middle" fill="#FFFFFF" fontSize="10" fontWeight="700">📤 Stock Out / Disburse</text>
          <rect x="420" y="140" width="210" height="36" rx="6" fill="#334155" />
          <text x="525" y="162" textAnchor="middle" fill="#FFFFFF" fontSize="10" fontWeight="700">📋 Movement History</text>

          {/* Callout Arrow */}
          <path d="M 118 196 L 118 178" stroke="#34D399" strokeWidth="1.5" markerEnd="url(#arrow-emerald)" />
          <rect x="48" y="194" width="140" height="16" rx="8" fill="#059669" />
          <text x="118" y="205" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="700">① Click to Record Incoming Delivery</text>
        </svg>
      );

    case 'inventory_clerk_stock_in':
      return (
        <svg viewBox="0 0 660 210" className="w-full h-auto rounded-xl border border-gray-200 dark:border-darkbg-border bg-slate-900 shadow-inner select-none">
          <ArrowMarkers />
          <TitleBar title="Stock In / Restocking Form" />
          <rect x="16" y="34" width="628" height="162" rx="8" fill="#1E293B" stroke="#334155" />
          <text x="30" y="54" fill="#FFFFFF" fontSize="11" fontWeight="700">Receive Incoming Delivery</text>

          {/* Form Fields */}
          <rect x="30" y="68" width="280" height="28" rx="4" fill="#0F172A" stroke="#334155" />
          <text x="40" y="85" fill="#E2E8F0" fontSize="9">Product: ASUS-ROG-STRIX-G16 ▼</text>

          <rect x="325" y="68" width="140" height="28" rx="4" fill="#0F172A" stroke="#334155" />
          <text x="335" y="85" fill="#E2E8F0" fontSize="9">Quantity Received: 10</text>

          <rect x="480" y="68" width="150" height="28" rx="4" fill="#0F172A" stroke="#334155" />
          <text x="490" y="85" fill="#E2E8F0" fontSize="9">Supplier PO #: DR-9941</text>

          <rect x="30" y="106" width="600" height="28" rx="4" fill="#0F172A" stroke="#334155" />
          <text x="40" y="123" fill="#94A3B8" fontSize="9">Notes: Delivered in good condition by Silicon Valley Distro rep.</text>

          {/* Confirm Button */}
          <rect x="460" y="148" width="170" height="34" rx="6" fill="#059669" />
          <text x="545" y="169" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="800">Confirm Stock In</text>

          {/* Callouts */}
          <path d="M 170 48 L 170 66" stroke="#38BDF8" strokeWidth="1.5" markerEnd="url(#arrow-cyan)" />
          <rect x="100" y="18" width="140" height="16" rx="8" fill="#0284C7" />
          <text x="170" y="29" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="700">① Select Item &amp; Quantity</text>

          <path d="M 545 130 L 545 146" stroke="#34D399" strokeWidth="1.5" markerEnd="url(#arrow-emerald)" />
          <rect x="475" y="114" width="140" height="16" rx="8" fill="#059669" />
          <text x="545" y="125" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="700">② Click to Add into Stock</text>
        </svg>
      );

    case 'inventory_clerk_stock_out':
    case 'inventory_clerk_inventory':
    case 'inventory_clerk_movements':
    case 'inventory_clerk_suppliers':
      return (
        <svg viewBox="0 0 660 210" className="w-full h-auto rounded-xl border border-gray-200 dark:border-darkbg-border bg-slate-900 shadow-inner select-none">
          <ArrowMarkers />
          <TitleBar title="Warehouse Stock Out &amp; Movement Audit Logs" />
          <rect x="16" y="34" width="628" height="162" rx="8" fill="#1E293B" stroke="#334155" />
          <text x="30" y="54" fill="#FFFFFF" fontSize="11" fontWeight="700">Stock Movement History &amp; Reason Tracking</text>
          <rect x="30" y="68" width="120" height="24" rx="4" fill="#334155" />
          <text x="40" y="83" fill="#FFFFFF" fontSize="8">Filter: All Moves ▼</text>
          <rect x="160" y="68" width="180" height="24" rx="4" fill="#0F172A" stroke="#334155" />
          <text x="170" y="83" fill="#94A3B8" fontSize="8">Search by Item or SKU...</text>

          <rect x="30" y="102" width="600" height="24" rx="4" fill="#0F172A" />
          <text x="40" y="117" fill="#34D399" fontSize="8" fontWeight="700">[IN] +10 Units</text>
          <text x="130" y="117" fill="#FFFFFF" fontSize="8">ASUS-ROG-STRIX-G16 (Delivery from Supplier)</text>
          <text x="480" y="117" fill="#94A3B8" fontSize="8">Logged by: Clerk Maria</text>

          <rect x="30" y="132" width="600" height="24" rx="4" fill="#0F172A" />
          <text x="40" y="147" fill="#F87171" fontSize="8" fontWeight="700">[OUT] -2 Units</text>
          <text x="130" y="147" fill="#FFFFFF" fontSize="8">LOGI-MX-MASTER-3S (Store Display / Demo Unit)</text>
          <text x="480" y="147" fill="#94A3B8" fontSize="8">Logged by: Clerk Maria</text>

          <path d="M 80 186 L 80 158" stroke="#38BDF8" strokeWidth="1.5" markerEnd="url(#arrow-cyan)" />
          <rect x="25" y="186" width="110" height="16" rx="8" fill="#0284C7" />
          <text x="80" y="197" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="700">① Audit All Movements</text>
        </svg>
      );

    /* ------------------------ SALES PERSONNEL DIAGRAMS ------------------------ */
    case 'sales_personnel_overview':
    case 'sales_personnel_pos':
      return (
        <svg viewBox="0 0 660 210" className="w-full h-auto rounded-xl border border-gray-200 dark:border-darkbg-border bg-slate-900 shadow-inner select-none">
          <ArrowMarkers />
          <TitleBar title="Point of Sale (POS) Cashier Checkout Flow" />
          {/* Left: Product Catalog Grid */}
          <rect x="16" y="34" width="370" height="162" rx="6" fill="#1E293B" stroke="#334155" />
          <rect x="26" y="42" width="180" height="20" rx="4" fill="#0F172A" stroke="#334155" />
          <text x="34" y="55" fill="#94A3B8" fontSize="8">🔍 Scan barcode or search product...</text>
          <rect x="214" y="42" width="50" height="20" rx="4" fill="#0284C7" />
          <text x="239" y="55" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="700">All</text>
          <rect x="270" y="42" width="54" height="20" rx="4" fill="#334155" />
          <text x="297" y="55" textAnchor="middle" fill="#CBD5E1" fontSize="8">Laptops</text>

          {/* Product Items in Catalog */}
          <rect x="26" y="70" width="104" height="54" rx="4" fill="#0F172A" stroke="#334155" />
          <text x="32" y="84" fill="#FFFFFF" fontSize="8" fontWeight="700">ROG Laptop G16</text>
          <text x="32" y="98" fill="#34D399" fontSize="8" fontWeight="700">₱74,990</text>
          <text x="32" y="112" fill="#94A3B8" fontSize="7">Stock: 14 pcs</text>

          <rect x="136" y="70" width="104" height="54" rx="4" fill="#0F172A" stroke="#334155" />
          <text x="142" y="84" fill="#FFFFFF" fontSize="8" fontWeight="700">MX Master 3S</text>
          <text x="142" y="98" fill="#34D399" fontSize="8" fontWeight="700">₱5,690</text>
          <text x="142" y="112" fill="#F87171" fontSize="7">Stock: 3 pcs</text>

          <rect x="246" y="70" width="104" height="54" rx="4" fill="#0F172A" stroke="#334155" />
          <text x="252" y="84" fill="#FFFFFF" fontSize="8" fontWeight="700">990 Pro 2TB SSD</text>
          <text x="252" y="98" fill="#34D399" fontSize="8" fontWeight="700">₱10,800</text>
          <text x="252" y="112" fill="#94A3B8" fontSize="7">Stock: 28 pcs</text>

          {/* Right: Cart Summary */}
          <rect x="396" y="34" width="248" height="162" rx="6" fill="#1E293B" stroke="#334155" />
          <text x="408" y="50" fill="#FFFFFF" fontSize="9" fontWeight="700">🛒 Customer Active Cart</text>
          <rect x="406" y="58" width="228" height="24" rx="4" fill="#0F172A" />
          <text x="414" y="73" fill="#FFFFFF" fontSize="8">1x MX Master 3S</text>
          <text x="580" y="73" fill="#34D399" fontSize="8" fontWeight="700">₱5,690</text>

          <text x="408" y="100" fill="#94A3B8" fontSize="8">Payment Mode: [Cash] [Card] [GCash]</text>
          <rect x="406" y="108" width="130" height="22" rx="4" fill="#0F172A" stroke="#334155" />
          <text x="414" y="122" fill="#FFFFFF" fontSize="8">Tendered: ₱6,000</text>
          <text x="544" y="122" fill="#FBBF24" fontSize="8" fontWeight="700">Change: ₱310</text>

          <rect x="406" y="138" width="228" height="32" rx="6" fill="#059669" />
          <text x="520" y="158" textAnchor="middle" fill="#FFFFFF" fontSize="10" fontWeight="800">Complete Checkout (Enter)</text>

          {/* Callouts */}
          <path d="M 80 18 L 80 66" stroke="#38BDF8" strokeWidth="1.5" markerEnd="url(#arrow-cyan)" />
          <rect x="25" y="6" width="110" height="16" rx="8" fill="#0284C7" />
          <text x="80" y="17" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="700">① Click to Add to Cart</text>

          <path d="M 520 186 L 520 172" stroke="#34D399" strokeWidth="1.5" markerEnd="url(#arrow-emerald)" />
          <rect x="460" y="186" width="120" height="16" rx="8" fill="#059669" />
          <text x="520" y="197" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="700">② Confirm &amp; Print Receipt</text>
        </svg>
      );

    case 'sales_personnel_product_lookup':
    case 'sales_personnel_sales_history':
    case 'sales_personnel_shift_summary':
      return (
        <svg viewBox="0 0 660 210" className="w-full h-auto rounded-xl border border-gray-200 dark:border-darkbg-border bg-slate-900 shadow-inner select-none">
          <ArrowMarkers />
          <TitleBar title="Product &amp; Price Lookup / Receipts History" />
          <rect x="16" y="34" width="628" height="162" rx="8" fill="#1E293B" stroke="#334155" />
          <rect x="30" y="46" width="280" height="24" rx="4" fill="#0F172A" stroke="#334155" />
          <text x="40" y="61" fill="#94A3B8" fontSize="8">🔍 Search product name, SKU or invoice #...</text>

          <rect x="30" y="80" width="600" height="28" rx="4" fill="#0F172A" />
          <text x="42" y="97" fill="#FFFFFF" fontSize="9" fontWeight="700">INV-2026-0042 • Walk-in Customer</text>
          <text x="320" y="97" fill="#34D399" fontSize="9" fontWeight="700">₱11,200.00 (Paid via GCash)</text>
          <rect x="520" y="84" width="96" height="20" rx="4" fill="#0284C7" />
          <text x="568" y="97" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="700">🖨️ Print Receipt</text>

          <rect x="30" y="116" width="600" height="28" rx="4" fill="#0F172A" />
          <text x="42" y="133" fill="#FFFFFF" fontSize="9" fontWeight="700">INV-2026-0041 • Walk-in Customer</text>
          <text x="320" y="133" fill="#FBBF24" fontSize="9" fontWeight="700">₱4,000.00 (Cash)</text>
          <rect x="520" y="120" width="96" height="20" rx="4" fill="#0284C7" />
          <text x="568" y="133" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="700">🖨️ Print Receipt</text>

          <path d="M 568 68 L 568 82" stroke="#38BDF8" strokeWidth="1.5" markerEnd="url(#arrow-cyan)" />
          <rect x="508" y="52" width="120" height="16" rx="8" fill="#0284C7" />
          <text x="568" y="63" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="700">① Reprint Past Receipts</text>
        </svg>
      );

    /* ------------------------ INSTRUCTOR DIAGRAMS ------------------------ */
    case 'instructor_overview':
    case 'instructor_datasets':
      return (
        <svg viewBox="0 0 660 210" className="w-full h-auto rounded-xl border border-gray-200 dark:border-darkbg-border bg-slate-900 shadow-inner select-none">
          <ArrowMarkers />
          <TitleBar title="Dataset Explorer &amp; Inspection Suite" />
          {/* Header Controls */}
          <rect x="16" y="34" width="280" height="26" rx="6" fill="#1E293B" stroke="#334155" />
          <text x="26" y="50" fill="#FFFFFF" fontSize="9" fontWeight="600">Dataset: tech_avenue_sales_dataset.csv ▼</text>
          <rect x="524" y="34" width="120" height="26" rx="6" fill="#334155" stroke="#475569" />
          <text x="584" y="50" textAnchor="middle" fill="#FFFFFF" fontSize="9" fontWeight="700">⬇ Download CSV</text>

          {/* 4 Clean Summary Cards */}
          <rect x="16" y="68" width="148" height="42" rx="6" fill="#1E293B" stroke="#334155" />
          <text x="24" y="82" fill="#94A3B8" fontSize="8">TOTAL RECORDS</text>
          <text x="24" y="98" fill="#FFFFFF" fontSize="12" fontWeight="800">1,460 Rows</text>

          <rect x="176" y="68" width="148" height="42" rx="6" fill="#1E293B" stroke="#334155" />
          <text x="184" y="82" fill="#94A3B8" fontSize="8">INPUT FEATURES</text>
          <text x="184" y="98" fill="#FFFFFF" fontSize="12" fontWeight="800">6 <tspan fontSize="8" fill="#94A3B8">+ 1 target (7 total)</tspan></text>

          <rect x="336" y="68" width="148" height="42" rx="6" fill="#1E293B" stroke="#334155" />
          <text x="344" y="82" fill="#94A3B8" fontSize="8">TARGET VARIABLE</text>
          <text x="344" y="98" fill="#FFFFFF" fontSize="10" fontWeight="700">sales_revenue</text>

          <rect x="496" y="68" width="148" height="42" rx="6" fill="#1E293B" stroke="#334155" />
          <text x="504" y="82" fill="#94A3B8" fontSize="8">DATA QUALITY</text>
          <text x="504" y="98" fill="#FFFFFF" fontSize="10" fontWeight="700">Clean / Verified 100%</text>

          {/* Schema Table Wireframe */}
          <rect x="16" y="118" width="628" height="78" rx="6" fill="#1E293B" stroke="#334155" />
          <text x="26" y="132" fill="#E2E8F0" fontSize="8" fontWeight="700">COLUMN NAME</text>
          <text x="180" y="132" fill="#E2E8F0" fontSize="8" fontWeight="700">TYPE</text>
          <text x="320" y="132" fill="#E2E8F0" fontSize="8" fontWeight="700">UNIQUE VALUES</text>
          <text x="480" y="132" fill="#E2E8F0" fontSize="8" fontWeight="700">ROLE</text>
          <line x1="26" y1="138" x2="634" y2="138" stroke="#334155" />
          <text x="26" y="152" fill="#CBD5E1" fontSize="8">date / category / footfall / spend</text>
          <text x="180" y="152" fill="#94A3B8" fontSize="8">date / object / float64</text>
          <text x="320" y="152" fill="#94A3B8" fontSize="8">365 / 4 / 1,420</text>
          <text x="480" y="152" fill="#94A3B8" fontSize="8">Feature</text>
          <text x="26" y="170" fill="#FFFFFF" fontSize="8" fontWeight="600">sales_revenue</text>
          <text x="180" y="170" fill="#94A3B8" fontSize="8">float64</text>
          <text x="320" y="170" fill="#94A3B8" fontSize="8">1,452</text>
          <text x="480" y="170" fill="#FFFFFF" fontSize="8" fontWeight="700">Target</text>

          {/* Callouts */}
          <path d="M 140 18 L 140 32" stroke="#38BDF8" strokeWidth="1.5" markerEnd="url(#arrow-cyan)" />
          <rect x="75" y="8" width="130" height="16" rx="8" fill="#0284C7" />
          <text x="140" y="19" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="700">① Select Educational Dataset</text>

          <path d="M 584 18 L 584 32" stroke="#FBBF24" strokeWidth="1.5" markerEnd="url(#arrow-amber)" />
          <rect x="524" y="8" width="120" height="16" rx="8" fill="#D97706" />
          <text x="584" y="19" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="700">② Plain Download Button</text>
        </svg>
      );

    case 'instructor_train':
      return (
        <svg viewBox="0 0 660 210" className="w-full h-auto rounded-xl border border-gray-200 dark:border-darkbg-border bg-slate-900 shadow-inner select-none">
          <ArrowMarkers />
          <TitleBar title="Model Training &amp; Evaluation Console" />
          {/* Top Controls Box */}
          <rect x="16" y="34" width="628" height="66" rx="6" fill="#1E293B" stroke="#334155" />
          <text x="26" y="50" fill="#FFFFFF" fontSize="9" fontWeight="700">Pipeline Configuration Form</text>

          <rect x="26" y="58" width="150" height="22" rx="4" fill="#0F172A" stroke="#334155" />
          <text x="34" y="72" fill="#E2E8F0" fontSize="8">Task: Sales Revenue ▼</text>

          <rect x="184" y="58" width="150" height="22" rx="4" fill="#0F172A" stroke="#334155" />
          <text x="192" y="72" fill="#E2E8F0" fontSize="8">Algorithm: Random Forest ▼</text>

          <rect x="342" y="58" width="120" height="22" rx="4" fill="#0F172A" stroke="#334155" />
          <text x="350" y="72" fill="#E2E8F0" fontSize="8">Split: 80% Train / 20% Test</text>

          <rect x="470" y="58" width="164" height="22" rx="4" fill="#0284C7" />
          <text x="552" y="72" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="700">▶ Execute Training &amp; Eval</text>

          <rect x="510" y="36" width="124" height="18" rx="4" fill="#334155" />
          <text x="572" y="48" textAnchor="middle" fill="#FBBF24" fontSize="7" fontWeight="700">✨ 10-Fold Cross-Validation</text>

          {/* 4 Metric Cards with Distinct Highlight Colors */}
          <rect x="16" y="108" width="148" height="42" rx="6" fill="#1E293B" stroke="#334155" />
          <text x="24" y="122" fill="#94A3B8" fontSize="8">R² SCORE</text>
          <text x="24" y="140" fill="#34D399" fontSize="13" fontWeight="800">0.8924</text>

          <rect x="176" y="108" width="148" height="42" rx="6" fill="#1E293B" stroke="#334155" />
          <text x="184" y="122" fill="#94A3B8" fontSize="8">MAE (MEAN ABSOLUTE)</text>
          <text x="184" y="140" fill="#38BDF8" fontSize="13" fontWeight="800">₱1,420.50</text>

          <rect x="336" y="108" width="148" height="42" rx="6" fill="#1E293B" stroke="#334155" />
          <text x="344" y="122" fill="#94A3B8" fontSize="8">MSE (MEAN SQUARED)</text>
          <text x="344" y="140" fill="#FBBF24" fontSize="13" fontWeight="800">3,420,110</text>

          <rect x="496" y="108" width="148" height="42" rx="6" fill="#1E293B" stroke="#334155" />
          <text x="504" y="122" fill="#94A3B8" fontSize="8">RMSE (ROOT MSE)</text>
          <text x="504" y="140" fill="#C084FC" fontSize="13" fontWeight="800">₱1,849.35</text>

          {/* Actual vs Predicted Graph Wireframe */}
          <rect x="16" y="156" width="628" height="46" rx="6" fill="#1E293B" stroke="#334155" />
          <text x="26" y="170" fill="#94A3B8" fontSize="8">Actual vs. Predicted Evaluation Plot (Green = Actual, Amber = Predicted)</text>
          <path d="M 120 192 L 200 178 L 280 185 L 360 170 L 440 180 L 520 165 L 600 174" fill="none" stroke="#10B981" strokeWidth="2" />
          <path d="M 120 190 L 200 180 L 280 182 L 360 172 L 440 177 L 520 167 L 600 172" fill="none" stroke="#F59E0B" strokeWidth="2" strokeDasharray="3 3" />

          {/* Callouts */}
          <path d="M 552 20 L 552 56" stroke="#38BDF8" strokeWidth="1.5" markerEnd="url(#arrow-cyan)" />
          <rect x="480" y="8" width="144" height="16" rx="8" fill="#0284C7" />
          <text x="552" y="19" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="700">① Train Model in One Click</text>
        </svg>
      );

    case 'instructor_compare':
      return (
        <svg viewBox="0 0 660 210" className="w-full h-auto rounded-xl border border-gray-200 dark:border-darkbg-border bg-slate-900 shadow-inner select-none">
          <ArrowMarkers />
          <TitleBar title="Model Benchmark Comparison &amp; Recommendation" />
          {/* Top Benchmark Trigger */}
          <rect x="16" y="34" width="220" height="24" rx="4" fill="#0F172A" stroke="#334155" />
          <text x="24" y="49" fill="#E2E8F0" fontSize="8">Task: Daily Sales Revenue ▼</text>
          <rect x="520" y="34" width="124" height="24" rx="4" fill="#0284C7" />
          <text x="582" y="49" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="700">Run Benchmark</text>

          {/* Side-by-Side Table Wireframe */}
          <rect x="16" y="64" width="628" height="68" rx="6" fill="#1E293B" stroke="#334155" />
          <text x="26" y="78" fill="#94A3B8" fontSize="8" fontWeight="700">METRIC</text>
          <text x="160" y="78" fill="#94A3B8" fontSize="8" fontWeight="700">SIMPLE LINEAR REGRESSION</text>
          <text x="340" y="78" fill="#94A3B8" fontSize="8" fontWeight="700">RANDOM FOREST REGRESSOR</text>
          <text x="510" y="78" fill="#94A3B8" fontSize="8" fontWeight="700">VARIANCE / WINNER</text>
          <line x1="26" y1="84" x2="634" y2="84" stroke="#334155" />

          <text x="26" y="98" fill="#FFFFFF" fontSize="8">R² Determination</text>
          <text x="160" y="98" fill="#FFFFFF" fontSize="8" fontWeight="700">0.7812</text>
          <text x="340" y="98" fill="#FFFFFF" fontSize="8" fontWeight="700">0.8924</text>
          <text x="510" y="98" fill="#34D399" fontSize="8" fontWeight="700">Random Forest (+14.2%)</text>

          <text x="26" y="118" fill="#FFFFFF" fontSize="8">RMSE Error</text>
          <text x="160" y="118" fill="#FFFFFF" fontSize="8" fontWeight="700">₱2,410.50</text>
          <text x="340" y="118" fill="#FFFFFF" fontSize="8" fontWeight="700">₱1,849.35</text>
          <text x="510" y="118" fill="#34D399" fontSize="8" fontWeight="700">Random Forest (Lower RMSE)</text>

          {/* Recommendation Box Directly Below Table */}
          <rect x="16" y="138" width="628" height="64" rx="6" fill="#1E1B4B" stroke="#6366F1" strokeWidth="1.2" />
          <rect x="26" y="148" width="130" height="16" rx="4" fill="#4338CA" />
          <text x="91" y="160" textAnchor="middle" fill="#E0E7FF" fontSize="7" fontWeight="800">KEY ANALYTICAL TAKEAWAY</text>
          <text x="166" y="160" fill="#FFFFFF" fontSize="9" fontWeight="700">Algorithmic Recommendation</text>
          <text x="26" y="180" fill="#C7D2FE" fontSize="8">
            Random Forest demonstrates non-linear capture of promotional discounts, reducing RMSE by 23.3%.
          </text>
          <text x="26" y="194" fill="#A5B4FC" fontSize="8">
            Recommended for final store deployment over standard Ordinary Least Squares.
          </text>

          {/* Callouts */}
          <path d="M 570 14 L 570 32" stroke="#38BDF8" strokeWidth="1.5" markerEnd="url(#arrow-cyan)" />
          <rect x="500" y="2" width="140" height="16" rx="8" fill="#0284C7" />
          <text x="570" y="13" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="700">① Benchmark on Same Splits</text>

          <path d="M 330 130 L 330 136" stroke="#C084FC" strokeWidth="1.5" markerEnd="url(#arrow-purple)" />
          <rect x="220" y="122" width="220" height="15" rx="7" fill="#6366F1" />
          <text x="330" y="133" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="700">② Recommendation Directly Below Table</text>
        </svg>
      );

    case 'instructor_saved_models':
    case 'instructor_prediction_history':
      return (
        <svg viewBox="0 0 660 210" className="w-full h-auto rounded-xl border border-gray-200 dark:border-darkbg-border bg-slate-900 shadow-inner select-none">
          <ArrowMarkers />
          <TitleBar title="Serialized Models Registry &amp; Prediction Logs" />
          <rect x="16" y="34" width="628" height="162" rx="8" fill="#1E293B" stroke="#334155" />
          <text x="30" y="54" fill="#FFFFFF" fontSize="11" fontWeight="700">Trained Model Artifacts (.joblib)</text>
          <rect x="30" y="68" width="600" height="30" rx="4" fill="#0F172A" />
          <text x="42" y="86" fill="#38BDF8" fontSize="9" fontWeight="700">random_forest_sales_v2.joblib</text>
          <text x="280" y="86" fill="#34D399" fontSize="8" fontWeight="700">R² = 0.8924</text>
          <text x="420" y="86" fill="#94A3B8" fontSize="8">Dataset: sales_dataset.csv</text>
          <text x="560" y="86" fill="#A78BFA" fontSize="8">Saved to Disk</text>

          <rect x="30" y="106" width="600" height="30" rx="4" fill="#0F172A" />
          <text x="42" y="124" fill="#38BDF8" fontSize="9" fontWeight="700">linear_regression_demand_v1.joblib</text>
          <text x="280" y="124" fill="#34D399" fontSize="8" fontWeight="700">R² = 0.7410</text>
          <text x="420" y="124" fill="#94A3B8" fontSize="8">Dataset: demand_dataset.csv</text>
          <text x="560" y="124" fill="#A78BFA" fontSize="8">Saved to Disk</text>

          <path d="M 120 186 L 120 138" stroke="#38BDF8" strokeWidth="1.5" markerEnd="url(#arrow-cyan)" />
          <rect x="60" y="186" width="130" height="16" rx="8" fill="#0284C7" />
          <text x="125" y="197" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="700">① Production Ready Artifacts</text>
        </svg>
      );

    default:
      return null;
  }
}

/* ========================================================================= */
/* MAIN USER MANUAL MODAL COMPONENT                                          */
/* ========================================================================= */
export default function UserManualModal({
  isOpen,
  onClose,
  initialRole = 'admin',
  userRole,
  onNavigateTab
}) {
  const currentAccountRole = userRole || initialRole || 'admin';
  const isInstructor = currentAccountRole === 'instructor';

  const [selectedRole, setSelectedRole] = useState(
    isInstructor ? (initialRole || 'admin') : currentAccountRole
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSectionId, setActiveSectionId] = useState('overview');

  // Sync role if modal opens: enforce user scope unless account is instructor
  useEffect(() => {
    if (!isInstructor) {
      setSelectedRole(currentAccountRole);
    } else if (initialRole) {
      setSelectedRole(initialRole);
    }
    setActiveSectionId('overview');
  }, [initialRole, userRole, isOpen, isInstructor, currentAccountRole]);

  if (!isOpen) return null;

  /* ========================================================================= */
  /* STRUCTURED BEGINNER-FRIENDLY USER MANUAL CONTENT FOR ALL 4 ROLES          */
  /* ========================================================================= */
  const manuals = {
    admin: {
      roleTitle: 'Administrator Guide',
      roleBadge: 'System Administration & Full Audit Control',
      icon: Shield,
      color: 'from-blue-600 to-indigo-700',
      description:
        'The Administrator account manages store operations, inventory catalogs, financial sales logs, staff credentials, authorized suppliers, and forecasting tools.',
      sections: [
        {
          id: 'overview',
          title: '1. Executive Dashboard Overview',
          summary: 'Daily sales statistics, revenue indicators, and quick action widgets.',
          navTab: 'dashboard',
          steps: [
            {
              step: '1. Check Daily Store Statistics',
              detail: 'When you log in, check the top KPI cards for Total Revenue (PHP), Total Inventory Units, Low Stock Alerts, and Active Staff members.'
            },
            {
              step: '2. Review Sales & Forecast Trends',
              detail: 'Look at the Daily Sales Trend line chart to see hourly earnings alongside projected revenue estimates for the current shift.'
            },
            {
              step: '3. Jump to Recent Transactions',
              detail: 'Scroll to the bottom of the dashboard to see the latest register invoices and critical stock items that need replenishment.'
            }
          ]
        },
        {
          id: 'inventory',
          title: '2. Product Catalog & Inventory Management',
          summary: 'Browse all products, inspect specifications, and add new catalog items.',
          navTab: 'inventory',
          steps: [
            {
              step: '1. Search for Any Product',
              detail: 'Use the search box in the inventory view to find products by SKU, brand name, or hardware category.'
            },
            {
              step: '2. Click Any Row to Inspect Details',
              detail: 'Click anywhere on a product row to open the Product Details popup, displaying photos, selling prices, and assigned supplier information.'
            },
            {
              step: '3. Add a New Product',
              detail: 'Click "+ Add Product" at the top right. Enter the SKU, Item Name, Category, Cost Price, Selling Price, and Reorder threshold, then save.'
            }
          ]
        },
        {
          id: 'sales',
          title: '3. Store Sales Transaction Audit',
          summary: 'Review real-time cashier transactions, 12% VAT calculations, and export CSV files.',
          navTab: 'sales',
          steps: [
            {
              step: '1. Audit Cashier Registers',
              detail: 'Open the Sales Transactions tab to see all completed orders, invoice numbers, customer names, payment methods, and net 12% VAT.'
            },
            {
              step: '2. Verify Payment Tender Types',
              detail: 'Confirm whether orders were paid in Cash, Credit Card, or GCash to facilitate accurate end-of-shift register reconciliation.'
            },
            {
              step: '3. Export Financial CSV Reports',
              detail: 'Click the green "Export Transactions CSV" button at the top right to download a spreadsheet for store accounting.'
            }
          ]
        },
        {
          id: 'users',
          title: '4. Staff & User Access Governance',
          summary: 'Create and manage accounts for Clerks, Sales Staff, Instructors, and Admins.',
          navTab: 'users',
          steps: [
            {
              step: '1. View Registered Staff',
              detail: 'Go to User Management to see all employee accounts and their assigned store roles.'
            },
            {
              step: '2. Register a New Employee',
              detail: 'Click "+ Add User" and enter their username, corporate email, full name, temporary password, and role (inventory_clerk, sales_personnel, instructor, or admin).'
            },
            {
              step: '3. Edit or Deactivate Accounts',
              detail: 'Click Edit on any user row to update permissions or toggle their status between active and inactive.'
            }
          ]
        },
        {
          id: 'purchasing',
          title: '5. Authorized Hardware Suppliers & Purchasing',
          summary: 'Track authorized distributors, contact representatives, and purchase orders.',
          navTab: 'purchasing',
          steps: [
            {
              step: '1. Review Verified Partners',
              detail: 'Open Suppliers & Purchasing to check verified distributors, representative contacts, email addresses, and phone numbers.'
            },
            {
              step: '2. Track Restock Orders',
              detail: 'Create purchase orders sent to suppliers to replenish warehouse stock before inventory hits critical reorder thresholds.'
            }
          ]
        },
        {
          id: 'reports',
          title: '6. Reports & Financial Analytics',
          summary: 'Generate revenue breakdown charts, date-filtered sales, and performance summaries.',
          navTab: 'reports',
          steps: [
            {
              step: '1. Filter by Date Range',
              detail: 'Use the date picker in Reports & Analytics to view earnings for today, this week, this month, or a custom date range.'
            },
            {
              step: '2. Analyze Category Performance',
              detail: 'Review the sales breakdown chart to identify which computer accessories and hardware generate the highest profit margins.'
            }
          ]
        },
        {
          id: 'predictions',
          title: '7. AI & Predictive Forecast Engine',
          summary: 'Predict customer demand, future sales revenues, and identify slow-moving items.',
          navTab: 'pred_demand',
          steps: [
            {
              step: '1. Run Product Demand Prediction',
              detail: 'Select any product in Knowledge Analysis & Prediction to compute expected monthly demand units using machine learning.'
            },
            {
              step: '2. Plan Inventory Purchases',
              detail: 'Use the forecasted demand numbers and confidence score to place accurate supplier orders and avoid stock-outs.'
            }
          ]
        }
      ]
    },

    inventory_clerk: {
      roleTitle: 'Inventory Clerk Guide',
      roleBadge: 'Warehouse Operations, Receiving & Stock Control',
      icon: Package,
      color: 'from-amber-600 to-orange-700',
      description:
        'The Inventory Clerk handles warehouse inventory: receiving supplier shipments (Stock In), recording store disbursements (Stock Out), inspecting supplier details, and addressing low-stock alerts.',
      sections: [
        {
          id: 'overview',
          title: '1. Clerk Dashboard & Stock Status',
          summary: 'Overview of warehouse inventory levels, low stock warnings, and quick restock actions.',
          navTab: 'dashboard',
          steps: [
            {
              step: '1. Check Stock Counters',
              detail: 'Review the top cards for Out of Stock and Low Stock items. Products marked in red or amber require immediate attention.'
            },
            {
              step: '2. Use Quick Restock Actions',
              detail: 'Click the green "Stock In / Restock" button to immediately jump into the receiving form with a clean workflow.'
            }
          ]
        },
        {
          id: 'inventory',
          title: '2. Inventory Catalog & Item Details',
          summary: 'Inspect stock counts, suppliers, and product photos.',
          navTab: 'inventory',
          steps: [
            {
              step: '1. Search for Warehouse Items',
              detail: 'Search by SKU or item name to check physical shelf count versus system recorded count.'
            },
            {
              step: '2. Open Product Details Modal',
              detail: 'Click any row in the inventory table to see the assigned supplier, cost price, and stock history.'
            },
            {
              step: '3. Quick Restock Shortcut',
              detail: 'Inside the Product Details popup, click the green "Restock" button to open the Stock In form with that product pre-selected.'
            }
          ]
        },
        {
          id: 'stock_in',
          title: '3. Stock In / Receiving Shipments',
          summary: 'Log new deliveries from suppliers and automatically increment stock counts.',
          navTab: 'stock_in',
          steps: [
            {
              step: '1. Open the Stock In Form',
              detail: 'Click "Stock In / Restocking" in the sidebar menu or use the dashboard quick link.'
            },
            {
              step: '2. Enter Delivery Information',
              detail: 'Select the received product from the dropdown, enter the quantity delivered, and type the supplier delivery receipt or PO number.'
            },
            {
              step: '3. Confirm Stock Arrival',
              detail: 'Click "Confirm Stock In". The system instantly increases physical inventory and records an audit log entry.'
            }
          ]
        },
        {
          id: 'stock_out',
          title: '4. Stock Out / Item Disbursements',
          summary: 'Deduct items for store displays, defective replacements, or branch transfers.',
          navTab: 'stock_out',
          steps: [
            {
              step: '1. Open Stock Out',
              detail: 'Click "Stock Out" in the sidebar whenever products leave warehouse shelves.'
            },
            {
              step: '2. Select Item and State the Reason',
              detail: 'Pick the product, specify the reason (e.g., Store Display, Defective Return, or Transfer), and enter the quantity.'
            },
            {
              step: '3. Submit Deduction',
              detail: 'Click "Confirm Stock Out". The system verifies available physical stock and deducts the units.'
            }
          ]
        },
        {
          id: 'movements',
          title: '5. Movement History & Audit Log',
          summary: 'Filter and inspect past shipments, adjustments, and receipts.',
          navTab: 'movements',
          steps: [
            {
              step: '1. Open Movement History',
              detail: 'Navigate to "Stock Movement History" to see the complete log of all inbound and outbound transactions.'
            },
            {
              step: '2. Filter Audit Records',
              detail: 'Filter by movement type (IN vs OUT) or search by SKU to track down any inventory count discrepancies.'
            }
          ]
        },
        {
          id: 'suppliers',
          title: '6. Authorized Suppliers Reference',
          summary: 'Browse registered hardware distributors, lead times, and contact details.',
          navTab: 'suppliers',
          steps: [
            {
              step: '1. Open the Supplier Directory',
              detail: 'Click "Suppliers" in the sidebar to review verified distributors for laptops, peripherals, and components.'
            },
            {
              step: '2. Check Contact Information',
              detail: 'Find contact phone numbers, support emails, and average delivery turnaround days when restocking.'
            }
          ]
        }
      ]
    },

    sales_personnel: {
      roleTitle: 'Sales Personnel Guide',
      roleBadge: 'POS Terminal, Customer Checkout, Price Lookup & Receipts',
      icon: ShoppingCart,
      color: 'from-emerald-600 to-teal-700',
      description:
        'The Sales Personnel account operates the Point of Sale (POS) terminal, scans items, issues official transaction receipts, performs product lookups, and assists walk-in customers.',
      sections: [
        {
          id: 'overview',
          title: '1. Sales Operations Dashboard',
          summary: 'Check daily sales totals, items sold, and register readiness.',
          navTab: 'dashboard',
          steps: [
            {
              step: '1. Review Daily Registers',
              detail: 'Check the top cards for Sales Today, Completed Transactions, and Items Sold.'
            },
            {
              step: '2. Check Low-Stock Cashier Alerts',
              detail: 'Read the low-stock notification bar at the top to know which items have limited inventory before offering them to shoppers.'
            },
            {
              step: '3. Open the POS Terminal',
              detail: 'Click the green "Open Point of Sale & Drafts" button to begin ringing up customer purchases.'
            }
          ]
        },
        {
          id: 'pos',
          title: '2. Point of Sale (POS) Checkout Flow',
          summary: 'Add products to cart, enter payment tenders, and print receipts.',
          navTab: 'pos',
          steps: [
            {
              step: '1. Add Products to Cart',
              detail: 'Browse items by category or type into the search bar. Click any product card to add it to the active cart on the right.'
            },
            {
              step: '2. Adjust Item Quantities',
              detail: 'Use the (+) and (-) buttons in the cart to set quantities, or click the trash icon to remove an item.'
            },
            {
              step: '3. Choose Payment Method & Enter Tender',
              detail: 'Select Cash, Card, or GCash. For cash, type the Amount Tendered in the input box to let the system compute the exact change.'
            },
            {
              step: '4. Complete the Sale',
              detail: 'Click "Complete Checkout". The sale is saved, warehouse stock is deducted in real time, and the printable receipt pops up.'
            }
          ]
        },
        {
          id: 'product_lookup',
          title: '3. Customer Product & Price Lookup',
          summary: 'Quickly check prices, stock availability, and specs for walk-in shoppers.',
          navTab: 'product_lookup',
          steps: [
            {
              step: '1. Search by SKU or Name',
              detail: 'Click "Product Lookup" in the sidebar and type a brand, product name, or barcode into the search field.'
            },
            {
              step: '2. Inspect Stock & Specifications',
              detail: 'Click on any product card in the search results to open full specifications, compatible accessories, and warranty terms.'
            }
          ]
        },
        {
          id: 'sales_history',
          title: '4. Sales History & Reprinting Receipts',
          summary: 'Look up past customer invoices and reprint official transaction receipts.',
          navTab: 'sales_history',
          steps: [
            {
              step: '1. Search Past Orders',
              detail: 'Open "Sales History & Receipts" and search by Invoice Number or customer name.'
            },
            {
              step: '2. Print or View Receipt',
              detail: 'Click the eye icon to review the purchased line items or click "Print Receipt" to generate a thermal paper receipt.'
            }
          ]
        }
      ]
    },

    instructor: {
      roleTitle: 'Instructor Guide',
      roleBadge: 'Machine Learning Education, Model Training & Benchmarking',
      icon: GraduationCap,
      color: 'from-purple-600 to-pink-700',
      description:
        'The Instructor account is dedicated to academic instruction, dataset exploration, training machine learning models (Linear Regression vs. Random Forest), and empirical benchmarking.',
      sections: [
        {
          id: 'overview',
          title: '1. Instructor ML Dashboard Overview',
          summary: 'Machine learning system status, curriculum modules, and quick navigation.',
          navTab: 'dashboard',
          steps: [
            {
              step: '1. Review Console Readiness',
              detail: 'Check the overview cards for loaded datasets, active models, and recent training accuracy.'
            },
            {
              step: '2. Use Quick Navigation Tabs',
              detail: 'Click any of the quick action buttons to jump straight into Dataset Explorer, Model Training, or Model Comparison.'
            }
          ]
        },
        {
          id: 'datasets',
          title: '2. Dataset Explorer & Inspection Suite',
          summary: 'Inspect retail transactions, feature columns, summary counts, and download CSVs.',
          navTab: 'datasets',
          steps: [
            {
              step: '1. Select a Dataset',
              detail: 'Pick a dataset from the top dropdown (e.g., Daily Sales Revenue or Product Demand Units).'
            },
            {
              step: '2. Inspect Feature Counts & Schema',
              detail: 'Review the 4 summary cards (e.g. 6 input features + 1 target variable) and inspect column data types in the clean schema table.'
            },
            {
              step: '3. Download Raw CSV',
              detail: 'Click the plain "Download CSV" button at the top right to save the dataset for external analysis in Python, Jupyter, or Excel.'
            }
          ]
        },
        {
          id: 'train',
          title: '3. Model Training & Evaluation Console',
          summary: 'Configure parameters, execute pipelines, inspect error metrics, and launch 10-Fold CV.',
          navTab: 'train',
          steps: [
            {
              step: '1. Configure Model Pipeline',
              detail: 'Select the target task dataset, choose between Simple Linear Regression and Random Forest, and set the test split ratio (e.g., 20% test, 80% train).'
            },
            {
              step: '2. Execute Training & View Live Metrics',
              detail: 'Click "Execute Model Training & Evaluation". The system trains the pipeline, saves the model, and displays distinct colored metric cards for R², MAE, MSE, and RMSE.'
            },
            {
              step: '3. Inspect Actual vs. Predicted Curve',
              detail: 'Scroll down to review the line plot comparing actual ground truth values (green line) against model predictions (amber line).'
            },
            {
              step: '4. Open 10-Fold Cross-Validation',
              detail: 'Click the "10-Fold Cross-Validation" button in the console header to open the pop-up modal and verify model generalization across 10 rotating folds.'
            }
          ]
        },
        {
          id: 'compare',
          title: '4. Model Comparison & Benchmark',
          summary: 'Benchmark Linear Regression against Random Forest on identical splits with algorithmic recommendations.',
          navTab: 'compare',
          steps: [
            {
              step: '1. Select Benchmark Task',
              detail: 'Choose the task dataset from the dropdown and click "Run Benchmark" to execute side-by-side training.'
            },
            {
              step: '2. Inspect Uniform Metric Columns',
              detail: 'Review the clean, neutral comparison table showing Simple Linear Regression versus Random Forest error metrics.'
            },
            {
              step: '3. Check Variance & Winner',
              detail: 'Examine the Variance / Winner column to see which algorithm achieved lower error and higher explanatory power.'
            },
            {
              step: '4. Read the Algorithmic Recommendation',
              detail: 'Read the prominent callout box placed directly below the comparison table for actionable takeaways and model trade-offs.'
            }
          ]
        },
        {
          id: 'saved_models',
          title: '5. Serialized Model Registry (.joblib)',
          summary: 'Browse and inspect serialized machine learning models saved directly to disk.',
          navTab: 'saved_models',
          steps: [
            {
              step: '1. View Saved Model Artifacts',
              detail: 'Open "Saved Models" in the navigation menu to see all trained model files stored as .joblib pipelines.'
            },
            {
              step: '2. Check Model Metadata',
              detail: 'Review the training timestamp, algorithm architecture, and recorded R² evaluation score for each saved artifact.'
            }
          ]
        },
        {
          id: 'prediction_history',
          title: '6. Prediction History & Audit Logs',
          summary: 'Review past prediction records and forecasted numbers generated by the system.',
          navTab: 'prediction_history',
          steps: [
            {
              step: '1. Open Prediction Logs',
              detail: 'Click "Prediction History" in the sidebar to review past automated inferences and inputs submitted by students or users.'
            }
          ]
        }
      ]
    }
  };

  const currentManual = manuals[selectedRole] || manuals.admin;
  const RoleIcon = currentManual.icon;

  // Filter sections by search query
  const filteredSections = currentManual.sections.filter(
    (sec) =>
      sec.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sec.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sec.steps.some(
        (s) =>
          s.step.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.detail.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-5 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-5xl h-[92vh] max-h-[880px] bg-white dark:bg-darkbg-card rounded-2xl shadow-2xl border border-gray-200 dark:border-darkbg-border flex flex-col overflow-hidden">
        {/* ========================================================================= */}
        {/* MODAL HEADER                                                              */}
        {/* ========================================================================= */}
        <div className="px-5 py-3.5 border-b border-gray-100 dark:border-darkbg-border flex items-center justify-between shrink-0 bg-gray-50/90 dark:bg-darkbg/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-navy dark:bg-blue-600 text-white flex items-center justify-center shadow-sm">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                  TechAvenue Interactive User Manual
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-navy/10 text-navy dark:bg-blue-900/40 dark:text-blue-300 border border-navy/20 dark:border-blue-700/40">
                  v2.2 Help
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Beginner-friendly step-by-step guides and interactive feature navigation
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-darkbg-hover transition-colors cursor-pointer"
            title="Close Manual (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ========================================================================= */}
        {/* SEARCH BAR & DOCUMENTATION HEADER                                         */}
        {/* ========================================================================= */}
        <div className="px-5 py-2.5 border-b border-gray-100 dark:border-darkbg-border bg-white dark:bg-darkbg-card flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-stone-400">
            <RoleIcon className="w-4 h-4 shrink-0" style={{ color: 'var(--accent-primary)' }} />
            <span>{currentManual.roleTitle} &bull; {currentManual.sections.length} Topics</span>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search instructions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-gray-200 dark:border-darkbg-border bg-gray-50 dark:bg-darkbg text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-navy dark:focus:ring-blue-500"
            />
          </div>
        </div>

        {/* ========================================================================= */}
        {/* BODY: SPLIT VIEW (TOPICS LIST ON LEFT, VISUAL GUIDE ON RIGHT)              */}
        {/* ========================================================================= */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
          {/* Left Navigation: Topics for Current Role */}
          <div className="w-full md:w-64 border-r border-gray-100 dark:border-darkbg-border bg-gray-50/50 dark:bg-darkbg/40 p-3.5 overflow-y-auto shrink-0 space-y-2">
            {/* Role Header Card */}
            <div className={`p-3 rounded-xl bg-gradient-to-br ${currentManual.color} text-white shadow-sm space-y-1 mb-2`}>
              <div className="flex items-center gap-2">
                <RoleIcon className="w-4 h-4" />
                <h4 className="font-bold text-xs uppercase tracking-wider">{currentManual.roleTitle}</h4>
              </div>
              <p className="text-[10px] text-white/80 line-clamp-2 leading-relaxed">
                {currentManual.roleBadge}
              </p>
            </div>

            <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400 px-1 pt-1">
              Table of Contents ({filteredSections.length})
            </p>

            <div className="space-y-1">
              {filteredSections.map((sec) => {
                const isActive = activeSectionId === sec.id;
                return (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => setActiveSectionId(sec.id)}
                    className={`w-full text-left p-2.5 rounded-xl text-xs font-medium transition-all flex items-start justify-between gap-2 cursor-pointer ${isActive
                        ? 'bg-white dark:bg-[#1C1917] shadow-xs border border-gray-200 dark:border-[#292524] font-bold'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#292524]'
                      }`}
                    style={isActive ? { color: 'var(--accent-light)', borderColor: 'var(--accent-border)' } : {}}
                  >
                    <span className="truncate">{sec.title}</span>
                    <ChevronRight className="w-3.5 h-3.5 shrink-0 mt-0.5" style={isActive ? { color: 'var(--accent-light)' } : { color: '#78716C' }} />
                  </button>
                );
              })}

              {filteredSections.length === 0 && (
                <div className="p-4 text-center text-xs text-gray-400">
                  No topics matching "{searchQuery}".
                </div>
              )}
            </div>
          </div>

          {/* Right Area: Actionable Workflows & Visual Diagrams */}
          <div className="flex-1 p-5 sm:p-6 overflow-y-auto space-y-5">
            {/* Role Introduction Banner */}
            <div className="p-3.5 rounded-xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/40 dark:bg-blue-950/20 text-xs text-gray-700 dark:text-gray-300 flex items-start gap-3">
              <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-gray-900 dark:text-white mb-0.5">Role Summary &amp; Scope</p>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-[11px]">{currentManual.description}</p>
              </div>
            </div>

            {/* Render Selected Section Content */}
            {(() => {
              const activeSec =
                filteredSections.find((s) => s.id === activeSectionId) ||
                filteredSections[0] ||
                currentManual.sections[0];

              if (!activeSec) return null;

              return (
                <div className="space-y-5">
                  {/* Section Header */}
                  <div className="pb-3 border-b border-gray-100 dark:border-darkbg-border">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                      {activeSec.title}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {activeSec.summary}
                    </p>
                  </div>

                  {/* Visual Guide / SVG Diagram */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-gray-500 font-semibold px-1">
                      <span>Visual Interface Guide &amp; Click Callouts</span>
                      <span className="text-[10px] text-blue-600 dark:text-blue-400 font-normal">Follow numbered arrows ① ②</span>
                    </div>
                    <SectionDiagram role={selectedRole} sectionId={activeSec.id} />
                  </div>

                  {/* Step-by-Step Instructions (Clean Typography, Minimal Highlighting) */}
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider px-1">
                      Step-by-Step Instructions
                    </h4>
                    <div className="space-y-2">
                      {activeSec.steps.map((s, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-xl border border-gray-100 dark:border-darkbg-border bg-gray-50/60 dark:bg-darkbg/40 space-y-1 transition-all hover:border-gray-200 dark:hover:border-darkbg-hover"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-[11px] shrink-0 border border-blue-200 dark:border-blue-800">
                              {idx + 1}
                            </span>
                            <h5 className="font-semibold text-xs text-gray-900 dark:text-white">
                              {s.step}
                            </h5>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-300 pl-7 leading-relaxed">
                            {s.detail}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Best Practice Callout */}
                  <div className="p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/20 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      <strong>Role Guide Tip:</strong> Refer to the visual interface guide and numbered steps above to carry out operations accurately within your authorized role scope.
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* FOOTER                                                                    */}
        {/* ========================================================================= */}
        <div className="px-5 py-2.5 border-t border-gray-100 dark:border-darkbg-border bg-gray-50/80 dark:bg-darkbg/60 flex items-center justify-between shrink-0 text-xs">
          <div className="text-gray-400 flex items-center gap-2">
            <BookOpen className="w-3.5 h-3.5" />
            <span className="text-[11px]">TechAvenue Store Operations Management System Documentation</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-gray-200 dark:bg-darkbg hover:bg-gray-300 dark:hover:bg-darkbg-hover text-gray-800 dark:text-gray-200 font-semibold transition-colors cursor-pointer text-xs"
          >
            Close Manual
          </button>
        </div>
      </div>
    </div>
  );
}
