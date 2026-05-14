// src/main.jsx — React App Entry Point
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import store from './store/store';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      {/* Toast notification provider */}
      <Toaster
        position="top-right"
        gutter={12}
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1a1a2e',
            color: '#f1f5f9',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '12px',
            fontSize: '0.9rem',
            fontFamily: 'Inter, sans-serif',
          },
          success: {
            iconTheme: { primary: '#10b981', secondary: '#1a1a2e' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#1a1a2e' },
          },
        }}
      />
      <App />
    </Provider>
  </StrictMode>
);
