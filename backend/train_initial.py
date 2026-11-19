from ml_engine import train_model

for task in ['sales', 'demand', 'slow_moving', 'bestsellers']:
    print(f'Training Linear Regression for {task}...')
    lr = train_model(task, 'linear_regression')
    print(f'  LR: R2={lr["r2_score"]}, MAE={lr["mae"]}, RMSE={lr["rmse"]}')
    
    print(f'Training Random Forest for {task}...')
    rf = train_model(task, 'random_forest')
    print(f'  RF: R2={rf["r2_score"]}, MAE={rf["mae"]}, RMSE={rf["rmse"]}')

print('All 8 initial models successfully trained and registered in MySQL!')

