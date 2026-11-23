import './lib/demoStorage';
import React, {StrictMode, lazy, Suspense} from 'react';
import {createRoot} from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import App from './App.tsx';
import './index.css';
import './components/dna/dna-theme.css';
import './styles/elevation.css';
import './styles/polish.css';
import './styles/beauty.css';
import './styles/motion.css';
import './styles/dock-motion.css';
import { installDuoMarkers } from './lib/duo-markers';
import { installDockMotion } from './lib/dockMotion';
import { installAppUpdate } from './lib/app-update';
import { IS_DEMO_MODE } from './lib/demoMode';

import { AuthProvider } from './components/AuthProvider';
import AdminRoute from './components/AdminRoute';
import { initNativePush } from './lib/nativePush';

// التحديث الذاتي الصامت: بصمة الإصدار، منارتها، ثم التحديث والتصعيد عند اللزوم.
installAppUpdate();

// العرض: تسخين مكتبة قول فصل أثناء ظهور الشاشة الأولى كي لا يرى الزائر هيكلًا رماديًا عند فتحها.
if (IS_DEMO_MODE) {
  window.setTimeout(() => { void import('./data/demoLibrary').then((m) => m.loadDemoLibrary()); }, 600);
}

// علامات iPhone Duo (data-device / data-shell / data-widget-side) قبل أول رسم.
installDuoMarkers();

// حركة كبسولة التنقّل (بصرية فقط): مؤشّرٌ منزلق وضغطةٌ فورية.
installDockMotion({ dock: '.duo-dock-nav', link: 'button', active: 'button.is-active', sampleActive: true });

// تشخيص ركن ودجت iPhone Duo: لا يُحمَّل شيء منه إلا مع ?duo-debug=1.
if (new URLSearchParams(window.location.search).has('duo-debug')) {
  void import('./lib/duoDebug').then((m) => m.mountDuoDebug());
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(err => {
      console.log('SW registration failed: ', err);
    });
  });
}

const AdminDashboard = lazy(() => import('./components/AdminDashboard'));

// Any other path (a typo, an old link, /index.html) used to match no route and
// leave a blank page. Send it to the home page, keeping ?tab=… and #… intact.
function RedirectHome() {
  const { search, hash } = useLocation();
  return <Navigate to={{ pathname: '/', search, hash }} replace />;
}

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

// iOS app only: open the page a tapped notification points to (no-op on the web).
initNativePush();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={
          <div className="flex h-dvh w-full items-center justify-center">
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
            <Route path="*" element={<RedirectHome />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>,
);

dismissBootSplash();
