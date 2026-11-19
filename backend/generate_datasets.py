import os
import csv
import random
from datetime import datetime, timedelta

DATASETS_DIR = os.path.join(os.path.dirname(__file__), 'datasets')
os.makedirs(DATASETS_DIR, exist_ok=True)

CATEGORIES = [
    'Laptops & Ultrabooks',
    'Desktop Computers',
    'Internal Components',
    'Peripherals & Accessories',
    'Storage & Memory',
    'Networking Devices'
]

PRODUCTS = [
    ('ProBook Ultra 15', 'Laptops & Ultrabooks', 54999),
    ('GamerX Predator 16', 'Laptops & Ultrabooks', 78999),
    ('SlimLite Go 13', 'Laptops & Ultrabooks', 29999),
    ('Station Elite Tower', 'Desktop Computers', 48999),
    ('Compact Office Mini', 'Desktop Computers', 24999),
    ('Aero RTX 4070 12GB', 'Internal Components', 38500),
    ('Pulse RX 7800 XT 16GB', 'Internal Components', 34999),
    ('Ryzen 7 7800X3D Processor', 'Internal Components', 24500),
    ('Core i7-14700K Processor', 'Internal Components', 23999),
    ('Phantom B650 Motherboard', 'Internal Components', 11999),
    ('Vengeance DDR5 32GB RGB', 'Storage & Memory', 7499),
    ('Evo 990 Pro 2TB NVMe', 'Storage & Memory', 9899),
    ('Titanium 850W Gold PSU', 'Internal Components', 6799),
    ('Liquid Master 360 AIO', 'Internal Components', 5499),
    ('Crystal 27-inch 165Hz Monitor', 'Peripherals & Accessories', 13999),
    ('Precision Pro Mechanical Keyboard', 'Peripherals & Accessories', 4299),
    ('Apex Wireless Gaming Mouse', 'Peripherals & Accessories', 2899),
    ('Void RGB Wireless Headset', 'Peripherals & Accessories', 3799),
    ('Nighthawk WiFi 6 AX5400 Router', 'Networking Devices', 8999),
    ('SpeedStream Gigabit Switch 8P', 'Networking Devices', 1899)
]

def generate_sales_dataset():
    filepath = os.path.join(DATASETS_DIR, 'tech_avenue_sales_dataset.csv')
    start_date = datetime(2023, 1, 1)
    
    with open(filepath, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow([
            'date',
            'category',
            'store_footfall',
            'marketing_spend',
            'promotions_active',
            'discount_pct',
            'sales_revenue'
        ])
        
        for i in range(1200):
            cur_date = (start_date + timedelta(days=i % 730)).strftime('%Y-%m-%d')
            cat = random.choice(CATEGORIES)
            footfall = random.randint(80, 500)
            marketing = random.randint(1000, 15000)
            promos = random.choice([0, 1, 2, 3])
            discount = random.choice([0, 5, 10, 15, 20, 25])
            
            # Base linear formula with realistic variance
            base_sales = (footfall * 280) + (marketing * 4.2) + (promos * 12000) - (discount * 450)
            noise = random.uniform(0.92, 1.08)
            sales = round(max(15000, base_sales * noise), 2)
            
            writer.writerow([cur_date, cat, footfall, marketing, promos, discount, sales])
            
    print(f"Generated {filepath} with 1200 records.")

def generate_demand_dataset():
    filepath = os.path.join(DATASETS_DIR, 'tech_avenue_demand_dataset.csv')
    
    with open(filepath, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow([
            'product_id',
            'product_name',
            'category',
            'unit_price',
            'competitor_price',
            'rating',
            'page_views',
            'stock_quantity',
            'monthly_demand'
        ])
        
        for i in range(1200):
            prod_name, cat, base_price = random.choice(PRODUCTS)
            prod_id = 100 + (i % len(PRODUCTS)) + 1
            unit_price = round(base_price * random.uniform(0.9, 1.1), 2)
            comp_price = round(unit_price * random.uniform(0.88, 1.15), 2)
            rating = round(random.uniform(3.5, 5.0), 1)
            page_views = random.randint(500, 12000)
            stock = random.randint(5, 150)
            
            # Demand formula: higher page views, better rating, lower relative price = higher demand
            price_ratio = comp_price / max(1, unit_price)
            demand_raw = (page_views * 0.006) + (rating * 8) + (price_ratio * 15) + random.uniform(-5, 5)
            monthly_demand = max(5, int(demand_raw))
            
            writer.writerow([prod_id, prod_name, cat, unit_price, comp_price, rating, page_views, stock, monthly_demand])
            
    print(f"Generated {filepath} with 1200 records.")

def generate_slow_moving_dataset():
    filepath = os.path.join(DATASETS_DIR, 'tech_avenue_slow_moving_dataset.csv')
    
    with open(filepath, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow([
            'product_id',
            'product_name',
            'category',
            'current_stock',
            'reorder_level',
            'unit_price',
            'discount_pct',
            'days_in_inventory',
            'days_to_sell'
        ])
        
        for i in range(1000):
            prod_name, cat, base_price = random.choice(PRODUCTS)
            prod_id = 200 + (i % len(PRODUCTS)) + 1
            stock = random.randint(10, 200)
            reorder = random.randint(5, 25)
            price = round(base_price * random.uniform(0.85, 1.15), 2)
            discount = random.choice([0, 0, 5, 10, 15, 20])
            days_in_inv = random.randint(15, 180)
            
            # Days to sell target
            days_raw = (stock * 0.7) + (days_in_inv * 0.4) - (discount * 1.8) + (price / 5000) + random.uniform(-10, 10)
            days_to_sell = max(5, int(days_raw))
            
            writer.writerow([prod_id, prod_name, cat, stock, reorder, price, discount, days_in_inv, days_to_sell])
            
    print(f"Generated {filepath} with 1000 records.")

def generate_bestsellers_dataset():
    filepath = os.path.join(DATASETS_DIR, 'tech_avenue_bestsellers_dataset.csv')
    
    with open(filepath, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow([
            'product_id',
            'product_name',
            'category',
            'unit_price',
            'discount_pct',
            'customer_rating',
            'conversion_rate',
            'units_sold'
        ])
        
        for i in range(1000):
            prod_name, cat, base_price = random.choice(PRODUCTS)
            prod_id = 300 + (i % len(PRODUCTS)) + 1
            price = round(base_price * random.uniform(0.9, 1.1), 2)
            discount = random.choice([0, 5, 10, 15, 20, 25])
            rating = round(random.uniform(3.8, 5.0), 1)
            conv_rate = round(random.uniform(0.08, 0.45), 3)
            
            # Units sold target
            units_raw = (conv_rate * 400) + (rating * 15) + (discount * 2.5) - (price / 8000) + random.uniform(-10, 10)
            units_sold = max(10, int(units_raw))
            
            writer.writerow([prod_id, prod_name, cat, price, discount, rating, conv_rate, units_sold])
            
    print(f"Generated {filepath} with 1000 records.")

if __name__ == '__main__':
    generate_sales_dataset()
    generate_demand_dataset()
    generate_slow_moving_dataset()
    generate_bestsellers_dataset()
    print("All 4 datasets generated successfully with >= 1,000 records each!")

