import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { TextSizeProvider } from './context/TextSizeContext';
import { NotificationProvider } from './context/NotificationContext';
import { ThemeColorProvider } from './context/ThemeColorContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <TextSizeProvider>
      <ThemeColorProvider>
        <NotificationProvider>
          <App />
        </NotificationProvider>
      </ThemeColorProvider>
    </TextSizeProvider>
  </React.StrictMode>
);
