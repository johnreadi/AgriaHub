import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ToastProvider } from './components/ToastProvider';
import { AnimationProvider } from './components/animations';
import { AuthProvider } from './src/contexts/AuthContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

if ('serviceWorker' in navigator) {
  if (import.meta.env.MODE === 'production') {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').then(registration => {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
      }, err => {
        console.log('ServiceWorker registration failed: ', err);
      });
    });
  } else {
    // En développement, désinscrire tout service worker pour éviter une page blanche due au cache
    navigator.serviceWorker.getRegistrations().then(registrations => {
      registrations.forEach(reg => reg.unregister());
    }).catch(() => {});
  }
}

const root = ReactDOM.createRoot(rootElement);
root.render(
    <React.StrictMode>
        <AnimationProvider>
            <ToastProvider>
                <AuthProvider>
                    <App />
                </AuthProvider>
            </ToastProvider>
        </AnimationProvider>
    </React.StrictMode>
);