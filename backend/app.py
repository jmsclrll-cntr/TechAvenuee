import os
import json
import uuid
import secrets
import datetime
from functools import wraps
from werkzeug.utils import secure_filename
from werkzeug.security import check_password_hash, generate_password_hash
from flask import Flask, request, jsonify, send_from_directory, send_file
from flask_cors import CORS
import pymysql

from database import get_db_connection, init_db
import ml_engine

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

# Directory configurations for uploads
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads", "products")
os.makedirs(UPLOAD_DIR, exist_ok=True)
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "webp"}
MAX_FILE_SIZE = 5 * 1024 * 1024 # 5 MB

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

# In-memory session store mapping token -> user dictionary
ACTIVE_TOKENS = {}

def get_current_user():
    """Extract authenticated user from Authorization header or query param."""
    auth_header = request.headers.get("Authorization", "")
    token = None
    if auth_header.startswith("Bearer "):
        token = auth_header[7:].strip()
    elif "token" in request.args:
        token = request.args.get("token")
        
    if not token or token not in ACTIVE_TOKENS:
        return None
    return ACTIVE_TOKENS[token]

def require_role(*allowed_roles):
    """Decorator to enforce role-based access control on endpoints."""
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            user = get_current_user()
            if not user:
                return jsonify({"status": "error", "message": "Authentication required"}), 401
            
            if allowed_roles and user["role"] not in allowed_roles:
                return jsonify({
                    "status": "error",
                    "message": f"Forbidden: role '{user['role']}' does not have permission for this resource"
                }), 403
                
            return fn(*args, **kwargs)
        return wrapper
    return decorator

# ----------------- HEALTH & STATIC UPLOADS -----------------
@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "status": "success",
        "message": "TechAvenue backend is running",
        "version": "2.1.0",
        "timestamp": datetime.datetime.now().isoformat()
    })

@app.route("/api/uploads/products/<path:filename>", methods=["GET"])
def serve_product_image(filename):
    return send_from_directory(UPLOAD_DIR, filename)

