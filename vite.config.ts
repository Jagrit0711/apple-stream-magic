import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    proxy: {
      '/api/tmdb': {
        target: 'https://api.themoviedb.org/3',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/tmdb/, '')
      },
      '/api/img': {
        target: 'https://image.tmdb.org/t/p',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/img/, '')
      },
      '/api/supabase': {
        target: 'https://qzadtgjcztwomgujqkqk.supabase.co',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/supabase/, '')
      }
    }
  },
  plugins: [
    react(), 
    mode === "development" && componentTagger(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'public',
      filename: 'sw.js',
      registerType: 'autoUpdate',
      injectManifest: {
        injectionPoint: 'self.__WB_MANIFEST'
      },
      manifest: false // Use our existing public/manifest.json
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
