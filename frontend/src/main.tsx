import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Initialize or retrieve persistent user ID
let userId = localStorage.getItem('synaptiq_user_id');
if (!userId) {
  userId = 'user-' + Math.random().toString(36).substring(2, 15);
  localStorage.setItem('synaptiq_user_id', userId);
}

// Global fetch wrapper to append x-user-id header automatically
const originalFetch = window.fetch;
window.fetch = function (input, init) {
  const options = init || {};
  options.headers = {
    ...options.headers,
    'x-user-id': userId
  };
  return originalFetch(input, options);
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