# ----------------- AUTHENTICATION -----------------
@app.route("/api/auth/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"status": "error", "message": "Email and password are required"}), 400

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM users WHERE LOWER(email) = %s OR LOWER(username) = %s;", (email, email))
            user = cursor.fetchone()
            
            if not user or not check_password_hash(user["password_hash"], password):
                return jsonify({"status": "error", "message": "Invalid email/username or password"}), 401
                
            if user["status"] != "active":
                return jsonify({"status": "error", "message": "Account is deactivated. Contact Admin."}), 403
                
            cursor.execute("UPDATE users SET last_login = NOW() WHERE id = %s;", (user["id"],))
            
            token = secrets.token_hex(24)
            user_data = {
                "id": user["id"],
                "username": user["username"],
                "full_name": user["full_name"],
                "email": user["email"],
                "role": user["role"],
                "status": user["status"]
            }
            ACTIVE_TOKENS[token] = user_data
            
            cursor.execute("""
                INSERT INTO activity_logs (user_id, action, details)
                VALUES (%s, 'LOGIN', %s);
            """, (user["id"], f"User {user['username']} logged in as {user['role']}"))
            
            return jsonify({
                "status": "success",
                "message": "Login successful",
                "token": token,
                "user": user_data
            })
    finally:
        conn.close()

@app.route("/api/auth/me", methods=["GET"])
def me():
    user = get_current_user()
    if not user:
        return jsonify({"status": "error", "message": "Not authenticated"}), 401
    return jsonify({"status": "success", "user": user})

@app.route("/api/auth/switch-role", methods=["POST"])
def switch_role():
    data = request.get_json() or {}
    role = data.get("role")
    valid_roles = ["inventory_clerk", "sales_personnel", "admin", "instructor"]
    if role not in valid_roles:
        return jsonify({"status": "error", "message": "Invalid role"}), 400

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM users WHERE role = %s AND status = 'active' LIMIT 1;", (role,))
            user = cursor.fetchone()
            if not user:
                return jsonify({"status": "error", "message": f"No active user found with role {role}"}), 404
                
            token = secrets.token_hex(24)
            user_data = {
                "id": user["id"],
                "username": user["username"],
                "full_name": user["full_name"],
                "email": user["email"],
                "role": user["role"],
                "status": user["status"]
            }
            ACTIVE_TOKENS[token] = user_data
            return jsonify({
                "status": "success",
                "token": token,
                "user": user_data
            })
    finally:
        conn.close()

# ----------------- DASHBOARD STATS (ROLE-SPECIFIC) -----------------
@app.route("/api/dashboard/stats", methods=["GET"])
def get_dashboard_stats():
    user = get_current_user()
    role = user["role"] if user else request.args.get("role", "admin")

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            # Inventory aggregations
            cursor.execute("SELECT COUNT(*) AS count FROM products;")
            total_products = cursor.fetchone()["count"]

            cursor.execute("SELECT COALESCE(SUM(stock_quantity), 0) AS total_units FROM products;")
            total_units = cursor.fetchone()["total_units"]

            cursor.execute("SELECT COUNT(*) AS count FROM products WHERE stock_quantity > 0 AND stock_quantity <= reorder_level;")
            low_stock_count = cursor.fetchone()["count"]

            cursor.execute("SELECT COUNT(*) AS count FROM products WHERE stock_quantity = 0;")
            out_of_stock_count = cursor.fetchone()["count"]

            cursor.execute("SELECT COALESCE(SUM(stock_quantity * cost_price), 0) AS inv_value FROM products;")
            total_cost_value = float(cursor.fetchone()["inv_value"])

            cursor.execute("SELECT COALESCE(SUM(stock_quantity * selling_price), 0) AS retail_value FROM products;")
            total_retail_value = float(cursor.fetchone()["retail_value"])

            # Sales aggregations (Today)
            cursor.execute("""
                SELECT COALESCE(SUM(total_amount), 0) AS sales_today, COUNT(*) AS tx_today
                FROM sales_transactions
                WHERE DATE(created_at) = CURDATE() AND status = 'completed';
            """)
            today_data = cursor.fetchone()
            sales_today = float(today_data["sales_today"])
            tx_today = int(today_data["tx_today"])

            # Items sold today
            cursor.execute("""
                SELECT COALESCE(SUM(si.quantity), 0) AS items_sold
                FROM sales_items si
                JOIN sales_transactions st ON si.transaction_id = st.id
                WHERE DATE(st.created_at) = CURDATE() AND st.status = 'completed';
            """)
            items_sold_today = int(cursor.fetchone()["items_sold"] or 0)

            # Monthly revenue
            cursor.execute("""
                SELECT COALESCE(SUM(total_amount), 0) AS monthly_rev
                FROM sales_transactions
                WHERE MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE()) AND status = 'completed';
            """)
            monthly_rev = float(cursor.fetchone()["monthly_rev"])

            # Low stock products list (with photos)
            cursor.execute("""
                SELECT p.id, p.sku, p.name, p.brand, c.name as category, p.stock_quantity as current_stock, 
                       p.reorder_level, p.status, p.cost_price, p.selling_price, p.image_url
                FROM products p
                JOIN categories c ON p.category_id = c.id
                WHERE p.stock_quantity <= p.reorder_level
                ORDER BY p.stock_quantity ASC
                LIMIT 10;
            """)
            low_stock_alerts = cursor.fetchall()

            # Recent completed transactions
            cursor.execute("""
                SELECT t.id, t.invoice_number, t.created_at, t.customer_name, t.total_amount, 
                       t.payment_method, t.status, u.full_name as cashier_name,
                       (SELECT COUNT(*) FROM sales_items WHERE transaction_id = t.id) as items_count
                FROM sales_transactions t
                JOIN users u ON t.user_id = u.id
                WHERE t.status = 'completed'
                ORDER BY t.id DESC
                LIMIT 8;
            """)
            recent_transactions = cursor.fetchall()

            # Active drafts count
            cursor.execute("SELECT COUNT(*) AS count FROM sales_transactions WHERE status = 'draft';")
            active_drafts_count = cursor.fetchone()["count"]

            # Active shift
            cursor.execute("SELECT * FROM shifts WHERE status = 'active' ORDER BY id DESC LIMIT 1;")
            active_shift = cursor.fetchone()

            # Categories distribution
            cursor.execute("""
                SELECT c.name, COUNT(p.id) as product_count, COALESCE(SUM(p.stock_quantity), 0) as total_stock
                FROM categories c
                LEFT JOIN products p ON c.id = p.category_id
                GROUP BY c.id, c.name
                ORDER BY total_stock DESC;
            """)
            category_distribution = cursor.fetchall()

            # Purchasing metrics
            cursor.execute("SELECT COUNT(*) AS count FROM suppliers WHERE status = 'active';")
            active_suppliers_count = cursor.fetchone()["count"]

            cursor.execute("SELECT COUNT(*) AS count FROM purchase_orders WHERE status IN ('Pending', 'Ordered');")
            pending_po_count = cursor.fetchone()["count"]

            cursor.execute("SELECT COUNT(*) AS count FROM purchase_orders WHERE status = 'Ordered';")
            orders_awaiting_delivery = cursor.fetchone()["count"]

            cursor.execute("SELECT COALESCE(SUM(total_amount), 0) AS total_val FROM purchase_orders WHERE status != 'Cancelled';")
            total_purchasing_value = float(cursor.fetchone()["total_val"])

            res = {
                "role": role,
                "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            }

            if role == "sales_personnel":
                avg_tx = round(sales_today / max(1, tx_today), 2)
                shift_sales = float(active_shift["total_sales"]) if active_shift else sales_today
                res.update({
                    "cards": {
                        "sales_today": sales_today,
                        "transactions_today": tx_today,
                        "average_transaction_value": avg_tx,
                        "items_sold_today": items_sold_today,
                        "current_shift_sales": shift_sales,
                        "active_drafts": active_drafts_count
                    },
                    "shift_info": active_shift,
                    "tables": {
                        "recent_transactions": recent_transactions,
                        "low_stock_notifications": low_stock_alerts
                    },
                    "charts": {
                        "hourly_sales": [
                            {"hour": "09:00", "sales": 15000},
                            {"hour": "11:00", "sales": 28000},
                            {"hour": "13:00", "sales": 42000},
                            {"hour": "15:00", "sales": 21000},
                            {"hour": "17:00", "sales": 36000},
                            {"hour": "19:00", "sales": 18000}
                        ],
                        "sales_by_category": [
                            {"name": c["name"], "value": float(c["total_stock"] * 1200)} for c in category_distribution[:5]
                        ]
                    }
                })

            elif role == "inventory_clerk":
                # Recent movements
                cursor.execute("""
                    SELECT m.reference_number, p.name as product_name, p.sku, p.image_url, m.movement_type, m.quantity, 
                           m.previous_stock, m.new_stock, m.created_at, u.full_name as processed_by, m.reason
                    FROM inventory_movements m
                    JOIN products p ON m.product_id = p.id
                    JOIN users u ON m.user_id = u.id
                    ORDER BY m.id DESC
                    LIMIT 8;
                """)
                recent_movements = cursor.fetchall()

                res.update({
                    "cards": {
                        "total_products": total_products,
                        "total_units_in_stock": total_units,
                        "low_stock_products": low_stock_count,
                        "out_of_stock_products": out_of_stock_count,
                        "pending_restocks": low_stock_count + out_of_stock_count,
                        "inventory_value": total_cost_value
                    },
                    "charts": {
                        "category_distribution": [
                            {"name": c["name"], "count": c["total_stock"]} for c in category_distribution
                        ],
                        "stock_status": [
                            {"status": "In Stock", "count": total_products - low_stock_count - out_of_stock_count, "color": "#10B981"},
                            {"status": "Low Stock", "count": low_stock_count, "color": "#F59E0B"},
                            {"status": "Out of Stock", "count": out_of_stock_count, "color": "#EF4444"}
                        ]
                    },
                    "tables": {
                        "low_stock_alerts": low_stock_alerts,
                        "recent_movements": recent_movements
                    }
                })

            elif role == "admin":
                cursor.execute("SELECT COUNT(*) AS count FROM users WHERE status = 'active';")
                active_employees = cursor.fetchone()["count"]

                # Recent user activity
                cursor.execute("""
                    SELECT l.id, u.full_name as user_name, u.role, l.action, l.details, l.created_at
                    FROM activity_logs l
                    JOIN users u ON l.user_id = u.id
                    ORDER BY l.id DESC
                    LIMIT 6;
                """)
                recent_activity = cursor.fetchall()

                # Latest predictions
                cursor.execute("""
                    SELECT p.id, p.task, p.algorithm, p.predicted_value, p.confidence_interval, p.recommendation, p.created_at, u.full_name as user_name
                    FROM predictions p
                    LEFT JOIN users u ON p.user_id = u.id
                    ORDER BY p.id DESC
                    LIMIT 5;
                """)
                latest_predictions = cursor.fetchall()

                # Top-selling products
                cursor.execute("""
                    SELECT p.id, p.name, p.sku, p.image_url, COALESCE(SUM(si.quantity), 0) as units_sold,
                           COALESCE(SUM(si.total_price), 0) as revenue
                    FROM products p
                    LEFT JOIN sales_items si ON p.id = si.product_id
                    LEFT JOIN sales_transactions st ON si.transaction_id = st.id AND st.status = 'completed'
                    GROUP BY p.id, p.name, p.sku, p.image_url
                    ORDER BY units_sold DESC
                    LIMIT 5;
                """)
                top_selling = cursor.fetchall()

                res.update({
                    "cards": {
                        "total_daily_sales": sales_today,
                        "monthly_revenue": monthly_rev,
                        "total_products": total_products,
                        "total_inventory_value": total_cost_value,
                        "low_stock_products": low_stock_count,
                        "transactions_today": tx_today,
                        "active_employees": active_employees,
                        "predicted_sales_growth": "+14.8% Projected"
                    },
                    "charts": {
                        "sales_trends": [
                            {"month": "May", "sales": 840000},
                            {"month": "Jun", "sales": 920000},
                            {"month": "Jul", "sales": 980000},
                            {"month": "Aug", "sales": 1050000},
                            {"month": "Sep", "sales": 1120000},
                            {"month": "Oct", "sales": 1260000}
                        ],
                        "inventory_status": [
                            {"status": "In Stock", "count": total_products - low_stock_count - out_of_stock_count, "color": "#10B981"},
                            {"status": "Low Stock", "count": low_stock_count, "color": "#F59E0B"},
                            {"status": "Out of Stock", "count": out_of_stock_count, "color": "#EF4444"}
                        ],
                        "category_breakdown": [
                            {"name": c["name"], "stock": c["total_stock"]} for c in category_distribution
                        ],
                        "top_selling_products": [
                            {"name": p["name"], "units": int(p["units_sold"])} for p in top_selling
                        ],
                        "predicted_demand_trends": [
                            {"period": "Week 1", "demand": 42},
                            {"period": "Week 2", "demand": 48},
                            {"period": "Week 3", "demand": 55},
                            {"period": "Week 4", "demand": 62}
                        ]
                    },
                    "tables": {
                        "recent_sales": recent_transactions,
                        "low_stock_products": low_stock_alerts,
                        "user_activity": recent_activity,
                        "latest_predictions": latest_predictions
                    }
                })

            elif role == "instructor":
                # Instructor ML & Evaluation statistics
                cursor.execute("SELECT COUNT(*) AS count FROM models_registry WHERE is_active = TRUE;")
                models_count = cursor.fetchone()["count"]

                cursor.execute("""
                    SELECT r2_score, trained_at, algorithm, task 
                    FROM models_registry 
                    ORDER BY id DESC 
                    LIMIT 1;
                """)
                latest_eval = cursor.fetchone()
                latest_r2 = latest_eval["r2_score"] if latest_eval else 0.98
                latest_date = latest_eval["trained_at"].strftime("%Y-%m-%d %H:%M") if latest_eval and latest_eval.get("trained_at") else "2026-10-30"

                # Models list for comparison
                cursor.execute("""
                    SELECT task, algorithm, r2_score, mae, rmse, n_samples, trained_at 
                    FROM models_registry 
                    ORDER BY id DESC 
                    LIMIT 10;
                """)
                saved_evaluations = cursor.fetchall()

                # Recent predictions
                cursor.execute("""
                    SELECT p.id, p.task, p.algorithm, p.predicted_value, p.confidence_interval, p.recommendation, p.created_at, u.full_name as user_name
                    FROM predictions p
                    LEFT JOIN users u ON p.user_id = u.id
                    ORDER BY p.id DESC
                    LIMIT 6;
                """)
                instructor_predictions = cursor.fetchall()

                res.update({
                    "cards": {
                        "total_daily_sales": sales_today,
                        "monthly_revenue": monthly_rev,
                        "total_products": total_products,
                        "inventory_alerts": low_stock_count,
                        "dataset_record_count": 4400,
                        "models_available": models_count,
                        "latest_model_r2": round(float(latest_r2), 4) if latest_r2 is not None else 0.98,
                        "latest_evaluation_date": latest_date
                    },
                    "charts": {
                        "sales_performance": [
                            {"month": "May", "sales": 840000},
                            {"month": "Jun", "sales": 920000},
                            {"month": "Jul", "sales": 980000},
                            {"month": "Aug", "sales": 1050000},
                            {"month": "Sep", "sales": 1120000},
                            {"month": "Oct", "sales": 1260000}
                        ],
                        "product_demand_trends": [
                            {"period": "Week 1", "demand": 42},
                            {"period": "Week 2", "demand": 48},
                            {"period": "Week 3", "demand": 55},
                            {"period": "Week 4", "demand": 62}
                        ],
                        "historical_vs_predicted": [
                            {"period": "Aug", "actual": 1050000, "predicted": 1040000},
                            {"period": "Sep", "actual": 1120000, "predicted": 1115000},
                            {"period": "Oct", "actual": 1260000, "predicted": 1250000},
                            {"period": "Nov (Proj)", "actual": None, "predicted": 1380000}
                        ],
                        "model_performance_comparison": [
                            {"task": "Sales", "linear_regression": 0.978, "random_forest": 0.959},
                            {"task": "Demand", "linear_regression": 0.981, "random_forest": 0.976},
                            {"task": "Slow-Moving", "linear_regression": 0.982, "random_forest": 0.970},
                            {"task": "Best-Sellers", "linear_regression": 0.985, "random_forest": 0.975}
                        ],
                        "dataset_distribution": [
                            {"name": "Sales Dataset", "records": 1200},
                            {"name": "Demand Dataset", "records": 1200},
                            {"name": "Slow-Moving Dataset", "records": 1000},
                            {"name": "Best-Sellers Dataset", "records": 1000}
                        ]
                    },
                    "tables": {
                        "recent_evaluations": saved_evaluations,
                        "recent_predictions": instructor_predictions
                    }
                })

            return jsonify({"status": "success", "data": res})
    finally:
        conn.close()

# ----------------- PRODUCT CATALOG & IMAGE MANAGEMENT -----------------
@app.route("/api/inventory", methods=["GET"])
def get_inventory():
    search = request.args.get("search", "").strip()
    category_id = request.args.get("category_id")
    status = request.args.get("status")

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            query = """
                SELECT p.id, p.sku, p.name, p.brand, p.category_id, c.name as category_name,
                       p.cost_price, p.selling_price, p.stock_quantity, p.reorder_level,
                       p.status, p.image_url, p.description, p.updated_at
                FROM products p
                JOIN categories c ON p.category_id = c.id
                WHERE 1=1
            """
            params = []
            if search:
                query += " AND (p.name LIKE %s OR p.sku LIKE %s OR p.brand LIKE %s)"
                term = f"%{search}%"
                params.extend([term, term, term])
            if category_id:
                query += " AND p.category_id = %s"
                params.append(category_id)
            if status:
                query += " AND p.status = %s"
                params.append(status)

            query += " ORDER BY p.id ASC;"
            cursor.execute(query, params)
            products = cursor.fetchall()

            cursor.execute("SELECT id, name, code FROM categories ORDER BY name ASC;")
            categories = cursor.fetchall()

            return jsonify({
                "status": "success",
                "products": products,
                "categories": categories,
                "total": len(products)
            })
    finally:
        conn.close()

@app.route("/api/products/<int:product_id>/image", methods=["POST"])
@require_role("admin", "inventory_clerk")
def upload_product_image(product_id):
    if "image" not in request.files:
        return jsonify({"status": "error", "message": "No file uploaded"}), 400
        
    file = request.files["image"]
    if file.filename == "":
        return jsonify({"status": "error", "message": "No file selected"}), 400
        
    if not allowed_file(file.filename):
        return jsonify({"status": "error", "message": "Invalid file type. Allowed: PNG, JPG, JPEG, WEBP"}), 400

    ext = file.filename.rsplit(".", 1)[1].lower()
    unique_filename = f"prod_{product_id}_{int(datetime.datetime.now().timestamp())}_{uuid.uuid4().hex[:6]}.{ext}"
    filepath = os.path.join(UPLOAD_DIR, unique_filename)
    file.save(filepath)

    image_url = f"/api/uploads/products/{unique_filename}"

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("UPDATE products SET image_url = %s WHERE id = %s;", (image_url, product_id))
            return jsonify({
                "status": "success",
                "message": "Product image uploaded successfully",
                "image_url": image_url
            })
    finally:
        conn.close()

@app.route("/api/inventory", methods=["POST"])
@require_role("admin", "inventory_clerk")
def add_product():
    user = get_current_user()
    data = request.get_json() or {}
    
    sku = data.get("sku", "").strip().upper()
    name = data.get("name", "").strip()
    brand = data.get("brand", "").strip()
    category_id = data.get("category_id")
    cost_price = float(data.get("cost_price", 0))
    selling_price = float(data.get("selling_price", 0))
    stock_quantity = int(data.get("stock_quantity", 0))
    reorder_level = int(data.get("reorder_level", 5))
    image_url = data.get("image_url", "/products/default.svg")
    description = data.get("description", "")

    if not sku or not name or not brand or not category_id:
        return jsonify({"status": "error", "message": "SKU, Name, Brand, and Category are required"}), 400

    status = "out_of_stock" if stock_quantity == 0 else ("low_stock" if stock_quantity <= reorder_level else "in_stock")

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT id FROM products WHERE sku = %s;", (sku,))
            if cursor.fetchone():
                return jsonify({"status": "error", "message": f"Product with SKU '{sku}' already exists"}), 400

            cursor.execute("""
                INSERT INTO products (sku, name, brand, category_id, cost_price, selling_price, stock_quantity, reorder_level, status, image_url, description)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
            """, (sku, name, brand, category_id, cost_price, selling_price, stock_quantity, reorder_level, status, image_url, description))
            new_id = cursor.lastrowid

            if stock_quantity > 0:
                ref = f"MOV-{datetime.datetime.now().strftime('%Y%m%d%H%M%S')}"
                cursor.execute("""
                    INSERT INTO inventory_movements (reference_number, product_id, movement_type, quantity, previous_stock, new_stock, reason, user_id)
                    VALUES (%s, %s, 'stock_in', %s, 0, %s, 'Initial inventory registration', %s);
                """, (ref, new_id, stock_quantity, stock_quantity, user["id"]))

            cursor.execute("""
                INSERT INTO activity_logs (user_id, action, details)
                VALUES (%s, 'ADD_PRODUCT', %s);
            """, (user["id"], f"Added product {name} ({sku})"))

            return jsonify({"status": "success", "message": "Product created successfully", "product_id": new_id}), 201
    finally:
        conn.close()

@app.route("/api/inventory/<int:product_id>", methods=["PUT"])
@require_role("admin", "inventory_clerk")
def update_product(product_id):
    user = get_current_user()
    data = request.get_json() or {}

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM products WHERE id = %s;", (product_id,))
            current = cursor.fetchone()
            if not current:
                return jsonify({"status": "error", "message": "Product not found"}), 404

            name = data.get("name", current["name"])
            brand = data.get("brand", current["brand"])
            category_id = data.get("category_id", current["category_id"])
            cost_price = float(data.get("cost_price", current["cost_price"]))
            reorder_level = int(data.get("reorder_level", current["reorder_level"]))
            image_url = data.get("image_url", current.get("image_url"))
            description = data.get("description", current["description"])
            
            if user["role"] == "inventory_clerk":
                selling_price = float(current["selling_price"])
            else:
                selling_price = float(data.get("selling_price", current["selling_price"]))

            cursor.execute("""
                UPDATE products 
                SET name = %s, brand = %s, category_id = %s, cost_price = %s, selling_price = %s, reorder_level = %s, image_url = %s, description = %s
                WHERE id = %s;
            """, (name, brand, category_id, cost_price, selling_price, reorder_level, image_url, description, product_id))

            cursor.execute("""
                INSERT INTO activity_logs (user_id, action, details)
                VALUES (%s, 'EDIT_PRODUCT', %s);
            """, (user["id"], f"Updated product {name} ({current['sku']})"))

            return jsonify({"status": "success", "message": "Product updated successfully"})
    finally:
        conn.close()

@app.route("/api/inventory/stock-in", methods=["POST"])
@require_role("admin", "inventory_clerk")
def process_stock_in():
    user = get_current_user()
    data = request.get_json() or {}

    product_id = data.get("product_id")
    quantity = int(data.get("quantity", 0))
    supplier_id = data.get("supplier_id")
    notes = data.get("notes", "Restock delivery").strip()

    if not product_id or quantity <= 0:
        return jsonify({"status": "error", "message": "Valid product and positive quantity required"}), 400

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM products WHERE id = %s FOR UPDATE;", (product_id,))
            prod = cursor.fetchone()
            if not prod:
                return jsonify({"status": "error", "message": "Product not found"}), 404

            prev_stock = prod["stock_quantity"]
            new_stock = prev_stock + quantity
            new_status = "in_stock" if new_stock > prod["reorder_level"] else "low_stock"

            cursor.execute("""
                UPDATE products 
                SET stock_quantity = %s, status = %s
                WHERE id = %s;
            """, (new_stock, new_status, product_id))

            ref = f"STKIN-{datetime.datetime.now().strftime('%Y%m%d%H%M%S')}"
            cursor.execute("""
                INSERT INTO inventory_movements (reference_number, product_id, movement_type, quantity, previous_stock, new_stock, reason, supplier_id, user_id)
                VALUES (%s, %s, 'stock_in', %s, %s, %s, %s, %s, %s);
            """, (ref, product_id, quantity, prev_stock, new_stock, notes, supplier_id, user["id"]))

            cursor.execute("""
                INSERT INTO activity_logs (user_id, action, details)
                VALUES (%s, 'STOCK_IN', %s);
            """, (user["id"], f"Restocked {quantity} units of {prod['name']} (Ref: {ref})"))

            return jsonify({
                "status": "success",
                "message": f"Successfully received {quantity} units into inventory",
                "reference_number": ref,
                "new_stock": new_stock
            })
    finally:
        conn.close()

@app.route("/api/inventory/stock-out", methods=["POST"])
@require_role("admin", "inventory_clerk")
def process_stock_out():
    user = get_current_user()
    data = request.get_json() or {}

    product_id = data.get("product_id")
    quantity = int(data.get("quantity", 0))
    reason = data.get("reason", "Store transfer / damaged").strip()

    if not product_id or quantity <= 0:
        return jsonify({"status": "error", "message": "Valid product and positive quantity required"}), 400

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM products WHERE id = %s FOR UPDATE;", (product_id,))
            prod = cursor.fetchone()
            if not prod:
                return jsonify({"status": "error", "message": "Product not found"}), 404

            prev_stock = prod["stock_quantity"]
            if prev_stock < quantity:
                return jsonify({"status": "error", "message": f"Insufficient stock: current stock is {prev_stock}"}), 400

            new_stock = prev_stock - quantity
            new_status = "out_of_stock" if new_stock == 0 else ("low_stock" if new_stock <= prod["reorder_level"] else "in_stock")

            cursor.execute("""
                UPDATE products 
                SET stock_quantity = %s, status = %s
                WHERE id = %s;
            """, (new_stock, new_status, product_id))

            ref = f"STKOUT-{datetime.datetime.now().strftime('%Y%m%d%H%M%S')}"
            cursor.execute("""
                INSERT INTO inventory_movements (reference_number, product_id, movement_type, quantity, previous_stock, new_stock, reason, user_id)
                VALUES (%s, %s, 'stock_out', %s, %s, %s, %s, %s);
            """, (ref, product_id, -quantity, prev_stock, new_stock, reason, user["id"]))

            cursor.execute("""
                INSERT INTO activity_logs (user_id, action, details)
                VALUES (%s, 'STOCK_OUT', %s);
            """, (user["id"], f"Processed stock-out of {quantity} units for {prod['name']} (Reason: {reason})"))

            return jsonify({
                "status": "success",
                "message": f"Successfully processed stock-out of {quantity} units",
                "reference_number": ref,
                "new_stock": new_stock
            })
    finally:
        conn.close()

@app.route("/api/inventory/movements", methods=["GET"])
def get_inventory_movements():
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT m.id, m.reference_number, m.product_id, p.name as product_name, p.sku, p.image_url,
                       m.movement_type, m.quantity, m.previous_stock, m.new_stock, m.reason,
                       s.name as supplier_name, u.full_name as processed_by, m.created_at
                FROM inventory_movements m
                JOIN products p ON m.product_id = p.id
                JOIN users u ON m.user_id = u.id
                LEFT JOIN suppliers s ON m.supplier_id = s.id
                ORDER BY m.id DESC
                LIMIT 100;
            """)
            movements = cursor.fetchall()
            return jsonify({"status": "success", "movements": movements})
    finally:
        conn.close()

# ----------------- NEW TRANSACTION — DRAFT MANAGEMENT (SEPARATE FEATURE) -----------------
@app.route("/api/transactions/drafts", methods=["GET"])
@require_role("admin", "sales_personnel", "instructor")
def get_drafts():
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT t.id, t.invoice_number as reference_number, t.customer_name, t.subtotal, 
                       t.discount_pct, t.discount_amount, t.vat_amount, t.total_amount, 
                       t.status, t.notes, t.created_at, u.full_name as created_by,
                       (SELECT COUNT(*) FROM sales_items WHERE transaction_id = t.id) as item_count
                FROM sales_transactions t
                JOIN users u ON t.user_id = u.id
                WHERE t.status = 'draft'
                ORDER BY t.id DESC;
            """)
            drafts = cursor.fetchall()
            return jsonify({"status": "success", "drafts": drafts})
    finally:
        conn.close()

@app.route("/api/transactions/drafts/<int:draft_id>", methods=["GET"])
@require_role("admin", "sales_personnel", "instructor")
def get_draft_detail(draft_id):
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT t.*, u.full_name as created_by
                FROM sales_transactions t
                JOIN users u ON t.user_id = u.id
                WHERE t.id = %s AND t.status = 'draft';
            """, (draft_id,))
            draft = cursor.fetchone()
            if not draft:
                return jsonify({"status": "error", "message": "Draft transaction not found"}), 404

            cursor.execute("""
                SELECT si.id, si.product_id, si.quantity, si.unit_price, si.total_price,
                       p.sku, p.name, p.brand, p.stock_quantity as available_stock, p.image_url
                FROM sales_items si
                JOIN products p ON si.product_id = p.id
                WHERE si.transaction_id = %s;
            """, (draft_id,))
            items = cursor.fetchall()
            draft["items"] = items
            return jsonify({"status": "success", "draft": draft})
    finally:
        conn.close()

@app.route("/api/transactions/drafts", methods=["POST"])
@require_role("admin", "sales_personnel", "instructor")
def save_draft():
    user = get_current_user()
    data = request.get_json() or {}

    items = data.get("items", [])
    customer_name = data.get("customer_name", "Walk-in Customer").strip() or "Walk-in Customer"
    discount_pct = float(data.get("discount_pct", 0.0))
    notes = data.get("notes", "").strip()

    if not items or len(items) == 0:
        return jsonify({"status": "error", "message": "Transaction must have at least one product line item"}), 400

    conn = get_db_connection()
    try:
        conn.begin()
        with conn.cursor() as cursor:
            gross_subtotal = 0.0
            validated_items = []

            for itm in items:
                prod_id = itm.get("product_id")
                qty = int(itm.get("quantity", 1))
                if qty <= 0:
                    conn.rollback()
                    return jsonify({"status": "error", "message": "Item quantity must be greater than zero"}), 400

                cursor.execute("SELECT * FROM products WHERE id = %s;", (prod_id,))
                prod = cursor.fetchone()
                if not prod:
                    conn.rollback()
                    return jsonify({"status": "error", "message": f"Product ID {prod_id} not found"}), 404

                unit_price = float(prod["selling_price"])
                line_total = round(unit_price * qty, 2)
                gross_subtotal += line_total
                validated_items.append({
                    "product": prod,
                    "quantity": qty,
                    "unit_price": unit_price,
                    "total_price": line_total
                })

            discount_amount = round(gross_subtotal * (discount_pct / 100.0), 2)
            net_subtotal = round(gross_subtotal - discount_amount, 2)
            vat_amount = round(net_subtotal * 0.12, 2) # 12% VAT
            total_amount = round(net_subtotal + vat_amount, 2)

            draft_ref = f"DFT-{datetime.datetime.now().strftime('%Y%m%d%H%M%S')}-{secrets.token_hex(2).upper()}"

            cursor.execute("""
                INSERT INTO sales_transactions 
                (invoice_number, user_id, customer_name, subtotal, vat_amount, total_amount, discount_amount, discount_pct, status, notes)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'draft', %s);
            """, (draft_ref, user["id"], customer_name, net_subtotal, vat_amount, total_amount, discount_amount, discount_pct, notes))
            draft_id = cursor.lastrowid

            for v in validated_items:
                cursor.execute("""
                    INSERT INTO sales_items (transaction_id, product_id, quantity, unit_price, total_price)
                    VALUES (%s, %s, %s, %s, %s);
                """, (draft_id, v["product"]["id"], v["quantity"], v["unit_price"], v["total_price"]))

            conn.commit()

            return jsonify({
                "status": "success",
                "message": f"Transaction draft '{draft_ref}' saved successfully (Inventory NOT deducted)",
                "draft_id": draft_id,
                "reference_number": draft_ref,
                "total_amount": total_amount
            }), 201
    except Exception as e:
        conn.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        conn.close()

@app.route("/api/transactions/drafts/<int:draft_id>", methods=["PUT"])
@require_role("admin", "sales_personnel", "instructor")
def update_draft(draft_id):
    user = get_current_user()
    data = request.get_json() or {}

    items = data.get("items", [])
    customer_name = data.get("customer_name", "Walk-in Customer").strip() or "Walk-in Customer"
    discount_pct = float(data.get("discount_pct", 0.0))
    notes = data.get("notes", "").strip()

    if not items or len(items) == 0:
        return jsonify({"status": "error", "message": "Draft must have at least one product line item"}), 400

    conn = get_db_connection()
    try:
        conn.begin()
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM sales_transactions WHERE id = %s AND status = 'draft';", (draft_id,))
            current = cursor.fetchone()
            if not current:
                conn.rollback()
                return jsonify({"status": "error", "message": "Eligible draft not found"}), 404

            gross_subtotal = 0.0
            validated_items = []

            for itm in items:
                prod_id = itm.get("product_id")
                qty = int(itm.get("quantity", 1))
                if qty <= 0:
                    conn.rollback()
                    return jsonify({"status": "error", "message": "Item quantity must be greater than zero"}), 400

                cursor.execute("SELECT * FROM products WHERE id = %s;", (prod_id,))
                prod = cursor.fetchone()
                if not prod:
                    conn.rollback()
                    return jsonify({"status": "error", "message": f"Product ID {prod_id} not found"}), 404

                unit_price = float(prod["selling_price"])
                line_total = round(unit_price * qty, 2)
                gross_subtotal += line_total
                validated_items.append({
                    "product": prod,
                    "quantity": qty,
                    "unit_price": unit_price,
                    "total_price": line_total
                })

            discount_amount = round(gross_subtotal * (discount_pct / 100.0), 2)
            net_subtotal = round(gross_subtotal - discount_amount, 2)
            vat_amount = round(net_subtotal * 0.12, 2)
            total_amount = round(net_subtotal + vat_amount, 2)

            cursor.execute("""
                UPDATE sales_transactions 
                SET customer_name = %s, subtotal = %s, vat_amount = %s, total_amount = %s, 
                    discount_amount = %s, discount_pct = %s, notes = %s
                WHERE id = %s;
            """, (customer_name, net_subtotal, vat_amount, total_amount, discount_amount, discount_pct, notes, draft_id))

            cursor.execute("DELETE FROM sales_items WHERE transaction_id = %s;", (draft_id,))
            for v in validated_items:
                cursor.execute("""
                    INSERT INTO sales_items (transaction_id, product_id, quantity, unit_price, total_price)
                    VALUES (%s, %s, %s, %s, %s);
                """, (draft_id, v["product"]["id"], v["quantity"], v["unit_price"], v["total_price"]))

            conn.commit()

            return jsonify({
                "status": "success",
                "message": f"Draft {current['invoice_number']} updated successfully",
                "total_amount": total_amount
            })
    except Exception as e:
        conn.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        conn.close()

@app.route("/api/transactions/drafts/<int:draft_id>", methods=["DELETE"])
@require_role("admin", "sales_personnel", "instructor")
def cancel_draft(draft_id):
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM sales_transactions WHERE id = %s AND status = 'draft';", (draft_id,))
            draft = cursor.fetchone()
            if not draft:
                return jsonify({"status": "error", "message": "Draft not found or already completed"}), 404

            cursor.execute("UPDATE sales_transactions SET status = 'cancelled' WHERE id = %s;", (draft_id,))
            return jsonify({"status": "success", "message": f"Draft {draft['invoice_number']} cancelled"})
    finally:
        conn.close()

# ----------------- POINT OF SALE (POS) & CHECKOUT -----------------
@app.route("/api/pos/products", methods=["GET"])
def get_pos_products():
    """List products that can be sold in the POS (stock_quantity > 0) with photo thumbnails."""
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT p.id, p.sku, p.name, p.brand, c.name as category_name, 
                       p.selling_price, p.stock_quantity, p.status, p.image_url
                FROM products p
                JOIN categories c ON p.category_id = c.id
                WHERE p.stock_quantity > 0
                ORDER BY c.name ASC, p.name ASC;
            """)
            products = cursor.fetchall()
            return jsonify({"status": "success", "products": products})
    finally:
        conn.close()

