import os
import csv
import random
from datetime import datetime, timedelta

random.seed(42)

# Hardware products list
PRODUCTS = [
    ("NVIDIA RTX 4090 OC 24GB", "GPU", "ASUS", 115000),
    ("NVIDIA RTX 4080 Super 16GB", "GPU", "MSI", 68000),
    ("NVIDIA RTX 4070 Ti Super 16GB", "GPU", "Gigabyte", 52000),
    ("NVIDIA RTX 4070 Super 12GB", "GPU", "ZOTAC", 38500),
    ("NVIDIA RTX 4060 Ti 8GB", "GPU", "Palit", 26000),
    ("NVIDIA RTX 4060 Dual OC 8GB", "GPU", "ASUS", 22000),
    ("AMD Radeon RX 7900 XTX 24GB", "GPU", "Sapphire", 62000),
    ("AMD Radeon RX 7800 XT 16GB", "GPU", "PowerColor", 35000),
    ("AMD Ryzen 9 7950X3D", "CPU", "AMD", 38000),
    ("AMD Ryzen 7 7800X3D", "CPU", "AMD", 24500),
    ("AMD Ryzen 5 7600X", "CPU", "AMD", 14500),
    ("Intel Core i9-14900K", "CPU", "Intel", 36000),
    ("Intel Core i7-14700K", "CPU", "Intel", 26500),
    ("Intel Core i5-14600K", "CPU", "Intel", 19000),
    ("Samsung 990 Pro 2TB NVMe", "Storage", "Samsung", 8900),
    ("Samsung 990 Pro 1TB NVMe", "Storage", "Samsung", 5600),
    ("Crucial T700 2TB Gen5 NVMe", "Storage", "Crucial", 14500),
    ("Kingston KC3000 2TB PCIe 4.0", "Storage", "Kingston", 7800),
    ("Kingston Fury Beast 32GB DDR5 6000MHz", "RAM", "Kingston", 6800),
    ("Kingston Fury Beast 16GB DDR5 5600MHz", "RAM", "Kingston", 3450),
    ("Corsair Vengeance RGB 32GB DDR5 6000MHz", "RAM", "Corsair", 7400),
    ("G.Skill Trident Z5 32GB DDR5 6400MHz", "RAM", "G.Skill", 8200),
    ("ASUS ROG Strix B650-A Gaming WiFi", "Motherboard", "ASUS", 16500),
    ("MSI MAG B650 Tomahawk WiFi", "Motherboard", "MSI", 13800),
    ("Gigabyte Z790 AORUS Elite AX", "Motherboard", "Gigabyte", 18500),
    ("Seasonic Focus GX-850W 80+ Gold", "PSU", "Seasonic", 7600),
    ("Seasonic Focus GX-750W 80+ Gold", "PSU", "Seasonic", 6500),
    ("Corsair RM850x 850W 80+ Gold", "PSU", "Corsair", 8200),
    ("Logitech G Pro X Superlight 2", "Peripherals", "Logitech", 7990),
    ("Razer DeathAdder V3 Pro Wireless", "Peripherals", "Razer", 8400),
    ("SteelSeries Apex Pro TKL Mechanical", "Peripherals", "SteelSeries", 11500),
    ("ASUS ROG Swift 27-inch 240Hz OLED", "Monitor", "ASUS", 54000),
]

SUPPLIERS = [
    "TechLink Distribution Inc.",
    "Macro Memory Corp",
    "Global Components Hub",
    "LogiTech Direct PH",
    "Silicon Pacific Supply",
    "Apex Hardware Partners"
]

