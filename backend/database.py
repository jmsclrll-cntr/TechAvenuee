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
            # Product Images
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS product_image (
                id INT AUTO_INCREMENT PRIMARY KEY,
                product_id INT NOT NULL,
                image_url VARCHAR(255) NOT NULL,
                alt_text VARCHAR(200) NULL,
                is_primary BOOLEAN DEFAULT TRUE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                INDEX (product_id),
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            """)
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

            # Seed default users if users table is empty
            cursor.execute("SELECT COUNT(*) AS count FROM users;")
            if cursor.fetchone()["count"] == 0:
                print("Seeding default role-based accounts...")
                default_users = [
                    (
                        "admin",
                        "Carl Cantre",
                        "admin@techavenue.com",
                        generate_password_hash("admin123"),
                        "admin",
                        "active"
                    ),
                    (
                        "clerk",
                        "Maria Santos",
                        "clerk@techavenue.com",
                        generate_password_hash("clerk123"),
                        "inventory_clerk",
                        "active"
                    ),
                    (
                        "sales",
                        "John Reyes",
                        "sales@techavenue.com",
                        generate_password_hash("sales123"),
                        "sales_personnel",
                        "active"
                    ),
                    (
                        "instructor",
                        "Academic Instructor",
                        "instructor@techavenue.com",
                        generate_password_hash("instructor123"),
                        "instructor",
                        "active"
                    )
                ]
                cursor.executemany("""
                    INSERT INTO users (username, full_name, email, password_hash, role, status)
                    VALUES (%s, %s, %s, %s, %s, %s);
                """, default_users)
                print("Default users seeded successfully.")

            # Seed default categories if empty
            cursor.execute("SELECT COUNT(*) AS count FROM categories;")
            if cursor.fetchone()["count"] == 0:
                print("Seeding default categories...")
                categories = [
                    ("Computers & Laptops", "COMP", "Desktop towers, workstations, laptops, and ultrabooks"),
                    ("Keyboards & Input Devices", "KEYBOARD", "Mechanical keyboards, membrane switches, and accessories"),
                    ("Mice & Gaming Peripherals", "MOUSE", "Wireless mice, gaming optical mice, and mousepads"),
                    ("Monitors & Displays", "MONITOR", "IPS, OLED, and curved gaming monitors"),
                    ("Computer Components", "COMP-PARTS", "CPUs, GPUs, RAM, motherboards, and power supplies"),
                    ("Storage & Networking", "STORAGE", "NVMe SSDs, external hard drives, routers, and switches")
                ]
                cursor.executemany("""
                    INSERT INTO categories (name, code, description)
                    VALUES (%s, %s, %s);
                """, categories)
                print("Categories seeded successfully.")

            # Seed default suppliers if empty
            cursor.execute("SELECT COUNT(*) AS count FROM suppliers;")
            if cursor.fetchone()["count"] == 0:
                print("Seeding default suppliers...")
                suppliers = [
                    ("Asus Philippines Distribution", "Michael Chang", "sales@asus-ph.com", "+63 917 123 4567", "Bonifacio Global City, Taguig, Philippines", "COMP, COMP-PARTS, MONITOR", "active"),
                    ("Logitech Regional Hub", "Sarah Lim", "support@logitech-dist.com", "+63 918 555 1234", "Ortigas Center, Pasig City, Philippines", "KEYBOARD, MOUSE", "active"),
                    ("Corsair & Kingston PH Hub", "David Tan", "orders@corsair-ph.com", "+63 920 444 8888", "Quezon City, Metro Manila, Philippines", "COMP-PARTS, STORAGE", "active")
                ]
                cursor.executemany("""
                    INSERT INTO suppliers (name, contact_person, email, phone, address, supplied_categories, status)
                    VALUES (%s, %s, %s, %s, %s, %s, %s);
                """, suppliers)
                print("Suppliers seeded successfully.")

            # Seed default products if empty
            cursor.execute("SELECT COUNT(*) AS count FROM products;")
            if cursor.fetchone()["count"] == 0:
                print("Seeding initial products...")
                cursor.execute("SELECT id, code FROM categories;")
                cat_map = {row["code"]: row["id"] for row in cursor.fetchall()}

                products = [
                    ("PRD-1001", "Avenue Beast Gaming PC (i7/RTX 4070)", "TechAvenue", cat_map.get("COMP", 1), 65000.00, 78999.00, 8, 3, "in_stock", "/products/desktop.svg", "High performance Intel Core i7 14th Gen, RTX 4070 12GB, 32GB DDR5, 1TB NVMe"),
                    ("PRD-1002", "Avenue Slim Ultrabook Laptop 15.6\"", "TechAvenue", cat_map.get("COMP", 1), 38000.00, 46500.00, 15, 5, "in_stock", "/products/laptop.svg", "Intel Core i5, 16GB RAM, 512GB SSD, FHD IPS Display, All-day Battery"),
                    ("PRD-1003", "ApexPro RGB Mechanical Keyboard", "ApexGear", cat_map.get("KEYBOARD", 2), 3200.00, 4499.00, 32, 8, "in_stock", "/products/keyboard.svg", "Hot-swappable tactile switches with customizable per-key RGB backlighting"),
                    ("PRD-1004", "SilentTouch Wireless Keyboard", "LogiTech", cat_map.get("KEYBOARD", 2), 1200.00, 1899.00, 24, 6, "in_stock", "/products/keyboard.svg", "Ergonomic low-profile wireless multi-device keyboard with quiet membrane switches"),
                    ("PRD-1005", "ViperStrike Wireless Gaming Mouse", "Razer", cat_map.get("MOUSE", 3), 2800.00, 3899.00, 20, 5, "in_stock", "/products/mouse.svg", "Ultra-lightweight 26,000 DPI optical sensor with 80-hour rechargeable battery"),
                    ("PRD-1006", "UltraView 27\" 165Hz IPS Gaming Monitor", "Asus", cat_map.get("MONITOR", 4), 11500.00, 14999.00, 12, 4, "in_stock", "/products/monitor.svg", "2560x1440 QHD 165Hz 1ms response time, HDR400, G-Sync Compatible"),
                    ("PRD-1007", "Intel Core i7-14700K Desktop Processor", "Intel", cat_map.get("COMP-PARTS", 5), 21000.00, 25500.00, 10, 3, "in_stock", "/products/cpu.svg", "20 cores (8 P-cores + 12 E-cores) up to 5.6 GHz turbo boost unlocked"),
                    ("PRD-1008", "NVIDIA GeForce RTX 4070 Super 12GB", "Asus", cat_map.get("COMP-PARTS", 5), 36000.00, 42999.00, 6, 2, "in_stock", "/products/gpu.svg", "Ada Lovelace architecture, DLSS 3.5, 12GB GDDR6X, Triple Fan cooling"),
                    ("PRD-1009", "Vengeance RGB 32GB (2x16GB) DDR5 6000MHz", "Corsair", cat_map.get("COMP-PARTS", 5), 5800.00, 7499.00, 18, 5, "in_stock", "/products/ram.svg", "High performance overclocked DDR5 memory with ten-zone RGB lighting"),
                    ("PRD-1010", "Samsung 990 PRO 2TB PCIe 4.0 NVMe SSD", "Samsung", cat_map.get("STORAGE", 6), 7900.00, 10299.00, 14, 4, "in_stock", "/products/storage.svg", "Up to 7,450 MB/s sequential read and 6,900 MB/s write speed"),
                    ("PRD-1011", "Archer AX73 WiFi 6 Gigabit Router", "TP-Link", cat_map.get("STORAGE", 6), 4200.00, 5699.00, 9, 3, "in_stock", "/products/router.svg", "Dual-Band 6-stream Gigabit Wi-Fi 6 up to 5400 Mbps with 6 external antennas")
                ]
                cursor.executemany("""
                    INSERT INTO products (sku, name, brand, category_id, cost_price, selling_price, stock_quantity, reorder_level, status, image_url, description)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
                """, products)
                print("Products seeded successfully.")

            # Sync and seed specific photos into product_image table
            image_map = {
                "PRD-1001": ("/products/beast-gaming-pc.svg", "Avenue Beast Gaming PC Tower Chassis with RGB Liquid Cooling"),
                "PRD-1002": ("/products/slim-ultrabook-laptop.svg", "Avenue Slim Ultrabook Laptop 15.6 inch IPS Screen"),
                "PRD-1003": ("/products/apexpro-rgb-keyboard.svg", "ApexPro RGB Hot-Swap Mechanical Keyboard"),
                "PRD-1004": ("/products/silenttouch-keyboard.svg", "SilentTouch Ergonomic Low Profile Wireless Keyboard"),
                "PRD-1005": ("/products/viperstrike-mouse.svg", "ViperStrike Lightweight Optical Sensor Gaming Mouse"),
                "PRD-1006": ("/products/ultraview-monitor.svg", "UltraView 27 inch 165Hz QHD IPS Curved Monitor"),
                "PRD-1007": ("/products/intel-i7-processor.svg", "Intel Core i7-14700K 20-Core Unlocked Desktop Processor"),
                "PRD-1008": ("/products/rtx-4070-super.svg", "NVIDIA GeForce RTX 4070 Super 12GB Gaming Graphics Card"),
                "PRD-1009": ("/products/vengeance-ddr5-ram.svg", "Corsair Vengeance RGB 32GB (2x16GB) DDR5 6000MHz Memory"),
                "PRD-1010": ("/products/samsung-990-pro-ssd.svg", "Samsung 990 PRO 2TB PCIe 4.0 NVMe M.2 SSD"),
                "PRD-1011": ("/products/archer-wifi6-router.svg", "TP-Link Archer AX73 WiFi 6 Gigabit 6-Antenna Router")
            }

            cursor.execute("SELECT id, sku FROM products;")
            existing_products = cursor.fetchall()
            for prod in existing_products:
                sku = prod["sku"]
                if sku in image_map:
                    img_url, alt_text = image_map[sku]
                    cursor.execute("UPDATE products SET image_url = %s WHERE id = %s;", (img_url, prod["id"]))
                    cursor.execute("SELECT id FROM product_image WHERE product_id = %s;", (prod["id"],))
                    if not cursor.fetchone():
                        cursor.execute("""
                            INSERT INTO product_image (product_id, image_url, alt_text, is_primary)
                            VALUES (%s, %s, %s, TRUE);
                        """, (prod["id"], img_url, alt_text))
                    else:
                        cursor.execute("""
                            UPDATE product_image SET image_url = %s, alt_text = %s, is_primary = TRUE 
                            WHERE product_id = %s;
                        """, (img_url, alt_text, prod["id"]))
            print("Product images verified and synced into product_image table.")
    finally:
        conn.close()

if __name__ == "__main__":
    init_db()