@app.route("/api/pos/drafts", methods=["GET"])
@require_role("admin", "sales_personnel", "instructor")
def get_pos_eligible_drafts():
    """Get active draft transactions available for checkout in the POS."""
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT t.id, t.invoice_number as reference_number, t.customer_name, 
                       t.subtotal, t.vat_amount, t.total_amount, t.discount_amount, t.discount_pct,
                       t.created_at,
                       (SELECT COUNT(*) FROM sales_items WHERE transaction_id = t.id) as item_count
                FROM sales_transactions t
                WHERE t.status = 'draft'
                ORDER BY t.id DESC;
            """)
            drafts = cursor.fetchall()
            return jsonify({"status": "success", "drafts": drafts})
    finally:
        conn.close()

@app.route("/api/pos/checkout", methods=["POST"])
@require_role("admin", "sales_personnel", "instructor")
def pos_checkout():
    """
    Atomic Point of Sale Checkout:
    - Supports finalizing an existing draft (draft_id) or direct cart checkout.
    - Locks & verifies product stock availability in MySQL.
    - Deducts inventory ONLY upon successful payment.
    - Sets transaction status to 'completed', assigns invoice number INV-YYYYMMDD-XXXX.
    - Updates cashier shift collections atomically.
    - Rolls back on any error.
    """
    user = get_current_user()
    data = request.get_json() or {}
    
    draft_id = data.get("draft_id")
    items = data.get("items", [])
    payment_method = data.get("payment_method", "Cash")
    amount_tendered = float(data.get("amount_tendered", 0))
    customer_name = data.get("customer_name", "Walk-in Customer").strip() or "Walk-in Customer"
    payment_reference = data.get("payment_reference", None)
    discount_pct = float(data.get("discount_pct", 0.0))

    if payment_method not in ["Cash", "Card", "GCash"]:
        return jsonify({"status": "error", "message": "Invalid payment method"}), 400

    conn = get_db_connection()
    try:
        conn.begin()
        with conn.cursor() as cursor:
            validated_items = []
            gross_subtotal = 0.0

            if draft_id:
                # Checkout from existing draft
                cursor.execute("SELECT * FROM sales_transactions WHERE id = %s AND status = 'draft' FOR UPDATE;", (draft_id,))
                draft = cursor.fetchone()
                if not draft:
                    conn.rollback()
                    return jsonify({"status": "error", "message": "Draft not found or already completed"}), 404

                cursor.execute("""
                    SELECT si.product_id, si.quantity, si.unit_price, si.total_price,
                           p.sku, p.name, p.stock_quantity, p.reorder_level
                    FROM sales_items si
                    JOIN products p ON si.product_id = p.id
                    WHERE si.transaction_id = %s FOR UPDATE;
                """, (draft_id,))
                draft_items = cursor.fetchall()

                if not draft_items:
                    conn.rollback()
                    return jsonify({"status": "error", "message": "Draft has no line items"}), 400

                for itm in draft_items:
                    if itm["stock_quantity"] < itm["quantity"]:
                        conn.rollback()
                        return jsonify({
                            "status": "error",
                            "message": f"Insufficient stock for '{itm['name']}'. Requested: {itm['quantity']}, Available: {itm['stock_quantity']}"
                        }), 400

                    gross_subtotal += float(itm["total_price"])
                    validated_items.append({
                        "product_id": itm["product_id"],
                        "name": itm["name"],
                        "sku": itm["sku"],
                        "quantity": itm["quantity"],
                        "unit_price": float(itm["unit_price"]),
                        "total_price": float(itm["total_price"]),
                        "stock_quantity": itm["stock_quantity"],
                        "reorder_level": itm["reorder_level"]
                    })

                discount_amount = float(draft["discount_amount"])
                discount_pct = float(draft["discount_pct"])
                net_subtotal = float(draft["subtotal"])
                vat_amount = float(draft["vat_amount"])
                total_amount = float(draft["total_amount"])
                target_tx_id = draft["id"]

            else:
                # Direct cart checkout
                if not items or len(items) == 0:
                    conn.rollback()
                    return jsonify({"status": "error", "message": "Shopping cart is empty"}), 400

                for itm in items:
                    prod_id = itm.get("product_id")
                    qty = int(itm.get("quantity", 1))
                    if qty <= 0:
                        conn.rollback()
                        return jsonify({"status": "error", "message": "Quantity must be greater than zero"}), 400

                    cursor.execute("SELECT * FROM products WHERE id = %s FOR UPDATE;", (prod_id,))
                    prod = cursor.fetchone()
                    if not prod:
                        conn.rollback()
                        return jsonify({"status": "error", "message": f"Product ID {prod_id} not found"}), 404

                    if prod["stock_quantity"] < qty:
                        conn.rollback()
                        return jsonify({
                            "status": "error",
                            "message": f"Insufficient stock for '{prod['name']}'. Requested: {qty}, Available: {prod['stock_quantity']}"
                        }), 400

                    unit_price = float(prod["selling_price"])
                    line_total = round(unit_price * qty, 2)
                    gross_subtotal += line_total
                    validated_items.append({
                        "product_id": prod["id"],
                        "name": prod["name"],
                        "sku": prod["sku"],
                        "quantity": qty,
                        "unit_price": unit_price,
                        "total_price": line_total,
                        "stock_quantity": prod["stock_quantity"],
                        "reorder_level": prod["reorder_level"]
                    })

                discount_amount = round(gross_subtotal * (discount_pct / 100.0), 2)
                net_subtotal = round(gross_subtotal - discount_amount, 2)
                vat_amount = round(net_subtotal * 0.12, 2)
                total_amount = round(net_subtotal + vat_amount, 2)
                target_tx_id = None

            # Payment validation
            if payment_method == "Cash" and amount_tendered < total_amount:
                conn.rollback()
                return jsonify({
                    "status": "error",
                    "message": f"Amount tendered (PHP {amount_tendered:,.2f}) is less than total amount (PHP {total_amount:,.2f})"
                }), 400

            change_amount = round(max(0.0, amount_tendered - total_amount), 2) if payment_method == "Cash" else 0.0

            cursor.execute("SELECT id FROM shifts WHERE status = 'active' ORDER BY id DESC LIMIT 1;")
            shift_row = cursor.fetchone()
            shift_id = shift_row["id"] if shift_row else None

            final_invoice_num = f"INV-{datetime.datetime.now().strftime('%Y%m%d%H%M%S')}-{secrets.token_hex(2).upper()}"

            if target_tx_id:
                # Update draft to completed
                cursor.execute("""
                    UPDATE sales_transactions 
                    SET invoice_number = %s, user_id = %s, customer_name = %s,
                        amount_tendered = %s, change_amount = %s, payment_method = %s,
                        payment_reference = %s, status = 'completed', shift_id = %s
                    WHERE id = %s;
                """, (final_invoice_num, user["id"], customer_name, amount_tendered, change_amount, payment_method, payment_reference, shift_id, target_tx_id))
            else:
                # Insert completed transaction
                cursor.execute("""
                    INSERT INTO sales_transactions 
                    (invoice_number, user_id, customer_name, subtotal, vat_amount, total_amount, discount_amount, discount_pct, amount_tendered, change_amount, payment_method, payment_reference, status, shift_id)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'completed', %s);
                """, (final_invoice_num, user["id"], customer_name, net_subtotal, vat_amount, total_amount, discount_amount, discount_pct, amount_tendered, change_amount, payment_method, payment_reference, shift_id))
                target_tx_id = cursor.lastrowid

                for v in validated_items:
                    cursor.execute("""
                        INSERT INTO sales_items (transaction_id, product_id, quantity, unit_price, total_price)
                        VALUES (%s, %s, %s, %s, %s);
                    """, (target_tx_id, v["product_id"], v["quantity"], v["unit_price"], v["total_price"]))

            # ATOMICALLY DEDUCT INVENTORY & RECORD MOVEMENTS
            for v in validated_items:
                new_stock = v["stock_quantity"] - v["quantity"]
                new_status = "out_of_stock" if new_stock == 0 else ("low_stock" if new_stock <= v["reorder_level"] else "in_stock")
                cursor.execute("""
                    UPDATE products 
                    SET stock_quantity = %s, status = %s
                    WHERE id = %s;
                """, (new_stock, new_status, v["product_id"]))

                ref_mov = f"MOV-{final_invoice_num}-{v['product_id']}"
                cursor.execute("""
                    INSERT INTO inventory_movements (reference_number, product_id, movement_type, quantity, previous_stock, new_stock, reason, user_id)
                    VALUES (%s, %s, 'sale', %s, %s, %s, %s, %s);
                """, (ref_mov, v["product_id"], -v["quantity"], v["stock_quantity"], new_stock, f"POS Sale: {final_invoice_num}", user["id"]))

            # Update active shift
            if shift_id:
                col_name = "cash_sales" if payment_method == "Cash" else ("card_sales" if payment_method == "Card" else "gcash_sales")
                cursor.execute(f"""
                    UPDATE shifts 
                    SET total_sales = total_sales + %s,
                        total_transactions = total_transactions + 1,
                        {col_name} = {col_name} + %s
                    WHERE id = %s;
                """, (total_amount, total_amount, shift_id))

            cursor.execute("""
                INSERT INTO activity_logs (user_id, action, details)
                VALUES (%s, 'POS_CHECKOUT', %s);
            """, (user["id"], f"Completed checkout {final_invoice_num} for PHP {total_amount:,.2f} via {payment_method}"))

            conn.commit()

            receipt = {
                "transaction_id": target_tx_id,
                "invoice_number": final_invoice_num,
                "created_at": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "cashier": user["full_name"],
                "customer_name": customer_name,
                "payment_method": payment_method,
                "payment_reference": payment_reference,
                "gross_subtotal": gross_subtotal,
                "discount_amount": discount_amount,
                "discount_pct": discount_pct,
                "subtotal": net_subtotal,
                "vat_rate": "12%",
                "vat_amount": vat_amount,
                "total_amount": total_amount,
                "amount_tendered": amount_tendered,
                "change_amount": change_amount,
                "items": [{
                    "sku": v["sku"],
                    "name": v["name"],
                    "quantity": v["quantity"],
                    "unit_price": v["unit_price"],
                    "total_price": v["total_price"]
                } for v in validated_items]
            }

            return jsonify({
                "status": "success",
                "message": "Payment confirmed and checkout completed successfully",
                "receipt": receipt
            }), 201

    except Exception as e:
        conn.rollback()
        return jsonify({"status": "error", "message": f"Checkout failed: {str(e)}"}), 500
    finally:
        conn.close()

# ----------------- SALES HISTORY & SHIFTS -----------------
@app.route("/api/sales", methods=["GET"])
def get_sales_history():
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT t.id, t.invoice_number, t.customer_name, t.subtotal, t.vat_amount, 
                       t.total_amount, t.discount_amount, t.discount_pct, t.payment_method, 
                       t.status, t.created_at, u.full_name as cashier,
                       (SELECT COUNT(*) FROM sales_items WHERE transaction_id = t.id) as item_count
                FROM sales_transactions t
                JOIN users u ON t.user_id = u.id
                WHERE t.status = 'completed'
                ORDER BY t.id DESC
                LIMIT 100;
            """)
            transactions = cursor.fetchall()
            return jsonify({"status": "success", "transactions": transactions})
    finally:
        conn.close()

