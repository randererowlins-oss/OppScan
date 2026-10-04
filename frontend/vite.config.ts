import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Dev server: binds 0.0.0.0 (sandbox preview friendly), proxies /api → backend
// so the browser never needs a hardcoded API host (no CORS pain in previews).
export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    // Allow sandbox / preview proxy hosts (e.g. *.e2b.app) in dev.
    allowedHosts: true,
    proxy: {
      "/api": {
        target: process.env.VITE_API_URL ?? "http://localhost:4000",
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: "0.0.0.0",
    port: 5173,
  },
});