def generate_product_demand(num_records=1200):
    rows = []
    header = [
        "record_id", "product_id", "product_name", "category", "brand",
        "unit_price", "prev_month_demand", "promotional_event",
        "competitor_price", "stock_level", "units_sold"
    ]
    rows.append(header)
    for i in range(1, num_records + 1):
        prod = random.choice(PRODUCTS)
        name, cat, brand, price = prod
        p_id = f"PRD-{1000 + (i % 80)}"
        prev_demand = random.randint(15, 200)
        promo = 1 if random.random() < 0.28 else 0
        comp_price = round(price * random.uniform(0.92, 1.08), -2)
        stock = random.randint(3, 120)
        # Target: units_sold (influenced by promo, price, previous demand)
        base = prev_demand * random.uniform(0.85, 1.15)
        if promo:
            base *= random.uniform(1.15, 1.40)
        units_sold = max(1, int(base))
        rows.append([
            f"REC-{i:05d}", p_id, name, cat, brand,
            price, prev_demand, promo, int(comp_price), stock, units_sold
        ])
    return rows

def generate_sales_prediction(num_records=1050):
    rows = []
    header = [
        "date", "month", "day_of_week", "foot_traffic",
        "transaction_count", "avg_transaction_value", "marketing_spend",
        "holiday_season", "gross_sales"
    ]
    rows.append(header)
    start_date = datetime(2023, 1, 1)
    for i in range(num_records):
        cur_date = start_date + timedelta(days=i)
        date_str = cur_date.strftime("%Y-%m-%d")
        month = cur_date.month
        dow = cur_date.strftime("%a")
        is_weekend = cur_date.weekday() >= 5
        is_holiday = 1 if month in [11, 12] or (month == 10 and cur_date.day > 20) else 0

        traffic = random.randint(120, 450)
        if is_weekend:
            traffic += random.randint(100, 250)
        if is_holiday:
            traffic = int(traffic * random.uniform(1.2, 1.5))

        conversion_rate = random.uniform(0.18, 0.28)
        tx_count = max(10, int(traffic * conversion_rate))
        avg_basket = round(random.uniform(1200, 2600), 2)
        marketing = round(random.uniform(500, 5000), 2)

        base_sales = tx_count * avg_basket
        if is_holiday:
            base_sales *= random.uniform(1.1, 1.3)
        gross_sales = round(base_sales, 2)

        rows.append([
            date_str, month, dow, traffic, tx_count, avg_basket, marketing, is_holiday, gross_sales
        ])
    return rows

def generate_product_performance(num_records=1100):
    rows = []
    header = [
        "sku", "product_name", "category", "supplier",
        "stock_quantity", "units_sold_90d", "turnover_days",
        "sales_velocity_score", "return_rate", "status", "action_recommendation"
    ]
    rows.append(header)
    for i in range(1, num_records + 1):
        prod = random.choice(PRODUCTS)
        name, cat, brand, price = prod
        sku = f"{cat[:3].upper()}-{brand[:3].upper()}-{1000 + i}"
        supplier = random.choice(SUPPLIERS)
        stock = random.randint(1, 150)
        units_sold = random.randint(0, 350)
        turnover_days = round(random.uniform(5.0, 140.0), 1)
        velocity = round(units_sold / 12.8, 2) # weekly average
        return_rate = f"{round(random.uniform(0.1, 2.5), 2)}%"

        if turnover_days > 75 or units_sold < 15:
            status = "Slow-Moving"
            action = "Clearance Promo / Bundle Discount"
        elif units_sold > 160:
            status = "Best-Seller"
            action = "Increase Purchase Allocation"
        elif stock <= 10:
            status = "Low-Stock Alert"
            action = "Immediate Purchase Order"
        else:
            status = "Healthy Turnover"
            action = "Maintain Normal Buffer"

        rows.append([
            sku, name, cat, supplier, stock, units_sold, turnover_days,
            velocity, return_rate, status, action
        ])
    return rows

def write_csv(path, rows):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerows(rows)
    print(f"Written {len(rows)-1} rows to {path}")

# Write to backend and frontend public
dest_dirs = [
    r"C:\TechAvenuee\backend\data",
    r"C:\TechAvenuee\frontend\public\data"
]

for d in dest_dirs:
    write_csv(os.path.join(d, "product_demand.csv"), generate_product_demand(1200))
    write_csv(os.path.join(d, "sales_prediction.csv"), generate_sales_prediction(1050))
    write_csv(os.path.join(d, "product_performance.csv"), generate_product_performance(1100))

print("All datasets generated successfully!")