@app.route("/api/sales/<int:tx_id>/receipt", methods=["GET"])
def get_receipt(tx_id):
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT t.*, u.full_name as cashier
                FROM sales_transactions t
                JOIN users u ON t.user_id = u.id
                WHERE t.id = %s;
            """, (tx_id,))
            tx = cursor.fetchone()
            if not tx:
                return jsonify({"status": "error", "message": "Transaction not found"}), 404

            cursor.execute("""
                SELECT si.quantity, si.unit_price, si.total_price, p.sku, p.name, p.image_url
                FROM sales_items si
                JOIN products p ON si.product_id = p.id
                WHERE si.transaction_id = %s;
            """, (tx_id,))
            items = cursor.fetchall()
            tx["items"] = items

            return jsonify({"status": "success", "receipt": tx})
    finally:
        conn.close()

@app.route("/api/sales/shift/current", methods=["GET"])
def get_current_shift():
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM shifts WHERE status = 'active' ORDER BY id DESC LIMIT 1;")
            shift = cursor.fetchone()
            return jsonify({"status": "success", "shift": shift})
    finally:
        conn.close()

@app.route("/api/sales/shift/close", methods=["POST"])
@require_role("admin", "sales_personnel")
def close_shift():
    user = get_current_user()
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM shifts WHERE status = 'active' ORDER BY id DESC LIMIT 1;")
            shift = cursor.fetchone()
            if not shift:
                return jsonify({"status": "error", "message": "No active shift found"}), 400

            cursor.execute("UPDATE shifts SET status = 'closed', end_time = NOW() WHERE id = %s;", (shift["id"],))
            cursor.execute("""
                INSERT INTO activity_logs (user_id, action, details)
                VALUES (%s, 'CLOSE_SHIFT', %s);
            """, (user["id"], f"Closed Shift #{shift['id']} with Total Sales PHP {shift['total_sales']:,.2f}"))

            return jsonify({"status": "success", "message": f"Shift #{shift['id']} successfully closed."})
    finally:
        conn.close()

@app.route("/api/sales/shift/open", methods=["POST"])
@require_role("admin", "sales_personnel")
def open_shift():
    user = get_current_user()
    data = request.get_json() or {}
    starting_cash = float(data.get("starting_cash", 3000.00))

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT id FROM shifts WHERE status = 'active' LIMIT 1;")
            if cursor.fetchone():
                return jsonify({"status": "error", "message": "An active shift is already open"}), 400

            cursor.execute("""
                INSERT INTO shifts (user_id, start_time, starting_cash, status)
                VALUES (%s, NOW(), %s, 'active');
            """, (user["id"], starting_cash))
            shift_id = cursor.lastrowid

            cursor.execute("""
                INSERT INTO activity_logs (user_id, action, details)
                VALUES (%s, 'OPEN_SHIFT', %s);
            """, (user["id"], f"Opened Shift #{shift_id} with starting cash PHP {starting_cash:,.2f}"))

            return jsonify({"status": "success", "message": f"Shift #{shift_id} started successfully", "shift_id": shift_id})
    finally:
        conn.close()

# ----------------- SUPPLIERS & PURCHASING MANAGEMENT -----------------
@app.route("/api/purchasing/dashboard", methods=["GET"])
@require_role("admin", "inventory_clerk", "instructor")
def get_purchasing_dashboard():
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT COUNT(*) as count FROM suppliers WHERE status = 'active';")
            active_suppliers = cursor.fetchone()["count"]

            cursor.execute("SELECT COUNT(*) as count FROM purchase_orders WHERE status IN ('Pending', 'Ordered');")
            pending_orders = cursor.fetchone()["count"]

            cursor.execute("SELECT COUNT(*) as count FROM purchase_orders WHERE status = 'Ordered';")
            awaiting_delivery = cursor.fetchone()["count"]

            cursor.execute("SELECT COALESCE(SUM(total_amount), 0) as total_val FROM purchase_orders WHERE status != 'Cancelled';")
            total_purchasing_val = float(cursor.fetchone()["total_val"])

            # Recently received stock
            cursor.execute("""
                SELECT r.receiving_number, r.created_at, po.po_number, s.name as supplier_name, 
                       u.full_name as received_by,
                       (SELECT COUNT(*) FROM stock_receiving_items WHERE receiving_id = r.id) as item_count,
                       (SELECT SUM(quantity_received) FROM stock_receiving_items WHERE receiving_id = r.id) as total_qty
                FROM stock_receiving_records r
                JOIN purchase_orders po ON r.purchase_order_id = po.id
                JOIN suppliers s ON po.supplier_id = s.id
                JOIN users u ON r.received_by = u.id
                ORDER BY r.id DESC
                LIMIT 5;
            """)
            recent_receipts = cursor.fetchall()

            # Low stock products requiring replenishment
            cursor.execute("""
                SELECT p.id, p.sku, p.name, p.brand, c.name as category, p.stock_quantity, p.reorder_level, p.cost_price, p.image_url
                FROM products p
                JOIN categories c ON p.category_id = c.id
                WHERE p.stock_quantity <= p.reorder_level
                ORDER BY p.stock_quantity ASC
                LIMIT 8;
            """)
            low_stock_replenish = cursor.fetchall()

            return jsonify({
                "status": "success",
                "data": {
                    "active_suppliers": active_suppliers,
                    "pending_orders": pending_orders,
                    "awaiting_delivery": awaiting_delivery,
                    "total_purchasing_value": total_purchasing_val,
                    "recent_receipts": recent_receipts,
                    "low_stock_replenish": low_stock_replenish
                }
            })
    finally:
        conn.close()

@app.route("/api/suppliers", methods=["GET"])
def get_suppliers():
    search = request.args.get("search", "").strip()
    status = request.args.get("status")

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            query = """
                SELECT s.*, 
                       (SELECT COUNT(*) FROM purchase_orders WHERE supplier_id = s.id) as total_orders,
                       (SELECT COALESCE(SUM(total_amount), 0) FROM purchase_orders WHERE supplier_id = s.id AND status != 'Cancelled') as total_spend
                FROM suppliers s
                WHERE 1=1
            """
            params = []
            if search:
                query += " AND (s.name LIKE %s OR s.contact_person LIKE %s OR s.email LIKE %s)"
                term = f"%{search}%"
                params.extend([term, term, term])
            if status:
                query += " AND s.status = %s"
                params.append(status)

            query += " ORDER BY s.name ASC;"
            cursor.execute(query, params)
            suppliers = cursor.fetchall()
            return jsonify({"status": "success", "suppliers": suppliers})
    finally:
        conn.close()

@app.route("/api/suppliers", methods=["POST"])
@require_role("admin", "inventory_clerk")
def create_supplier():
    data = request.get_json() or {}
    name = data.get("name", "").strip()
    contact_person = data.get("contact_person", "").strip()
    email = data.get("email", "").strip()
    phone = data.get("phone", "").strip()
    address = data.get("address", "").strip()
    supplied_categories = data.get("supplied_categories", "").strip()

    if not name:
        return jsonify({"status": "error", "message": "Supplier name is required"}), 400

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT id FROM suppliers WHERE name = %s;", (name,))
            if cursor.fetchone():
                return jsonify({"status": "error", "message": f"Supplier '{name}' already exists"}), 400

            cursor.execute("""
                INSERT INTO suppliers (name, contact_person, email, phone, address, supplied_categories, status)
                VALUES (%s, %s, %s, %s, %s, %s, 'active');
            """, (name, contact_person, email, phone, address, supplied_categories))
            return jsonify({"status": "success", "message": "Supplier added successfully"}), 201
    finally:
        conn.close()

@app.route("/api/suppliers/<int:sid>", methods=["PUT"])
@require_role("admin", "inventory_clerk")
def update_supplier(sid):
    data = request.get_json() or {}
    name = data.get("name", "").strip()
    contact_person = data.get("contact_person", "").strip()
    email = data.get("email", "").strip()
    phone = data.get("phone", "").strip()
    address = data.get("address", "").strip()
    supplied_categories = data.get("supplied_categories", "").strip()

    if not name:
        return jsonify({"status": "error", "message": "Supplier name cannot be empty"}), 400

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                UPDATE suppliers 
                SET name = %s, contact_person = %s, email = %s, phone = %s, address = %s, supplied_categories = %s
                WHERE id = %s;
            """, (name, contact_person, email, phone, address, supplied_categories, sid))
            return jsonify({"status": "success", "message": "Supplier updated successfully"})
    finally:
        conn.close()

