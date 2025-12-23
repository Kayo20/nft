import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { readFile } from 'fs/promises';
import { viteSourceLocator } from '@metagptx/vite-plugin-source-locator';

// Dev-only: plugin to set CSP header allowing unsafe-eval for Vite HMR
function devCspPlugin() {
  return {
    name: 'dev-csp',
    configureServer(server: any) {
      server.middlewares.use((req: any, res: any, next: any) => {
        res.setHeader('Content-Security-Policy', "script-src 'self' 'unsafe-eval' 'unsafe-inline' https: http:;");
        next();
      });
    },
  };
}

// Dev-only: ensure /env.mjs is served as a JS module with proper MIME type
function devEnvPlugin() {
  return {
    name: 'dev-env-middleware',
    configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        try {
          if (!req.url) return next();
          const url = req.url.split('?')[0];
          // Match /env.mjs at root or in nested paths (e.g. /some/route/env.mjs)
          if (url === '/env.mjs' || url === '/env' || url.endsWith('/env.mjs')) {
            const p = path.resolve(process.cwd(), 'public', 'env.mjs');
            const body = await readFile(p, 'utf-8');
            res.setHeader('Content-Type', 'application/javascript');
            res.setHeader('Cache-Control', 'no-cache');
            res.statusCode = 200;
            res.end(body);
            return;
          }
        } catch (err) {
          // fallback to next handler
        }
        next();
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    // Add dev-only CSP header and env middleware before other plugins so HMR and /env.mjs are served correctly
    ...(mode === 'development' ? [devCspPlugin(), devEnvPlugin()] : []),
    // Disable viteSourceLocator during development — it can interfere with Vite's HTML import analysis
    ...(mode === 'development' ? [] : [viteSourceLocator({
      prefix: 'mgx',
    })]),
    react(),
  ],
  server: {
    watch: { usePolling: true, interval: 800 /* 300~1500 */ },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    sourcemap: true,
  },
}));

