import React, {StrictMode, lazy, Suspense} from 'react';
import {createRoot} from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App.tsx';
import './index.css';

import { AuthProvider } from './components/AuthProvider';
import AdminRoute from './components/AdminRoute';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(err => {
      console.log('SW registration failed: ', err);
    });
  });
}

const AdminDashboard = lazy(() => import('./components/AdminDashboard'));

declare global {
  interface Window {
    __tebyanBootDone?: () => void;
  }
}

// Hand the pre-React boot splash over to <SplashScreen> once React has painted.
// Both draw the same mark at the same optical centre, so the 300ms cross-fade
// reads as one continuous screen. index.html keeps a safety timeout of its own.
const dismissBootSplash = () => {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => window.__tebyanBootDone?.());
  });
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={
          <div className="flex h-screen w-full items-center justify-center">
             <div className="w-12 h-12 border-4 border-slate-200 border-t-brand-primary rounded-full animate-spin"></div>
          </div>
        }>
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/qawl" element={<App />} />
            <Route path="/qawl/:qid" element={<App />} />
            <Route path="/admin" element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            } />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>,
);

dismissBootSplash();