@app.route("/api/suppliers/<int:sid>/status", methods=["PUT"])
@require_role("admin")
def toggle_supplier_status(sid):
    data = request.get_json() or {}
    new_status = data.get("status")
    if new_status not in ["active", "inactive"]:
        return jsonify({"status": "error", "message": "Status must be active or inactive"}), 400

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("UPDATE suppliers SET status = %s WHERE id = %s;", (new_status, sid))
            return jsonify({"status": "success", "message": f"Supplier status set to {new_status}"})
    finally:
        conn.close()

@app.route("/api/suppliers/<int:sid>/orders", methods=["GET"])
@require_role("admin", "inventory_clerk", "instructor")
def get_supplier_orders(sid):
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT po.*, u.full_name as created_by_name,
                       (SELECT COUNT(*) FROM purchase_order_items WHERE purchase_order_id = po.id) as item_count
                FROM purchase_orders po
                JOIN users u ON po.created_by = u.id
                WHERE po.supplier_id = %s
                ORDER BY po.id DESC;
            """, (sid,))
            orders = cursor.fetchall()
            return jsonify({"status": "success", "orders": orders})
    finally:
        conn.close()

@app.route("/api/purchasing/orders", methods=["GET"])
@require_role("admin", "inventory_clerk", "instructor")
def get_purchase_orders():
    status = request.args.get("status")
    supplier_id = request.args.get("supplier_id")
    search = request.args.get("search", "").strip()

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            query = """
                SELECT po.*, s.name as supplier_name, s.phone as supplier_phone, u.full_name as created_by_name,
                       (SELECT COUNT(*) FROM purchase_order_items WHERE purchase_order_id = po.id) as item_count,
                       (SELECT COALESCE(SUM(quantity_ordered), 0) FROM purchase_order_items WHERE purchase_order_id = po.id) as total_qty_ordered,
                       (SELECT COALESCE(SUM(quantity_received), 0) FROM purchase_order_items WHERE purchase_order_id = po.id) as total_qty_received
                FROM purchase_orders po
                JOIN suppliers s ON po.supplier_id = s.id
                JOIN users u ON po.created_by = u.id
                WHERE 1=1
            """
            params = []
            if status:
                query += " AND po.status = %s"
                params.append(status)
            if supplier_id:
                query += " AND po.supplier_id = %s"
                params.append(supplier_id)
            if search:
                query += " AND (po.po_number LIKE %s OR s.name LIKE %s)"
                term = f"%{search}%"
                params.extend([term, term])

            query += " ORDER BY po.id DESC;"
            cursor.execute(query, params)
            orders = cursor.fetchall()
            return jsonify({"status": "success", "orders": orders})
    finally:
        conn.close()

@app.route("/api/purchasing/orders/<int:po_id>", methods=["GET"])
@require_role("admin", "inventory_clerk", "instructor")
def get_purchase_order_detail(po_id):
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT po.*, s.name as supplier_name, s.contact_person, s.phone as supplier_phone, s.email as supplier_email,
                       u.full_name as created_by_name
                FROM purchase_orders po
                JOIN suppliers s ON po.supplier_id = s.id
                JOIN users u ON po.created_by = u.id
                WHERE po.id = %s;
            """, (po_id,))
            order = cursor.fetchone()
            if not order:
                return jsonify({"status": "error", "message": "Purchase order not found"}), 404

            cursor.execute("""
                SELECT poi.*, p.sku, p.name, p.brand, p.image_url, p.stock_quantity as current_inventory
                FROM purchase_order_items poi
                JOIN products p ON poi.product_id = p.id
                WHERE poi.purchase_order_id = %s;
            """, (po_id,))
            items = cursor.fetchall()
            order["items"] = items

            # Fetch receiving records for this PO
            cursor.execute("""
                SELECT r.*, u.full_name as received_by_name
                FROM stock_receiving_records r
                JOIN users u ON r.received_by = u.id
                WHERE r.purchase_order_id = %s
                ORDER BY r.id DESC;
            """, (po_id,))
            receipts = cursor.fetchall()
            order["receipts"] = receipts

            return jsonify({"status": "success", "order": order})
    finally:
        conn.close()

