import os
import functools
from flask import Flask, jsonify, request

app = Flask(__name__)

# Sample/Hardcoded accounts for backend role enforcement
ACCOUNTS = {
    "admin": {
        "username": "admin",
        "password": "Admin@123",
        "role": "admin",
        "name": "Eleanor Vance"
    },
    "inventory": {
        "username": "inventory",
        "password": "Inventory@123",
        "role": "inventory_clerk",
        "name": "Marcus Brody"
    },
    "sales": {
        "username": "sales",
        "password": "Sales@123",
        "role": "sales_personnel",
        "name": "Maria Santos"
    },
    "instructor": {
        "username": "instructor",
        "password": "Instructor@123",
        "role": "instructor",
        "name": "Prof. Gabriel Reyes"
    }
}

# Role-based Authorization Decorator
def require_roles(*allowed_roles):
    def decorator(fn):
        @functools.wraps(fn)
        def wrapper(*args, **kwargs):
            # Check Authorization or Role header
            role = request.headers.get("X-User-Role")
            if not role:
                return jsonify({"status": "error", "message": "Unauthorized. Role header required."}), 401
            
            if role not in allowed_roles:
                return jsonify({
                    "status": "error",
                    "message": f"Access denied. Role '{role}' does not have permission for this resource."
                }), 403
            return fn(*args, **kwargs)
        return wrapper
    return decorator

# Basic Health Check (Preserved)
@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "status": "success",
        "message": "TechAvenue backend is running",
        "version": "1.0.0"
    })

# Authentication
@app.route("/api/auth/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    username = data.get("username", "").strip()
    password = data.get("password", "").strip()

    user = ACCOUNTS.get(username)
    if user and user["password"] == password:
        return jsonify({
            "status": "success",
            "message": "Authentication successful",
            "user": {
                "username": user["username"],
                "role": user["role"],
                "name": user["name"]
            }
        })
    return jsonify({"status": "error", "message": "Invalid username or password"}), 401

# Inventory Clerk & Admin Endpoint
@app.route("/api/inventory/summary", methods=["GET"])
@require_roles("inventory_clerk", "admin")
def inventory_summary():
    return jsonify({
        "status": "success",
        "total_products": 1428,
        "total_units": 14850,
        "low_stock_count": 12,
        "out_of_stock_count": 3,
        "inventory_value": 4820500.00
    })

# Sales Personnel & Admin Endpoint
@app.route("/api/sales/summary", methods=["GET"])
@require_roles("sales_personnel", "admin")
def sales_summary():
    return jsonify({
        "status": "success",
        "sales_today": 58450.00,
        "transactions_today": 34,
        "average_basket": 1719.12,
        "items_sold_today": 86
    })

# Predictions (Admin and Instructor)
@app.route("/api/predictions/demand", methods=["POST"])
@require_roles("admin", "instructor")
def predict_demand():
    data = request.get_json(silent=True) or {}
    product = data.get("product", "NVIDIA RTX 4070 Ti Super")
    model = data.get("model", "Random Forest")
    return jsonify({
        "status": "success",
        "product": product,
        "model_used": model,
        "forecast_period": "Next 30 Days",
        "predicted_demand": 198,
        "trend_percentage": "+18.5%",
        "business_recommendation": "Restock minimum 50 units before Nov 10 to satisfy expected holiday demand."
    })

# Instructor-Only Endpoints (Strictly 403 Forbidden for Admin / Sales / Clerk)
@app.route("/api/knowledge/metrics", methods=["GET"])
@require_roles("instructor")
def instructor_metrics():
    return jsonify({
        "status": "success",
        "models": {
            "simple_linear_regression": {
                "mae": 14.2,
                "rmse": 18.5,
                "r2": 0.812
            },
            "random_forest_regression": {
                "mae": 7.8,
                "rmse": 10.4,
                "r2": 0.914
            }
        },
        "evaluation_date": "2026-10-28",
        "test_split_ratio": 0.20
    })

@app.route("/api/knowledge/datasets", methods=["GET"])
@require_roles("instructor")
def instructor_datasets():
    return jsonify({
        "status": "success",
        "datasets": [
            {"name": "product_demand.csv", "records": 1420, "features": 8},
            {"name": "sales_prediction.csv", "records": 1250, "features": 7},
            {"name": "product_performance.csv", "records": 1080, "features": 6}
        ]
    })

if __name__ == "__main__":
    app.run(debug=True, port=5000)
