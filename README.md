# TECH AVENUE — Computer & Accessories Store Management System

A full-stack, enterprise-grade business management and machine learning sales forecasting system built for **TECH AVENUE Computer and Accessories Store**.

---

## 🚀 System Architecture

- **Frontend**: React 19 + Vite + Tailwind CSS + Lucide Icons
- **Backend**: Python + Flask RESTful API + scikit-learn Machine Learning Engine
- **Database**: MySQL (`tech_avenue`) with PyMySQL connection and atomic transaction management
- **Machine Learning**: Simple Linear Regression & Random Forest Regressor

---

## 🎨 Design System & Palette

- **Navy Blue**: `#1E3A5F` (Primary brand color & light-mode sidebar)
- **Greige**: `#CFC8BE` (Accent badges, text accents, and borders)
- **White**: `#FFFFFF` (Primary light surfaces and cards)
- **Light Gray**: `#E5E7EB` (Subtle dividers and borders)
- **Charcoal**: `#374151` (Dark borders and readable typography)
- **Dark Background**: `#1F2632` (Root background in dark mode)
- **Dark Cards**: `#2B3441` (Card surface in dark mode)
- **Muted Green**: `#10B981` (In-stock items, positive growth, active status)
- **Muted Red**: `#EF4444` (Out-of-stock items, alerts, danger actions)
- **Amber**: `#F59E0B` (Low-stock items, warnings, slow-moving inventory)

**Theme Persistence**: Supports both Light and Dark modes with instant toggle (Moon/Sun) persisted in `localStorage`.

---

## 👥 Four Distinct Role-Based Dashboards & Credentials

| Role | Email | Password | Access Highlights |
|---|---|---|---|
| **Inventory Clerk** | `clerk@techavenue.com` | `clerk123` | Product catalog, Stock In / Restocking, Authorized Stock Out, Movement Audit History, Low-stock Alerts, Supplier management. *Restricted from POS, User Admin, ML.* |
| **Sales Personnel** | `sales@techavenue.com` | `sales123` | Point of Sale (POS), Shopping Cart, 12% VAT calculations, Cash/Card/GCash Checkout, Digital Receipt Generation, Sales History, Product Lookup, Cashier Shift Reconciliation. *Restricted from User Admin, Inventory Cost Edits, ML.* |
| **Admin** | `admin@techavenue.com` | `admin123` | Full Store Overview, Complete Inventory CRUD (cost & retail pricing), Sales Monitor, Employee Account Management (RBAC), Reports & CSV Export, Executive Predictions with Business Recommendations. *Restricted from raw ML training & evaluation metrics.* |
| **Instructor** | `instructor@techavenue.com` | `instructor123` | Complete Machine Learning Workspace, Dataset Explorer with >= 1,000 real records per CSV, Model Training & Hyperparameter Tuning, Actual Metric Calculation (R², MAE, MSE, RMSE), Algorithm Comparison, Saved Model Registry (.joblib). |

---

## 🤖 Machine Learning Workspace (4 Supported Tasks)

1. **Daily Sales Revenue Prediction** (`tech_avenue_sales_dataset.csv`, 1,200 records)
   - Predicts gross revenue (PHP) from store footfall, marketing spend, promotions, and holidays.
2. **Product Demand Prediction** (`tech_avenue_product_demand_dataset.csv`, 1,500 records)
   - Predicts units demanded per category, pricing advantage, discounts, and seasonality.
3. **Inventory Turnover / Slow-Moving Detection** (`tech_avenue_inventory_turnover_dataset.csv`, 1,100 records)
   - Predicts days-to-sell velocity based on shelf age, restock frequency, and margins.
4. **Best-Selling Products Prediction** (`tech_avenue_best_sellers_dataset.csv`, 1,200 records)
   - Predicts sales volume based on online traffic, conversion rate, rating, and price tier.

---

## 🛠️ How to Run the Application

### 1. Prerequisites
- Python 3.10+ (with `flask`, `flask-cors`, `pymysql`, `scikit-learn`, `pandas`, `numpy`)
- MySQL Server (e.g. via XAMPP on port `3306`)
- Node.js & npm

### 2. Start MySQL
Ensure MySQL is running on `localhost:3306`. If using XAMPP:
```powershell
C:\xampp\mysql\bin\mysqld.exe --defaults-file=C:\xampp\mysql\bin\my.ini --standalone
```

### 3. Start Flask Backend
```powershell
cd backend
python app.py
```
*Note: On first startup, `app.py` automatically creates the `tech_avenue` database, table schema, and seeds realistic users, products, suppliers, movements, and initial shifts.*

### 4. Start React Frontend
```powershell
cd frontend
npm run dev
```
Open your browser at: **`http://127.0.0.1:5173/`**