@app.route("/api/purchasing/orders", methods=["POST"])
@require_role("admin", "inventory_clerk")
def create_purchase_order():
    user = get_current_user()
    data = request.get_json() or {}

    supplier_id = data.get("supplier_id")
    expected_delivery_date = data.get("expected_delivery_date")
    notes = data.get("notes", "").strip()
    status = data.get("status", "Pending")
    items = data.get("items", [])

    if not supplier_id or not items:
        return jsonify({"status": "error", "message": "Supplier and at least one item are required"}), 400

    conn = get_db_connection()
    try:
        conn.begin()
        with conn.cursor() as cursor:
            total_amount = 0.0
            validated_items = []

            for itm in items:
                prod_id = itm.get("product_id")
                qty = int(itm.get("quantity_ordered", 0))
                cost = float(itm.get("unit_cost", 0.0))

                if qty <= 0:
                    conn.rollback()
                    return jsonify({"status": "error", "message": "Quantity must be greater than zero"}), 400

                cursor.execute("SELECT * FROM products WHERE id = %s;", (prod_id,))
                prod = cursor.fetchone()
                if not prod:
                    conn.rollback()
                    return jsonify({"status": "error", "message": f"Product ID {prod_id} not found"}), 404

                line_total = round(qty * cost, 2)
                total_amount += line_total
                validated_items.append({
                    "product_id": prod_id,
                    "quantity_ordered": qty,
                    "unit_cost": cost,
                    "total_cost": line_total
                })

            po_num = f"PO-{datetime.datetime.now().strftime('%Y%m%d%H%M%S')}-{secrets.token_hex(2).upper()}"

            cursor.execute("""
                INSERT INTO purchase_orders 
                (po_number, supplier_id, created_by, status, total_amount, expected_delivery_date, notes)
                VALUES (%s, %s, %s, %s, %s, %s, %s);
            """, (po_num, supplier_id, user["id"], status, total_amount, expected_delivery_date or None, notes))
            po_id = cursor.lastrowid

            for v in validated_items:
                cursor.execute("""
                    INSERT INTO purchase_order_items (purchase_order_id, product_id, quantity_ordered, unit_cost, total_cost)
                    VALUES (%s, %s, %s, %s, %s);
                """, (po_id, v["product_id"], v["quantity_ordered"], v["unit_cost"], v["total_cost"]))

            cursor.execute("""
                INSERT INTO activity_logs (user_id, action, details)
                VALUES (%s, 'CREATE_PURCHASE_ORDER', %s);
            """, (user["id"], f"Created Purchase Order {po_num} for PHP {total_amount:,.2f}"))

            conn.commit()

            return jsonify({
                "status": "success",
                "message": f"Purchase order {po_num} created successfully",
                "po_id": po_id,
                "po_number": po_num
            }), 201
    except Exception as e:
        conn.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        conn.close()

