import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { TextSizeProvider } from './context/TextSizeContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <TextSizeProvider>
      <App />
    </TextSizeProvider>
  </React.StrictMode>
);
