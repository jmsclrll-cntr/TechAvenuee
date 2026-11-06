import React, { useState } from 'react';
import {
  BookOpen,
  X,
  Search,
  CheckCircle2,
  Shield,
  Package,
  ShoppingCart,
  GraduationCap,
  Layers,
  Sparkles,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  ArrowRight,
  Info,
  Sliders,
  Database,
  BarChart2,
  Truck,
  RotateCcw,
  Zap,
  FileText
} from 'lucide-react';

export default function UserManualModal({
  isOpen,
  onClose,
  initialRole = 'admin',
  onNavigateTab
}) {
  const [selectedRole, setSelectedRole] = useState(initialRole || 'admin');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSectionId, setActiveSectionId] = useState('overview');

  // Sync role if modal opens
  React.useEffect(() => {
    if (initialRole) {
      setSelectedRole(initialRole);
    }
  }, [initialRole, isOpen]);

  if (!isOpen) return null;

  // Complete User Manual Data for all roles
  const manuals = {
    admin: {
      roleTitle: 'Administrator Guide',
      roleBadge: 'System Administration & Full Audit Control',
      icon: Shield,
      color: 'from-blue-600 to-indigo-700',
      description:
        'The Administrator account exercises complete governance over store inventory, financial logs, user accounts, authorized hardware suppliers, predictive analytics, and system configurations.',
      sections: [
        {
          id: 'overview',
          title: '1. Executive Dashboard Overview',
          summary: 'Daily KPIs, real-time revenue indicators, and quick action audit widgets.',
          steps: [
            {
              step: '1.1 Monitor Key Metrics',
              detail:
                'Upon logging in, review the top metric cards displaying Total Inventory, Total Revenue (PHP), Low Stock Alerts, Active Staff, and ML Projected Sales Growth.'
            },
            {
              step: '1.2 Inspect Visual Sales & Inventory Analytics',
              detail:
                'Review the "Daily & Monthly Sales Trend vs Projected (PHP)" graph with smooth forecast lines, the Donut Chart for Stock Status distribution, and the Category Breakdown charts.'
            },
            {
              step: '1.3 Quick Ledger & Restock Triggers',
              detail:
                'Directly observe recent sales transactions and critical low-stock items from the dashboard bottom widgets. Click "View All" on any widget to jump straight into detailed views.'
            }
          ],
          navTab: 'dashboard'
        },
        {
          id: 'inventory',
          title: '2. Product Catalog & Inventory Management',
          summary: 'Browse all SKUs, inspect product photos, suppliers, and manage catalog items.',
          steps: [
            {
              step: '2.1 Interactive Product Lookup',
              detail:
                'Click on any product row in the table to trigger the comprehensive Product Detail Modal showing high-fidelity product imagery, selling prices, valuation, and verified hardware supplier details.'
            },
            {
              step: '2.2 Add New Catalog Product',
              detail:
                'Click "+ Add Product" at the top right of the inventory tab. Provide the SKU, Item Name, Category, Brand, Cost Price, Selling Price, and Reorder threshold.'
            },
            {
              step: '2.3 Edit Existing Products',
              detail:
                'Click the Edit pencil icon on any item row or within the Product Detail Modal to revise product specifications, reorder levels, or cost structures.'
            }
          ],
          navTab: 'inventory'
        },
        {
          id: 'sales',
          title: '3. Store Sales Transaction Audit',
          summary: 'Review real-time cashier registers, 12% VAT calculations, and export CSV archives.',
          steps: [
            {
              step: '3.1 Audit Register Transactions',
              detail:
                'Navigate to the "Sales Transactions" tab to inspect all generated receipts. Check the Invoice #, Customer Name, Cashier Station, Subtotal, 12% VAT, and Final Gross Total.'
            },
            {
              step: '3.2 Verify Payment Tender',
              detail:
                'Verify payment breakdown by Cash, Card, or GCash to facilitate end-of-shift cashier balance reconciliation.'
            },
            {
              step: '3.3 Export Financial CSV Reports',
              detail:
                'Click the green "Export Transactions CSV" button at the top right to download a dated audit report spreadsheet ready for external accounting.'
            }
          ],
          navTab: 'sales'
        },
        {
          id: 'users',
          title: '4. Staff & User Access Governance',
          summary: 'Manage accounts for Clerks, Sales Personnel, Instructors, and fellow Admins.',
          steps: [
            {
              step: '4.1 Register New Employee Account',
              detail:
                'Navigate to "User Management". Click "+ Add User" and assign a Username, Email, Full Name, Password, and Role (inventory_clerk, sales_personnel, instructor, or admin).'
            },
            {
              step: '4.2 Edit or Deactivate User',
              detail:
                'Click Edit on any user row to update credentials, change roles, or toggle active/inactive status when staff shifts or responsibilities change.'
            }
          ],
          navTab: 'users'
        },
        {
          id: 'purchasing',
          title: '5. Authorized Hardware Suppliers & Purchasing',
          summary: 'Track authorized distributors, contact persons, lead times, and purchase orders.',
          steps: [
            {
              step: '5.1 Register Authorized Suppliers',
              detail:
                'Navigate to "Suppliers & Purchasing" to view verified partners (e.g., TechSource Philippines, Silicon Valley Distro, MicroLink Corp). Add contact reps, official emails, and phone numbers.'
            },
            {
              step: '5.2 Purchase Orders & Restock Tracking',
              detail:
                'Create and monitor purchase orders sent to suppliers to replenish depleting warehouse stock.'
            }
          ],
          navTab: 'purchasing'
        },
        {
          id: 'predictions',
          title: '6. AI & Machine Learning Forecast Engine',
          summary: 'Predict demand, future sales revenues, identify slow-moving items and best-sellers.',
          steps: [
            {
              step: '6.1 Product Demand Prediction',
              detail:
                'Select any SKU to run Machine Learning demand regression. View forecasted units, recommended restock quantities, and algorithmic confidence.'
            },
            {
              step: '6.2 Future Sales Revenue Forecast',
              detail:
                'Run multi-month forward projections to plan capital expenditure, expected inventory turnover, and cash flow requirements.'
            },
            {
              step: '6.3 Slow-Moving & Best-Selling Analytics',
              detail:
                'Filter products with stagnant inventory turns to plan promotions, and monitor high-velocity items to prevent stock-outs.'
            }
          ],
          navTab: 'pred_demand'
        }
      ]
    },

    inventory_clerk: {
      roleTitle: 'Inventory Clerk Guide',
      roleBadge: 'Warehouse Operations, Receiving & Stock Control',
      icon: Package,
      color: 'from-amber-600 to-orange-700',
      description:
        'The Inventory Clerk handles daily warehouse logistics: logging incoming shipments (Stock In), fulfilling sales or repair disbursements (Stock Out), inspecting supplier information, and addressing low-stock warnings.',
      sections: [
        {
          id: 'overview',
          title: '1. Clerk Dashboard & Stock Status',
          summary: 'Instant view of warehouse stock levels, critical items, and shipment logs.',
          steps: [
            {
              step: '1.1 Monitor Reorder Warnings',
              detail:
                'Check the top KPI cards for Out of Stock and Low Stock counters. Items highlighted in red or amber require immediate procurement action.'
            },
            {
              step: '1.2 Inspect Registered Hardware Suppliers',
              detail:
                'Refer to the Hardware Suppliers Reference table directly on the inventory view to contact authorized distributors for quotes and lead times.'
            }
          ],
          navTab: 'dashboard'
        },
        {
          id: 'inventory',
          title: '2. Product Inventory & Modal Detail Inspection',
          summary: 'Interactive catalog review with supplier and image details.',
          steps: [
            {
              step: '2.1 Click-to-Inspect Any Product Row',
              detail:
                'Click any item row in the inventory table to open the Product Detail Modal. It displays the SKU, brand, stock count, valuation, and the supplier assigned to that hardware category.'
            },
            {
              step: '2.2 Quick Restock Shortcut',
              detail:
                'Inside the Product Detail Modal, click the green "Restock" button at the bottom right to quickly jump into Stock In with the item pre-selected.'
            }
          ],
          navTab: 'inventory'
        },
        {
          id: 'stock_in',
          title: '3. Stock In / Restocking Process',
          summary: 'How to receive new inventory from suppliers and record incoming batches.',
          steps: [
            {
              step: '3.1 Navigate to Stock In',
              detail:
                'Click "Stock In / Restocking" on the navigation sidebar or use the quick action buttons.'
            },
            {
              step: '3.2 Select Product & Batch Info',
              detail:
                'Select the product being received from the dropdown, enter the quantity delivered, the batch or PO reference number, and supplier name.'
            },
            {
              step: '3.3 Submit & Auto-Update Inventory',
              detail:
                'Click "Confirm Stock In". The system immediately increases warehouse quantity, registers an audit log, and notifies all connected dashboards.'
            }
          ],
          navTab: 'stock_in'
        },
        {
          id: 'stock_out',
          title: '4. Stock Out & Defective Item Logging',
          summary: 'Disburse inventory for store transfers, service repairs, or defect write-offs.',
          steps: [
            {
              step: '4.1 Initiate Stock Out Form',
              detail:
                'Select "Stock Out" in the sidebar. Choose the product to deduct and state the reason (e.g., Showroom Display, Defective Return, Store Transfer).'
            },
            {
              step: '4.2 Validate Availability',
              detail:
                'The system verifies that deduction does not exceed current physical stock. Confirm to update real-time availability.'
            }
          ],
          navTab: 'stock_out'
        },
        {
          id: 'movements',
          title: '5. Movement History & Audit Trails',
          summary: 'Filter and inspect past shipments, adjustments, and receipts.',
          steps: [
            {
              step: '5.1 Filter Audit Logs',
              detail:
                'Go to "Stock Movement History". Filter by date range, movement type (IN vs OUT), or search by SKU to track discrepancies.'
            }
          ],
          navTab: 'movements'
        }
      ]
    },

    sales_personnel: {
      roleTitle: 'Sales Personnel Guide',
      roleBadge: 'POS Terminal, Checkout, Customer Lookup & Shift Reconciliation',
      icon: ShoppingCart,
      color: 'from-emerald-600 to-teal-700',
      description:
        'The Sales Personnel account runs the Point of Sale (POS) terminal, issues official receipts, performs customer price lookups, and balances the cashier register drawer at shift close.',
      sections: [
        {
          id: 'pos',
          title: '1. Point of Sale (POS) Checkout Flow',
          summary: 'Adding products to cart, computing discounts, taxes, and tenders.',
          steps: [
            {
              step: '1.1 Build Customer Cart',
              detail:
                'Go to "Market / Point of Sale". Browse products by category or use the barcode/SKU search input. Click on items to add them to the active cart.'
            },
            {
              step: '1.2 Adjust Quantities',
              detail:
                'Use the (+) and (-) controls on each cart line item to update quantity, or trash icon to remove an item. Out-of-stock items are prevented from addition.'
            },
            {
              step: '1.3 Enter Customer & Tender Details',
              detail:
                'Provide Customer Name (default: Walk-in Customer). Choose payment mode: Cash, Credit/Debit Card, or GCash. For cash, enter Amount Tendered to compute change automatically.'
            },
            {
              step: '1.4 Finalize & Generate Digital Receipt',
              detail:
                'Click "Complete Checkout". The system deducts stock in real-time, records the invoice, and pops up the printable receipt.'
            }
          ],
          navTab: 'pos'
        },
        {
          id: 'product_lookup',
          title: '2. Customer Product & Price Lookup',
          summary: 'Quickly check specs, real-time stock, and authorized suppliers for shoppers.',
          steps: [
            {
              step: '2.1 Search by SKU or Name',
              detail:
                'Click "Product Lookup" in the navigation. Type in a SKU, brand (e.g. Asus, Intel, Razer), or keyword.'
            },
            {
              step: '2.2 Click Item Card for Full Specifications',
              detail:
                'Click on any product card in the lookup grid to launch the Product Detail Modal. Review detailed product photos, selling prices, warranty info, and verified authorized hardware supplier contacts.'
            }
          ],
          navTab: 'product_lookup'
        },
        {
          id: 'receipts',
          title: '3. Receipts & Sales History',
          summary: 'Reprint past receipts, verify customer transactions, and check invoice status.',
          steps: [
            {
              step: '3.1 Search Invoices',
              detail:
                'In "Sales History" or "Receipts", locate past orders by Invoice number or customer name.'
            },
            {
              step: '3.2 Print or Inspect',
              detail:
                'Click the view icon to inspect the invoice breakdown and click "Print Receipt" for physical customer copies.'
            }
          ],
          navTab: 'sales_history'
        },
        {
          id: 'shift_summary',
          title: '4. Cashier Shift Management & Reconciliation',
          summary: 'Start shifts, monitor drawer collections, and reconcile at day close.',
          steps: [
            {
              step: '4.1 Starting Cash',
              detail:
                'When starting your shift, enter opening float cash (default PHP 3,000.00) in the Shift Modal.'
            },
            {
              step: '4.2 Shift Summary View',
              detail:
                'Navigate to "Shift Summary" to see real-time cash collections, GCash receipts, card totals, and transaction counts.'
            },
            {
              step: '4.3 Close & Reconcile Shift',
              detail:
                'Click "Close Shift & Reconcile" when your duty ends to lock the register ledger and submit the audit sheet to the Store Administrator.'
            }
          ],
          navTab: 'shift_summary'
        }
      ]
    },

    instructor: {
      roleTitle: 'Instructor & Data Scientist Guide',
      roleBadge: 'Curriculum, Dataset Analytics, Model Training & ML Benchmarking',
      icon: GraduationCap,
      color: 'from-purple-600 to-pink-700',
      description:
        'The Instructor account is tailored for academic demonstration, machine learning exploration, training predictive regression models (Linear Regression vs. Random Forest), and dataset inspection.',
      sections: [
        {
          id: 'datasets',
          title: '1. Dataset Explorer & Feature Inspection',
          summary: 'Inspect historical retail transactions, feature columns, and distributions.',
          steps: [
            {
              step: '1.1 Explore Historical Data Records',
              detail:
                'Navigate to "Dataset Explorer". View sales timestamps, SKU demands, promotional indices, holiday flags, and price elasticities.'
            },
            {
              step: '1.2 Adjust View Scaling',
              detail:
                'If table fonts appear small during presentations, use the "Text Size" dropdown in the top header to zoom scale between 75% and 150%.'
            }
          ],
          navTab: 'datasets'
        },
        {
          id: 'train',
          title: '2. Model Training & Hyperparameter Tuning',
          summary: 'Train Simple Linear Regression and Random Forest Regressor models.',
          steps: [
            {
              step: '2.1 Configure Training Parameters',
              detail:
                'Go to "Model Training". Select Target Metric (e.g. Demand Units, Monthly Sales Revenue) and choose training split ratio (80/20 train-test).'
            },
            {
              step: '2.2 Execute Training Pipeline',
              detail:
                'Click "Start Model Training". The system computes loss curves, training convergence, and saves the serialized weights.'
            }
          ],
          navTab: 'train'
        },
        {
          id: 'compare',
          title: '3. Model Comparison & Academic Evaluation',
          summary: 'Benchmark Mean Absolute Error (MAE), RMSE, and R² scores side-by-side.',
          steps: [
            {
              step: '3.1 Compare Algorithmic Metrics',
              detail:
                'Under "Model Comparison", examine side-by-side bar charts comparing Simple Linear Regression against Random Forest Regressors.'
            },
            {
              step: '3.2 Interpret Evaluation Scores',
              detail:
                'Evaluate R-squared (variance explained) and Mean Squared Error to teach students predictive model trade-offs in retail forecasting.'
            }
          ],
          navTab: 'compare'
        },
        {
          id: 'inventory_overview',
          title: '4. Inventory & Supplier Educational Overview',
          summary: 'Inspect product catalog and authorized hardware supply chain structure.',
          steps: [
            {
              step: '4.1 Click Any Catalog Row for Details',
              detail:
                'Click any item row in the "Inventory Overview" table to inspect the product specifications, realistic imagery, and authorized distributor metadata.'
            },
            {
              step: '4.2 Supplier Information Table',
              detail:
                'Review the Authorized Hardware Suppliers table below the inventory overview to understand supply chain logistics and fulfillment lead times.'
            }
          ],
          navTab: 'inventory_overview'
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-5xl h-[90vh] max-h-[850px] bg-white dark:bg-darkbg-card rounded-2xl shadow-2xl border border-gray-200 dark:border-darkbg-border flex flex-col overflow-hidden">
        {/* ========================================================================= */}
        {/* MODAL HEADER                                                              */}
        {/* ========================================================================= */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-darkbg-border flex items-center justify-between shrink-0 bg-gray-50/80 dark:bg-darkbg/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-navy to-blue-700 text-white flex items-center justify-center shadow-md">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-gray-900 dark:text-white">
                  TechAvenue Interactive User Manual
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-navy/10 text-navy dark:bg-blue-900/40 dark:text-blue-300 border border-navy/20 dark:border-blue-700/40">
                  v2.0 Documentation
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Complete operational guides and workflows for every system role
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-darkbg-hover transition-colors cursor-pointer"
            title="Close Manual (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ========================================================================= */}
        {/* ROLE SELECTOR TABS & SEARCH BAR                                           */}
        {/* ========================================================================= */}
        <div className="px-6 py-3 border-b border-gray-100 dark:border-darkbg-border bg-white dark:bg-darkbg-card flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
          {/* Role Pill Switcher */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-gray-100 dark:bg-darkbg border border-gray-200 dark:border-darkbg-border overflow-x-auto">
            {[
              { id: 'admin', label: 'Admin', icon: Shield },
              { id: 'inventory_clerk', label: 'Inventory Clerk', icon: Package },
              { id: 'sales_personnel', label: 'Sales Personnel', icon: ShoppingCart },
              { id: 'instructor', label: 'Instructor', icon: GraduationCap }
            ].map((r) => {
              const Icon = r.icon;
              const isSelected = selectedRole === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => {
                    setSelectedRole(r.id);
                    setActiveSectionId('overview');
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    isSelected
                      ? 'bg-navy dark:bg-blue-600 text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200/60 dark:hover:bg-darkbg-hover'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{r.label}</span>
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
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
        {/* BODY: SPLIT VIEW (SECTIONS LIST ON LEFT, DETAILED INSTRUCTIONS ON RIGHT)  */}
        {/* ========================================================================= */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
          {/* Left Navigation: Topics for Current Role */}
          <div className="w-full md:w-72 border-r border-gray-100 dark:border-darkbg-border bg-gray-50/50 dark:bg-darkbg/40 p-4 overflow-y-auto shrink-0 space-y-2">
            {/* Role Header Card */}
            <div className={`p-3.5 rounded-xl bg-gradient-to-br ${currentManual.color} text-white shadow-md space-y-1 mb-3`}>
              <div className="flex items-center gap-2">
                <RoleIcon className="w-4 h-4" />
                <h4 className="font-bold text-xs uppercase tracking-wider">{currentManual.roleTitle}</h4>
              </div>
              <p className="text-[11px] text-white/80 line-clamp-2 leading-relaxed">
                {currentManual.roleBadge}
              </p>
            </div>

            <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400 px-1">
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
                    className={`w-full text-left p-2.5 rounded-xl text-xs font-semibold transition-all flex items-start justify-between gap-2 cursor-pointer ${
                      isActive
                        ? 'bg-white dark:bg-darkbg-card text-navy dark:text-blue-400 shadow-sm border border-gray-200 dark:border-darkbg-border font-bold'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-darkbg-hover'
                    }`}
                  >
                    <span className="truncate">{sec.title}</span>
                    <ChevronRight className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${isActive ? 'text-navy dark:text-blue-400' : 'text-gray-300'}`} />
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

          {/* Right Area: Detailed Actionable Workflows */}
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            {/* Role Introduction Banner */}
            <div className="p-4 rounded-xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20 text-xs text-gray-700 dark:text-gray-300 flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-gray-900 dark:text-white mb-0.5">Role Overview & Responsibilities</p>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{currentManual.description}</p>
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
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-darkbg-border">
                    <div>
                      <h3 className="text-base sm:text-lg font-black text-gray-900 dark:text-white">
                        {activeSec.title}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {activeSec.summary}
                      </p>
                    </div>

                    {activeSec.navTab && onNavigateTab && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onNavigateTab(activeSec.navTab);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-navy dark:bg-blue-600 hover:bg-navy-light text-white text-xs font-bold shadow-sm transition-all cursor-pointer whitespace-nowrap active:scale-95"
                      >
                        <span>Open Feature Tab</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Step-by-Step Instructions */}
                  <div className="space-y-3.5">
                    {activeSec.steps.map((s, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl border border-gray-100 dark:border-darkbg-border bg-gray-50/70 dark:bg-darkbg/40 space-y-1.5 transition-all hover:border-gray-200 dark:hover:border-darkbg-hover"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-navy/10 dark:bg-blue-500/20 text-navy dark:text-blue-400 flex items-center justify-center font-bold text-[11px] shrink-0">
                            {idx + 1}
                          </span>
                          <h5 className="font-bold text-xs text-gray-900 dark:text-white">
                            {s.step}
                          </h5>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-300 pl-7 leading-relaxed">
                          {s.detail}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Help Tips Callout */}
                  <div className="p-3.5 rounded-xl border border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/20 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      <strong>Operational Best Practice:</strong> Ensure you complete all required fields and verify invoice/batch records before proceeding to the next step.
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* FOOTER: SYSTEM CONTROLS & CLOSE                                           */}
        {/* ========================================================================= */}
        <div className="px-6 py-3 border-t border-gray-100 dark:border-darkbg-border bg-gray-50/80 dark:bg-darkbg/60 flex items-center justify-between shrink-0 text-xs">
          <div className="text-gray-400 flex items-center gap-2">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>TechAvenue Retail Management System • Integrated Help & Guidance</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-gray-200 dark:bg-darkbg hover:bg-gray-300 dark:hover:bg-darkbg-hover text-gray-800 dark:text-gray-200 font-semibold transition-colors cursor-pointer"
          >
            Close Manual
          </button>
        </div>
      </div>
    </div>
  );
}