@app.route("/api/purchasing/orders/<int:po_id>/status", methods=["PUT"])
@require_role("admin", "inventory_clerk")
def update_po_status(po_id):
    user = get_current_user()
    data = request.get_json() or {}
    new_status = data.get("status")

    if new_status not in ["Draft", "Pending", "Ordered", "Cancelled"]:
        return jsonify({"status": "error", "message": "Invalid status update"}), 400

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("UPDATE purchase_orders SET status = %s WHERE id = %s;", (new_status, po_id))
            cursor.execute("""
                INSERT INTO activity_logs (user_id, action, details)
                VALUES (%s, 'UPDATE_PO_STATUS', %s);
            """, (user["id"], f"Updated PO ID {po_id} status to {new_status}"))
            return jsonify({"status": "success", "message": f"PO status updated to {new_status}"})
    finally:
        conn.close()

@app.route("/api/purchasing/orders/<int:po_id>/receive", methods=["POST"])
@require_role("admin", "inventory_clerk")
def receive_po_stock(po_id):
    """
    Atomic Stock Receiving:
    - Verifies received quantities do not exceed outstanding order quantities.
    - Saves receiving records and stock movement history.
    - Updates inventory only for quantities actually received.
    - Sets PO status to Partially Received or Received.
    - Prevents duplicate additions using MySQL transactions.
    """
    user = get_current_user()
    data = request.get_json() or {}

    received_items = data.get("items", []) # [{ product_id, quantity_received }]
    notes = data.get("notes", "Warehouse delivery inspection").strip()

    if not received_items:
        return jsonify({"status": "error", "message": "No items specified for receiving"}), 400

    conn = get_db_connection()
    try:
        conn.begin()
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM purchase_orders WHERE id = %s FOR UPDATE;", (po_id,))
            po = cursor.fetchone()
            if not po:
                conn.rollback()
                return jsonify({"status": "error", "message": "Purchase order not found"}), 404

            if po["status"] in ["Received", "Cancelled"]:
                conn.rollback()
                return jsonify({"status": "error", "message": f"Cannot receive against an order in '{po['status']}' status"}), 400

            rcv_num = f"RCV-{datetime.datetime.now().strftime('%Y%m%d%H%M%S')}-{secrets.token_hex(2).upper()}"
            cursor.execute("""
                INSERT INTO stock_receiving_records (receiving_number, purchase_order_id, received_by, notes)
                VALUES (%s, %s, %s, %s);
            """, (rcv_num, po_id, user["id"], notes))
            rcv_id = cursor.lastrowid

            total_received_count = 0

            for itm in received_items:
                prod_id = itm.get("product_id")
                qty_to_receive = int(itm.get("quantity_received", 0))

                if qty_to_receive <= 0:
                    continue

                cursor.execute("""
                    SELECT * FROM purchase_order_items 
                    WHERE purchase_order_id = %s AND product_id = %s FOR UPDATE;
                """, (po_id, prod_id))
                po_item = cursor.fetchone()
                if not po_item:
                    conn.rollback()
                    return jsonify({"status": "error", "message": f"Product {prod_id} is not part of this purchase order"}), 400

                outstanding = po_item["quantity_ordered"] - po_item["quantity_received"]
                if qty_to_receive > outstanding:
                    conn.rollback()
                    return jsonify({
                        "status": "error",
                        "message": f"Received quantity ({qty_to_receive}) exceeds outstanding quantity ({outstanding}) for product {prod_id}"
                    }), 400

                # 1. Update purchase_order_items received count
                new_poi_received = po_item["quantity_received"] + qty_to_receive
                cursor.execute("""
                    UPDATE purchase_order_items 
                    SET quantity_received = %s 
                    WHERE id = %s;
                """, (new_poi_received, po_item["id"]))

                # 2. Record receiving item
                cursor.execute("""
                    INSERT INTO stock_receiving_items (receiving_id, product_id, quantity_received, unit_cost)
                    VALUES (%s, %s, %s, %s);
                """, (rcv_id, prod_id, qty_to_receive, po_item["unit_cost"]))

                # 3. Atomically increment physical product stock
                cursor.execute("SELECT * FROM products WHERE id = %s FOR UPDATE;", (prod_id,))
                prod = cursor.fetchone()
                prev_stock = prod["stock_quantity"]
                new_stock = prev_stock + qty_to_receive
                new_status = "in_stock" if new_stock > prod["reorder_level"] else ("low_stock" if new_stock > 0 else "out_of_stock")

                cursor.execute("""
                    UPDATE products 
                    SET stock_quantity = %s, status = %s 
                    WHERE id = %s;
                """, (new_stock, new_status, prod_id))

                # 4. Record stock movement
                ref_mov = f"MOV-{rcv_num}-{prod_id}"
                cursor.execute("""
                    INSERT INTO inventory_movements (reference_number, product_id, movement_type, quantity, previous_stock, new_stock, reason, supplier_id, user_id)
                    VALUES (%s, %s, 'stock_in', %s, %s, %s, %s, %s, %s);
                """, (ref_mov, prod_id, qty_to_receive, prev_stock, new_stock, f"PO Receiving: {rcv_num} (PO: {po['po_number']})", po["supplier_id"], user["id"]))

                total_received_count += qty_to_receive

            if total_received_count == 0:
                conn.rollback()
                return jsonify({"status": "error", "message": "No valid positive quantities to receive"}), 400

            # 5. Check if entire PO is now fully received
            cursor.execute("""
                SELECT COUNT(*) as unfulfilled
                FROM purchase_order_items
                WHERE purchase_order_id = %s AND quantity_received < quantity_ordered;
            """, (po_id,))
            unfulfilled = cursor.fetchone()["unfulfilled"]

            new_po_status = "Received" if unfulfilled == 0 else "Partially Received"
            cursor.execute("UPDATE purchase_orders SET status = %s WHERE id = %s;", (new_po_status, po_id))

            cursor.execute("""
                INSERT INTO activity_logs (user_id, action, details)
                VALUES (%s, 'RECEIVE_STOCK', %s);
            """, (user["id"], f"Received {total_received_count} units on {rcv_num} for PO {po['po_number']} (Status: {new_po_status})"))

            conn.commit()

            return jsonify({
                "status": "success",
                "message": f"Successfully received {total_received_count} units into warehouse inventory",
                "receiving_number": rcv_num,
                "po_status": new_po_status
            })

    except Exception as e:
        conn.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        conn.close()

