import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Vite config: builds into ../backend served path is handled by main.py
// (FRONTEND_BUILD_DIR points at frontend/dist). The dev server proxies
// /api calls to the FastAPI backend running on port 8000.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
      "/uploads": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
