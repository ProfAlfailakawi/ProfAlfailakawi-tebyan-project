import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      // Gemini API keys must stay server-side in Cloud Functions.
      // Do not inject GEMINI_API_KEY into the frontend bundle.
      'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(''),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined;
            if (id.includes('/firebase/')) return 'vendor-firebase';
            if (id.includes('/@google/') || id.includes('/google-auth-library/')) return 'vendor-ai';
            if (id.includes('/react-markdown/') || id.includes('/remark-') || id.includes('/micromark') || id.includes('/unified/')) return 'vendor-markdown';
            if (id.includes('/motion/') || id.includes('/lucide-react/')) return 'vendor-ui';
            if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('/react-router-dom/')) return 'vendor-react';
            return undefined;
          },
        },
      },
    },
  };
});
