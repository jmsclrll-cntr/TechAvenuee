# TechAvenue System Documentation
## Comprehensive Function & Tab Reference Manual

---

## 1. Overview & Architecture
**TechAvenue** is a Computer & Accessories Store Management System built with:
"- **Frontend:** React, Vite, Tailwind CSS, Lucide Icons, Custom Responsive Charts."
- **Backend:** Python Flask REST API with Role-Based Access Control (RBAC).
"- **Database:** MySQL relational database with foreign keys, activity logging, and real-time transaction tracking."
- **Analytics & AI:** Scikit-Learn regression and time-series demand forecasting engines.

---

## 2. Common & Global Header Controls

### Top Header Bar
- **Sidebar Collapse Button:** Toggle to expand or minimize the navigation sidebar to maximize workspace view.
- **Welcome Title:** Displays a personalized greeting with the current user's full name.
"- **Status Indicators:** Dynamically surfaces live alerts including active cashier shift tags, instructor inspection banners, or low-stock item counters."

### User Account Menu (Layout 3: Profile Card)
- **Banner Header:** Gradient banner with overlapping circular profile avatar and online status dot.
"- **User Identity:** Displays full name, email address, and a pill badge indicating user role."
- **View Profile (`activeTab === 'profile'`):** Navigates directly to the user profile settings tab.
"- **Dark Mode Switch:** Instantly switches between high-contrast dark theme and clean light mode, persisting choice in `localStorage`."
- **Full Screen Switch:** Connects with the browser Fullscreen API to enter or exit fullscreen mode.
- **Text Size Stepper (`A-` / `A+`):** Scales application-wide typography across 3 calibrated modes:
  - **Compact (88%)**
  - **Standard (100%)**
  - **Large (115%)**
- **System Guide & User Manual:** Opens the global interactive user manual modal.
- **Sign Out:** Prompts for unsaved work confirmation and logs the user out securely.

---

## 3. Administrator Workspace (`AdminDashboard.jsx`)

"The Administrator has unrestricted authority over inventory, finance, staff accounts, suppliers, and AI models."

### Dashboard Sub-Views (Grouped Navigation)
1. **All Overview:**
"   - Executive KPIs: Daily Sales, Monthly Revenue, Catalog Products, Total Asset Cost, Low Stock Alerts, Transactions Today, Active Staff, Projected Sales Growth."
   - Dual analytics: *Sales Trend vs. Projected* line chart and *Inventory Status Distribution* donut chart.
   - Quick tables: Recent Sales Transactions and Low-Stock Alert warnings.
2. **Sales & Revenue:**
"   - Financial breakdown: Top-selling products volume bar chart, monthly sales trajectory, and sales register summary."
3. **Inventory & Stock:**
"   - Warehouse asset status, stock distribution, and items at or below reorder threshold."
4. **AI Predictions:**
   - Machine learning forecasts predicting upcoming product demand and monthly sales velocity.
5. **Store Activity:**
"   - Chronological audit ledger displaying employee actions, logins, product creation/edits, and sales with timestamps."

### Sidebar Tabs
- **Inventory (`activeTab === 'inventory'`):**
"  - Search by name, SKU, or brand, and filter by category."
"  - Displays wholesale Cost, Retail Selling Price, and calculated **Margin / Markup %**."
  - **Add New Product:** Opens modal to register a new hardware item.
"  - **Edit Item:** Modify specifications, wholesale cost, and retail price."
  - **Delete Item:** Safely deletes product and associated records with confirmation dialog.
- **Sales Transactions (`activeTab === 'sales'`):**
"  - Full transaction register with invoice numbers, cashier, VAT breakdown, and payment methods."
  - **Export Transactions CSV:** Exports full ledger into a downloadable spreadsheet.
- **User Management (`activeTab === 'users'`):**
"  - Create staff accounts, assign roles (Admin, Inventory Clerk, Sales Personnel, Instructor), and activate/deactivate access."
- **Suppliers & Purchasing (`activeTab === 'purchasing'`):**
"  - Manage distributor contracts, partner contact details, and procurement."
- **Reports & Analytics (`activeTab === 'reports'`):**
"  - Detailed analytics for revenue, turnover rates, and category distribution."
- **Knowledge Analysis & Prediction:**
  - **Product Demand Prediction:** Forecasts inventory units needed.
  - **Sales Prediction:** Projected revenue trajectory.
  - **Slow-Moving Products:** Identifies stagnant items to avoid dead stock.
  - **Best-Selling Products:** Highlights top-performing items to prioritize restocking.

---

## 4. Inventory Clerk Workspace (`ClerkDashboard.jsx`)

Tailored for warehouse and receiving staff to manage deliveries and stock movement.

"- **Dashboard:** At-a-glance stock KPIs, low-stock notifications, and recent inventory movement logs."
"- **Inventory:** Catalog view of items, categories, current quantities, and reorder levels."
- **Stock In / Restocking (`activeTab === 'stock_in'`):**
"  - Console to receive incoming vendor shipments, select suppliers, input batch quantities, and update catalog counts."
- **Stock Out (`activeTab === 'stock_out'`):**
"  - Process non-sale stock adjustments (damages, display units, warranty returns, or transfers)."
- **Stock Movement History (`activeTab === 'movements'`):**
"  - Immutable audit trail tracking every movement with reference IDs, reasons, and timestamps."
- **Suppliers (`activeTab === 'suppliers'`):**
  - List and contact details for approved manufacturers and component vendors.

---

## 5. Sales Personnel Workspace (`SalesDashboard.jsx`)

Designed for retail POS checkout counters with fast barcode-friendly workflows.

"- **Dashboard:** Shift sales metrics, active cashier shift info, and daily top-selling items."
- **Market / Point of Sale (`activeTab === 'pos'`):**
  - Interactive product catalog grid.
"  - Add items to customer cart, adjust quantities, calculate 12% VAT and gross totals."
"  - Multiple payment methods: Cash, GCash, Maya, Debit/Credit Card."
  - Automated change calculation and receipt printing.
- **New Transaction (`activeTab === 'new_transaction'`):**
  - Manual invoice drafting and transaction creation.
- **Sales History & Receipts (`activeTab === 'sales_history'` / `'receipts'`):**
"  - Historical invoice lookup, detailed item breakdowns, and receipt reprinting."
- **Product Lookup (`activeTab === 'product_lookup'`):**
  - Fast price and stock checker for customer inquiries without interrupting an active cart.
- **Shift Summary (`activeTab === 'shift_summary'`):**
  - End-of-shift register drawer balancing and financial handoff reports.

---

## 6. Instructor Workspace (`InstructorDashboard.jsx`)

"Built for training, auditing, and academic machine learning review."

- **Dashboard & Overviews:** Read-only inspection of store sales and inventory data without alteration rights.
- **Dataset Explorer (`activeTab === 'datasets'`):**
"  - Inspect raw machine learning datasets, data quality, feature distributions, and column types."
- **Model Training (`activeTab === 'train'`):**
  - Trigger Scikit-Learn training pipelines on historical sales and inventory data.
- **Model Evaluation (`activeTab === 'evaluate'`):**
"  - Review performance metrics (RMSE, $R^2$, Mean Absolute Error)."
- **Model Comparison (`activeTab === 'compare'`):**
  - Side-by-side benchmark comparison between algorithms.
- **Saved Models & Prediction History:**
  - View serialized model artifacts and past execution logs.

---
"*Document generated on November 13, 2026 for TechAvenue.*"
