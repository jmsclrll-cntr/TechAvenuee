import os
import pymysql
from pymysql.cursors import DictCursor
from werkzeug.security import generate_password_hash
import datetime

DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "port": int(os.getenv("DB_PORT", 3306)),
    "user": os.getenv("DB_USER", "root"),
    "password": os.getenv("DB_PASSWORD", ""),
    "database": os.getenv("DB_NAME", "tech_avenue"),
    "charset": "utf8mb4",
    "cursorclass": DictCursor,
    "autocommit": True
}

def get_db_connection():
    """Create and return a PyMySQL connection."""
    conn_params = DB_CONFIG.copy()
    db_name = conn_params.pop("database")
    
    try:
        temp_conn = pymysql.connect(**conn_params)
        with temp_conn.cursor() as cursor:
            cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{db_name}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
        temp_conn.close()
    except Exception as e:
        print(f"Notice during db check: {e}")

    return pymysql.connect(**DB_CONFIG)

def init_db():
    """Create all required tables if they don't already exist."""
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            # Users
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                full_name VARCHAR(100) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                role ENUM('inventory_clerk', 'sales_personnel', 'admin', 'instructor') NOT NULL,
                status ENUM('active', 'inactive') DEFAULT 'active',
                avatar VARCHAR(255) NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_login DATETIME NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            """)

            # Categories
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS categories (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                code VARCHAR(20) NOT NULL UNIQUE,
                description TEXT
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            """)

            # Suppliers
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS suppliers (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(150) NOT NULL,
                contact_person VARCHAR(100),
                email VARCHAR(100),
                phone VARCHAR(50),
                address TEXT,
                supplied_categories VARCHAR(255) NULL,
                status ENUM('active', 'inactive') DEFAULT 'active',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            """)

            # Products
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS products (
                id INT AUTO_INCREMENT PRIMARY KEY,
                sku VARCHAR(50) UNIQUE NOT NULL,
                name VARCHAR(200) NOT NULL,
                brand VARCHAR(100) NOT NULL,
                category_id INT NOT NULL,
                cost_price DECIMAL(10,2) NOT NULL,
                selling_price DECIMAL(10,2) NOT NULL,
                stock_quantity INT NOT NULL DEFAULT 0,
                reorder_level INT NOT NULL DEFAULT 5,
                status ENUM('in_stock', 'low_stock', 'out_of_stock') DEFAULT 'in_stock',
                image_url VARCHAR(255) NULL,
                description TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX (category_id),
                INDEX (status),
                INDEX (sku)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            """)

            # Shifts
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS shifts (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
                end_time DATETIME NULL,
                starting_cash DECIMAL(10,2) DEFAULT 3000.00,
                cash_sales DECIMAL(10,2) DEFAULT 0.00,
                card_sales DECIMAL(10,2) DEFAULT 0.00,
                gcash_sales DECIMAL(10,2) DEFAULT 0.00,
                total_sales DECIMAL(10,2) DEFAULT 0.00,
                total_transactions INT DEFAULT 0,
                status ENUM('active', 'closed') DEFAULT 'active'
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            """)

            # Purchase Orders
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS purchase_orders (
                id INT AUTO_INCREMENT PRIMARY KEY,
                po_number VARCHAR(50) UNIQUE NOT NULL,
                supplier_id INT NOT NULL,
                created_by INT NOT NULL,
                status ENUM('Draft', 'Pending', 'Ordered', 'Partially Received', 'Received', 'Cancelled') DEFAULT 'Draft',
                total_amount DECIMAL(12,2) DEFAULT 0.00,
                expected_delivery_date DATE NULL,
                notes TEXT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX (supplier_id),
                INDEX (status),
                INDEX (po_number)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            """)

            # Purchase Order Items
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS purchase_order_items (
                id INT AUTO_INCREMENT PRIMARY KEY,
                purchase_order_id INT NOT NULL,
                product_id INT NOT NULL,
                quantity_ordered INT NOT NULL,
                quantity_received INT NOT NULL DEFAULT 0,
                unit_cost DECIMAL(10,2) NOT NULL,
                total_cost DECIMAL(12,2) NOT NULL,
                INDEX (purchase_order_id),
                INDEX (product_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            """)

            # Stock Receiving Records
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS stock_receiving_records (
                id INT AUTO_INCREMENT PRIMARY KEY,
                receiving_number VARCHAR(50) UNIQUE NOT NULL,
                purchase_order_id INT NOT NULL,
                received_by INT NOT NULL,
                notes TEXT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                INDEX (purchase_order_id),
                INDEX (receiving_number)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            """)

            # Stock Receiving Items
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS stock_receiving_items (
                id INT AUTO_INCREMENT PRIMARY KEY,
                receiving_id INT NOT NULL,
                product_id INT NOT NULL,
                quantity_received INT NOT NULL,
                unit_cost DECIMAL(10,2) NOT NULL,
                INDEX (receiving_id),
                INDEX (product_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            """)

            # Inventory Movements
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS inventory_movements (
                id INT AUTO_INCREMENT PRIMARY KEY,
                reference_number VARCHAR(50) UNIQUE NOT NULL,
                product_id INT NOT NULL,
                movement_type ENUM('stock_in', 'stock_out', 'adjustment', 'sale') NOT NULL,
                quantity INT NOT NULL,
                previous_stock INT NOT NULL,
                new_stock INT NOT NULL,
                reason VARCHAR(255) NULL,
                supplier_id INT NULL,
                user_id INT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                INDEX (product_id),
                INDEX (movement_type),
                INDEX (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            """)

            # Sales Transactions (supporting drafts and completed checkouts)
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS sales_transactions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                invoice_number VARCHAR(50) UNIQUE NOT NULL,
                user_id INT NOT NULL,
                customer_name VARCHAR(100) DEFAULT 'Walk-in Customer',
                subtotal DECIMAL(10,2) NOT NULL,
                vat_amount DECIMAL(10,2) NOT NULL,
                total_amount DECIMAL(10,2) NOT NULL,
                discount_amount DECIMAL(10,2) DEFAULT 0.00,
                discount_pct DECIMAL(5,2) DEFAULT 0.00,
                amount_tendered DECIMAL(10,2) DEFAULT 0.00,
                change_amount DECIMAL(10,2) DEFAULT 0.00,
                payment_method ENUM('Cash', 'Card', 'GCash') NULL,
                payment_reference VARCHAR(100) NULL,
                status ENUM('draft', 'completed', 'refunded', 'cancelled') DEFAULT 'draft',
                shift_id INT NULL,
                notes TEXT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX (user_id),
                INDEX (status),
                INDEX (created_at),
                INDEX (invoice_number)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            """)

            # Sales Items
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS sales_items (
                id INT AUTO_INCREMENT PRIMARY KEY,
                transaction_id INT NOT NULL,
                product_id INT NOT NULL,
                quantity INT NOT NULL,
                unit_price DECIMAL(10,2) NOT NULL,
                total_price DECIMAL(10,2) NOT NULL,
                INDEX (transaction_id),
                INDEX (product_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            """)

            # Activity Logs
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS activity_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                action VARCHAR(100) NOT NULL,
                details TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                INDEX (user_id),
                INDEX (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            """)

            # Models Registry (for Machine Learning workspace)
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS models_registry (
                id INT AUTO_INCREMENT PRIMARY KEY,
                task VARCHAR(100) NOT NULL,
                algorithm VARCHAR(100) NOT NULL,
                model_filename VARCHAR(255) NOT NULL,
                dataset_name VARCHAR(255),
                r2_score FLOAT,
                mae FLOAT,
                mse FLOAT,
                rmse FLOAT,
                test_size FLOAT DEFAULT 0.2,
                n_samples INT,
                trained_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                is_active BOOLEAN DEFAULT TRUE,
                INDEX (task),
                INDEX (algorithm),
                INDEX (is_active)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            """)

            # Predictions History
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS predictions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                task VARCHAR(100) NOT NULL,
                algorithm VARCHAR(100) NOT NULL,
                inputs_json TEXT,
                predicted_value FLOAT NOT NULL,
                confidence_interval VARCHAR(100),
                recommendation TEXT,
                user_id INT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                INDEX (task),
                INDEX (created_at),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            """)

            print("Database tables verified/initialized successfully.")
    finally:
        conn.close()

if __name__ == "__main__":
    init_db()
