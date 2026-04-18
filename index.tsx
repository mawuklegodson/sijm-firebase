import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { initPushNotifications } from './lib/pushNotifications.ts';

// Initialize Capacitor Push Notifications
initPushNotifications();

/**
 * Entry Point for SIJM Church Management System
 */
const container = document.getElementById('root');

if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  console.error("SIJM CMS: Fatal error - #root element not found in DOM.");
}
