from database import get_db_connection

conn = get_db_connection()
cursor = conn.cursor()

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
    is_active BOOLEAN DEFAULT TRUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
""")

cursor.execute("""
CREATE TABLE IF NOT EXISTS predictions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    task VARCHAR(100) NOT NULL,
    algorithm VARCHAR(100) NOT NULL,
    inputs_json TEXT,
    predicted_value FLOAT NOT NULL,
    confidence_interval VARCHAR(100),
    recommendation TEXT,
    user_id INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
""")

conn.commit()
print("Tables models_registry and predictions created successfully in MySQL!")
conn.close()

