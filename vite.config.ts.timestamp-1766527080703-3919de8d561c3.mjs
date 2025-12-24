// vite.config.ts
import { defineConfig } from "file:///C:/Users/HP/Desktop/np/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/HP/Desktop/np/node_modules/@vitejs/plugin-react-swc/index.js";
import path from "path";
import { readFile } from "fs/promises";
import { viteSourceLocator } from "file:///C:/Users/HP/Desktop/np/node_modules/@metagptx/vite-plugin-source-locator/dist/index.mjs";
var __vite_injected_original_dirname = "C:\\Users\\HP\\Desktop\\np";
function devCspPlugin() {
  return {
    name: "dev-csp",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        res.setHeader("Content-Security-Policy", "script-src 'self' 'unsafe-eval' 'unsafe-inline' https: http:;");
        next();
      });
    }
  };
}
function devEnvPlugin() {
  return {
    name: "dev-env-middleware",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        try {
          if (!req.url) return next();
          const url = req.url.split("?")[0];
          if (url === "/env.mjs" || url === "/env" || url.endsWith("/env.mjs")) {
            const p = path.resolve(process.cwd(), "public", "env.mjs");
            const body = await readFile(p, "utf-8");
            res.setHeader("Content-Type", "application/javascript");
            res.setHeader("Cache-Control", "no-cache");
            res.statusCode = 200;
            res.end(body);
            return;
          }
        } catch (err) {
        }
        next();
      });
    }
  };
}
var vite_config_default = defineConfig(({ mode }) => ({
  plugins: [
    // Add dev-only CSP header and env middleware before other plugins so HMR and /env.mjs are served correctly
    ...mode === "development" ? [devCspPlugin(), devEnvPlugin()] : [],
    // Disable viteSourceLocator during development — it can interfere with Vite's HTML import analysis
    ...mode === "development" ? [] : [viteSourceLocator({
      prefix: "mgx"
    })],
    react()
  ],
  server: {
    watch: {
      usePolling: true,
      interval: 800
      /* 300~1500 */
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  },
  build: {
    sourcemap: true
  }
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxIUFxcXFxEZXNrdG9wXFxcXG5wXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxIUFxcXFxEZXNrdG9wXFxcXG5wXFxcXHZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9IUC9EZXNrdG9wL25wL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSc7XHJcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2MnO1xyXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcclxuaW1wb3J0IHsgcmVhZEZpbGUgfSBmcm9tICdmcy9wcm9taXNlcyc7XHJcbmltcG9ydCB7IHZpdGVTb3VyY2VMb2NhdG9yIH0gZnJvbSAnQG1ldGFncHR4L3ZpdGUtcGx1Z2luLXNvdXJjZS1sb2NhdG9yJztcclxuXHJcbi8vIERldi1vbmx5OiBwbHVnaW4gdG8gc2V0IENTUCBoZWFkZXIgYWxsb3dpbmcgdW5zYWZlLWV2YWwgZm9yIFZpdGUgSE1SXHJcbmZ1bmN0aW9uIGRldkNzcFBsdWdpbigpIHtcclxuICByZXR1cm4ge1xyXG4gICAgbmFtZTogJ2Rldi1jc3AnLFxyXG4gICAgY29uZmlndXJlU2VydmVyKHNlcnZlcjogYW55KSB7XHJcbiAgICAgIHNlcnZlci5taWRkbGV3YXJlcy51c2UoKHJlcTogYW55LCByZXM6IGFueSwgbmV4dDogYW55KSA9PiB7XHJcbiAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1TZWN1cml0eS1Qb2xpY3knLCBcInNjcmlwdC1zcmMgJ3NlbGYnICd1bnNhZmUtZXZhbCcgJ3Vuc2FmZS1pbmxpbmUnIGh0dHBzOiBodHRwOjtcIik7XHJcbiAgICAgICAgbmV4dCgpO1xyXG4gICAgICB9KTtcclxuICAgIH0sXHJcbiAgfTtcclxufVxyXG5cclxuLy8gRGV2LW9ubHk6IGVuc3VyZSAvZW52Lm1qcyBpcyBzZXJ2ZWQgYXMgYSBKUyBtb2R1bGUgd2l0aCBwcm9wZXIgTUlNRSB0eXBlXHJcbmZ1bmN0aW9uIGRldkVudlBsdWdpbigpIHtcclxuICByZXR1cm4ge1xyXG4gICAgbmFtZTogJ2Rldi1lbnYtbWlkZGxld2FyZScsXHJcbiAgICBjb25maWd1cmVTZXJ2ZXIoc2VydmVyOiBhbnkpIHtcclxuICAgICAgc2VydmVyLm1pZGRsZXdhcmVzLnVzZShhc3luYyAocmVxOiBhbnksIHJlczogYW55LCBuZXh0OiBhbnkpID0+IHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgaWYgKCFyZXEudXJsKSByZXR1cm4gbmV4dCgpO1xyXG4gICAgICAgICAgY29uc3QgdXJsID0gcmVxLnVybC5zcGxpdCgnPycpWzBdO1xyXG4gICAgICAgICAgLy8gTWF0Y2ggL2Vudi5tanMgYXQgcm9vdCBvciBpbiBuZXN0ZWQgcGF0aHMgKGUuZy4gL3NvbWUvcm91dGUvZW52Lm1qcylcclxuICAgICAgICAgIGlmICh1cmwgPT09ICcvZW52Lm1qcycgfHwgdXJsID09PSAnL2VudicgfHwgdXJsLmVuZHNXaXRoKCcvZW52Lm1qcycpKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHAgPSBwYXRoLnJlc29sdmUocHJvY2Vzcy5jd2QoKSwgJ3B1YmxpYycsICdlbnYubWpzJyk7XHJcbiAgICAgICAgICAgIGNvbnN0IGJvZHkgPSBhd2FpdCByZWFkRmlsZShwLCAndXRmLTgnKTtcclxuICAgICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2phdmFzY3JpcHQnKTtcclxuICAgICAgICAgICAgcmVzLnNldEhlYWRlcignQ2FjaGUtQ29udHJvbCcsICduby1jYWNoZScpO1xyXG4gICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDIwMDtcclxuICAgICAgICAgICAgcmVzLmVuZChib2R5KTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgICAgLy8gZmFsbGJhY2sgdG8gbmV4dCBoYW5kbGVyXHJcbiAgICAgICAgfVxyXG4gICAgICAgIG5leHQoKTtcclxuICAgICAgfSk7XHJcbiAgICB9LFxyXG4gIH07XHJcbn1cclxuXHJcbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXHJcbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZygoeyBtb2RlIH0pID0+ICh7XHJcbiAgcGx1Z2luczogW1xyXG4gICAgLy8gQWRkIGRldi1vbmx5IENTUCBoZWFkZXIgYW5kIGVudiBtaWRkbGV3YXJlIGJlZm9yZSBvdGhlciBwbHVnaW5zIHNvIEhNUiBhbmQgL2Vudi5tanMgYXJlIHNlcnZlZCBjb3JyZWN0bHlcclxuICAgIC4uLihtb2RlID09PSAnZGV2ZWxvcG1lbnQnID8gW2RldkNzcFBsdWdpbigpLCBkZXZFbnZQbHVnaW4oKV0gOiBbXSksXHJcbiAgICAvLyBEaXNhYmxlIHZpdGVTb3VyY2VMb2NhdG9yIGR1cmluZyBkZXZlbG9wbWVudCBcdTIwMTQgaXQgY2FuIGludGVyZmVyZSB3aXRoIFZpdGUncyBIVE1MIGltcG9ydCBhbmFseXNpc1xyXG4gICAgLi4uKG1vZGUgPT09ICdkZXZlbG9wbWVudCcgPyBbXSA6IFt2aXRlU291cmNlTG9jYXRvcih7XHJcbiAgICAgIHByZWZpeDogJ21neCcsXHJcbiAgICB9KV0pLFxyXG4gICAgcmVhY3QoKSxcclxuICBdLFxyXG4gIHNlcnZlcjoge1xyXG4gICAgd2F0Y2g6IHsgdXNlUG9sbGluZzogdHJ1ZSwgaW50ZXJ2YWw6IDgwMCAvKiAzMDB+MTUwMCAqLyB9LFxyXG4gIH0sXHJcbiAgcmVzb2x2ZToge1xyXG4gICAgYWxpYXM6IHtcclxuICAgICAgJ0AnOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi9zcmMnKSxcclxuICAgIH0sXHJcbiAgfSxcclxuICBidWlsZDoge1xyXG4gICAgc291cmNlbWFwOiB0cnVlLFxyXG4gIH0sXHJcbn0pKTtcclxuXHJcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBOFAsU0FBUyxvQkFBb0I7QUFDM1IsT0FBTyxXQUFXO0FBQ2xCLE9BQU8sVUFBVTtBQUNqQixTQUFTLGdCQUFnQjtBQUN6QixTQUFTLHlCQUF5QjtBQUpsQyxJQUFNLG1DQUFtQztBQU96QyxTQUFTLGVBQWU7QUFDdEIsU0FBTztBQUFBLElBQ0wsTUFBTTtBQUFBLElBQ04sZ0JBQWdCLFFBQWE7QUFDM0IsYUFBTyxZQUFZLElBQUksQ0FBQyxLQUFVLEtBQVUsU0FBYztBQUN4RCxZQUFJLFVBQVUsMkJBQTJCLCtEQUErRDtBQUN4RyxhQUFLO0FBQUEsTUFDUCxDQUFDO0FBQUEsSUFDSDtBQUFBLEVBQ0Y7QUFDRjtBQUdBLFNBQVMsZUFBZTtBQUN0QixTQUFPO0FBQUEsSUFDTCxNQUFNO0FBQUEsSUFDTixnQkFBZ0IsUUFBYTtBQUMzQixhQUFPLFlBQVksSUFBSSxPQUFPLEtBQVUsS0FBVSxTQUFjO0FBQzlELFlBQUk7QUFDRixjQUFJLENBQUMsSUFBSSxJQUFLLFFBQU8sS0FBSztBQUMxQixnQkFBTSxNQUFNLElBQUksSUFBSSxNQUFNLEdBQUcsRUFBRSxDQUFDO0FBRWhDLGNBQUksUUFBUSxjQUFjLFFBQVEsVUFBVSxJQUFJLFNBQVMsVUFBVSxHQUFHO0FBQ3BFLGtCQUFNLElBQUksS0FBSyxRQUFRLFFBQVEsSUFBSSxHQUFHLFVBQVUsU0FBUztBQUN6RCxrQkFBTSxPQUFPLE1BQU0sU0FBUyxHQUFHLE9BQU87QUFDdEMsZ0JBQUksVUFBVSxnQkFBZ0Isd0JBQXdCO0FBQ3RELGdCQUFJLFVBQVUsaUJBQWlCLFVBQVU7QUFDekMsZ0JBQUksYUFBYTtBQUNqQixnQkFBSSxJQUFJLElBQUk7QUFDWjtBQUFBLFVBQ0Y7QUFBQSxRQUNGLFNBQVMsS0FBSztBQUFBLFFBRWQ7QUFDQSxhQUFLO0FBQUEsTUFDUCxDQUFDO0FBQUEsSUFDSDtBQUFBLEVBQ0Y7QUFDRjtBQUdBLElBQU8sc0JBQVEsYUFBYSxDQUFDLEVBQUUsS0FBSyxPQUFPO0FBQUEsRUFDekMsU0FBUztBQUFBO0FBQUEsSUFFUCxHQUFJLFNBQVMsZ0JBQWdCLENBQUMsYUFBYSxHQUFHLGFBQWEsQ0FBQyxJQUFJLENBQUM7QUFBQTtBQUFBLElBRWpFLEdBQUksU0FBUyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsa0JBQWtCO0FBQUEsTUFDbkQsUUFBUTtBQUFBLElBQ1YsQ0FBQyxDQUFDO0FBQUEsSUFDRixNQUFNO0FBQUEsRUFDUjtBQUFBLEVBQ0EsUUFBUTtBQUFBLElBQ04sT0FBTztBQUFBLE1BQUUsWUFBWTtBQUFBLE1BQU0sVUFBVTtBQUFBO0FBQUEsSUFBbUI7QUFBQSxFQUMxRDtBQUFBLEVBQ0EsU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBLE1BQ0wsS0FBSyxLQUFLLFFBQVEsa0NBQVcsT0FBTztBQUFBLElBQ3RDO0FBQUEsRUFDRjtBQUFBLEVBQ0EsT0FBTztBQUFBLElBQ0wsV0FBVztBQUFBLEVBQ2I7QUFDRixFQUFFOyIsCiAgIm5hbWVzIjogW10KfQo=