# ----------------- BUSINESS REPORTS & ANALYTICS (PURE OPERATIONAL, NO ML) -----------------
@app.route("/api/reports/analytics", methods=["GET"])
@require_role("admin", "instructor")
def get_reports_analytics():
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            # Sales history summary
            cursor.execute("""
                SELECT DATE(created_at) as sale_date, COUNT(*) as tx_count, 
                       SUM(subtotal) as net_sales, SUM(vat_amount) as total_vat, 
                       SUM(total_amount) as gross_sales
                FROM sales_transactions
                WHERE status = 'completed' AND created_at >= DATE_SUB(CURDATE(), INTERVAL 14 DAY)
                GROUP BY DATE(created_at)
                ORDER BY sale_date ASC;
            """)
            daily_sales_trend = cursor.fetchall()

            # Best-selling products based on actual sales
            cursor.execute("""
                SELECT p.id, p.name, p.sku, p.image_url, c.name as category,
                       COALESCE(SUM(si.quantity), 0) as units_sold, 
                       COALESCE(SUM(si.total_price), 0) as revenue
                FROM sales_items si
                JOIN products p ON si.product_id = p.id
                JOIN categories c ON p.category_id = c.id
                JOIN sales_transactions st ON si.transaction_id = st.id
                WHERE st.status = 'completed'
                GROUP BY p.id, p.name, p.sku, p.image_url, c.name
                ORDER BY units_sold DESC
                LIMIT 8;
            """)
            best_sellers = cursor.fetchall()

            # Slow-moving products (business rule: stock > 0, low velocity / days in stock)
            cursor.execute("""
                SELECT p.id, p.sku, p.name, p.brand, c.name as category, p.stock_quantity, 
                       p.cost_price, p.selling_price, p.image_url,
                       COALESCE((SELECT SUM(si.quantity) FROM sales_items si JOIN sales_transactions st ON si.transaction_id = st.id WHERE si.product_id = p.id AND st.status = 'completed'), 0) as total_sold
                FROM products p
                JOIN categories c ON p.category_id = c.id
                WHERE p.stock_quantity > 0
                HAVING total_sold <= 2
                ORDER BY p.stock_quantity DESC
                LIMIT 8;
            """)
            slow_moving = cursor.fetchall()

            # Inventory Valuation
            cursor.execute("""
                SELECT COUNT(*) as total_items,
                       COALESCE(SUM(stock_quantity), 0) as total_units,
                       COALESCE(SUM(stock_quantity * cost_price), 0) as total_cost,
                       COALESCE(SUM(stock_quantity * selling_price), 0) as total_retail
                FROM products;
            """)
            inv_valuation = cursor.fetchone()
            total_cost = float(inv_valuation["total_cost"] or 0)
            total_retail = float(inv_valuation["total_retail"] or 0)
            potential_margin = round(total_retail - total_cost, 2)

            # VAT & Tax Summary
            cursor.execute("""
                SELECT COALESCE(SUM(subtotal), 0) as taxable_sales,
                       COALESCE(SUM(vat_amount), 0) as output_vat,
                       COALESCE(SUM(total_amount), 0) as gross_collections
                FROM sales_transactions
                WHERE status = 'completed';
            """)
            vat_summary = cursor.fetchone()

            # Purchasing & Supplier Spend
            cursor.execute("""
                SELECT s.name as supplier_name, COUNT(po.id) as order_count,
                       COALESCE(SUM(po.total_amount), 0) as total_spent
                FROM suppliers s
                JOIN purchase_orders po ON s.id = po.supplier_id
                WHERE po.status != 'Cancelled'
                GROUP BY s.id, s.name
                ORDER BY total_spent DESC;
            """)
            supplier_spend = cursor.fetchall()

            return jsonify({
                "status": "success",
                "data": {
                    "daily_sales_trend": daily_sales_trend,
                    "best_sellers": best_sellers,
                    "slow_moving": slow_moving,
                    "inventory_valuation": {
                        "total_items": inv_valuation["total_items"],
                        "total_units": inv_valuation["total_units"],
                        "total_cost": total_cost,
                        "total_retail": total_retail,
                        "potential_margin": potential_margin
                    },
                    "vat_summary": {
                        "taxable_sales": float(vat_summary["taxable_sales"]),
                        "output_vat": float(vat_summary["output_vat"]),
                        "gross_collections": float(vat_summary["gross_collections"]),
                        "vat_rate": "12%"
                    },
                    "supplier_spend": supplier_spend
                }
            })
    finally:
        conn.close()

# ----------------- USER MANAGEMENT (ADMIN ONLY) -----------------
@app.route("/api/users", methods=["GET"])
@require_role("admin", "instructor")
def get_users():
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT id, username, full_name, email, role, status, created_at, last_login
                FROM users
                ORDER BY id ASC;
            """)
            users = cursor.fetchall()
            return jsonify({"status": "success", "users": users})
    finally:
        conn.close()

@app.route("/api/users", methods=["POST"])
@require_role("admin")
def create_user():
    admin = get_current_user()
    data = request.get_json() or {}
    
    username = data.get("username", "").strip()
    full_name = data.get("full_name", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    role = data.get("role", "sales_personnel")

    if not username or not full_name or not email or not password:
        return jsonify({"status": "error", "message": "All fields are required"}), 400

    if role not in ["admin", "inventory_clerk", "sales_personnel", "instructor"]:
        return jsonify({"status": "error", "message": "Invalid role specified"}), 400

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT id FROM users WHERE username = %s OR email = %s;", (username, email))
            if cursor.fetchone():
                return jsonify({"status": "error", "message": "Username or email already exists"}), 400

            pw_hash = generate_password_hash(password)
            cursor.execute("""
                INSERT INTO users (username, full_name, email, password_hash, role, status)
                VALUES (%s, %s, %s, %s, %s, 'active');
            """, (username, full_name, email, pw_hash, role))
            user_id = cursor.lastrowid

            cursor.execute("""
                INSERT INTO activity_logs (user_id, action, details)
                VALUES (%s, 'CREATE_USER', %s);
            """, (admin["id"], f"Created user {username} with role {role}"))

            return jsonify({"status": "success", "message": f"User '{username}' created successfully", "user_id": user_id}), 201
    finally:
        conn.close()

@app.route("/api/users/<int:uid>/status", methods=["PUT"])
@require_role("admin")
def toggle_user_status(uid):
    admin = get_current_user()
    if uid == admin["id"]:
        return jsonify({"status": "error", "message": "Cannot deactivate your own admin account"}), 400

    data = request.get_json() or {}
    new_status = data.get("status")
    if new_status not in ["active", "inactive"]:
        return jsonify({"status": "error", "message": "Status must be active or inactive"}), 400

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("UPDATE users SET status = %s WHERE id = %s;", (new_status, uid))
            cursor.execute("""
                INSERT INTO activity_logs (user_id, action, details)
                VALUES (%s, 'UPDATE_USER_STATUS', %s);
            """, (admin["id"], f"Changed user ID {uid} status to {new_status}"))
            return jsonify({"status": "success", "message": f"User status updated to {new_status}"})
    finally:
        conn.close()

@app.route("/api/users/<int:uid>/role", methods=["PUT"])
@require_role("admin")
def update_user_role(uid):
    admin = get_current_user()
    data = request.get_json() or {}
    new_role = data.get("role")
    if new_role not in ["admin", "inventory_clerk", "sales_personnel", "instructor"]:
        return jsonify({"status": "error", "message": "Invalid role"}), 400

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("UPDATE users SET role = %s WHERE id = %s;", (new_role, uid))
            cursor.execute("""
                INSERT INTO activity_logs (user_id, action, details)
                VALUES (%s, 'UPDATE_USER_ROLE', %s);
            """, (admin["id"], f"Updated user ID {uid} role to {new_role}"))
            return jsonify({"status": "success", "message": f"User role updated to {new_role}"})
    finally:
        conn.close()

# ----------------- KNOWLEDGE ANALYSIS & MACHINE LEARNING API -----------------
@app.route("/api/predict", methods=["POST"])
@require_role("admin", "instructor")
def predict_endpoint():
    user = get_current_user()
    data = request.get_json() or {}
    task = data.get("task", "sales")
    algorithm = data.get("algorithm", "random_forest")
    inputs = data.get("inputs", {})

    try:
        prediction = ml_engine.generate_prediction(task, algorithm, inputs, user_id=user["id"] if user else None)
        return jsonify({"status": "success", "prediction": prediction})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400

@app.route("/api/predictions/history", methods=["GET"])
@require_role("admin", "instructor")
def prediction_history_endpoint():
    try:
        history = ml_engine.get_prediction_history(limit=50)
        return jsonify({"status": "success", "history": history})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route("/api/datasets", methods=["GET"])
@require_role("instructor")
def datasets_list_endpoint():
    try:
        datasets = ml_engine.get_datasets_list()
        return jsonify({"status": "success", "datasets": datasets})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route("/api/datasets/<filename>/preview", methods=["GET"])
@require_role("instructor")
def dataset_preview_endpoint(filename):
    page = int(request.args.get("page", 1))
    per_page = int(request.args.get("per_page", 20))
    search = request.args.get("search", "").strip()

    try:
        preview = ml_engine.get_dataset_preview(filename, page=page, per_page=per_page, search=search)
        return jsonify({"status": "success", "preview": preview, **preview})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400

@app.route("/api/datasets/<filename>/download", methods=["GET"])
@require_role("instructor")
def dataset_download_endpoint(filename):
    dataset_dir = os.path.join(os.path.dirname(__file__), "datasets")
    return send_from_directory(dataset_dir, secure_filename(filename), as_attachment=True)

@app.route("/api/models/train", methods=["POST"])
@require_role("instructor")
def train_model_endpoint():
    data = request.get_json() or {}
    task = data.get("task", "sales")
    algorithm = data.get("algorithm", "random_forest")
    test_size = float(data.get("test_size", 0.2))
    hyperparams = data.get("hyperparams", {})

    try:
        result = ml_engine.train_model(task, algorithm=algorithm, test_size=test_size, hyperparams=hyperparams)
        return jsonify({"status": "success", "result": result})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400

@app.route("/api/models/saved", methods=["GET"])
@require_role("instructor")
def saved_models_endpoint():
    try:
        models = ml_engine.get_saved_models_list()
        return jsonify({"status": "success", "models": models})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route("/api/models/compare", methods=["POST"])
@require_role("instructor")
def compare_models_endpoint():
    data = request.get_json() or {}
    task = data.get("task", "sales")

    try:
        comparison = ml_engine.compare_models(task)
        return jsonify({"status": "success", "comparison": comparison})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400

if __name__ == "__main__":
    init_db()
    print("TechAvenue backend server running on port 5000...")
    app.run(host="0.0.0.0", port=5000, debug=True)
