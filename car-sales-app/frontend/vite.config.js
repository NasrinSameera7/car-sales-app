import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// During local development, requests to /api and /uploads are proxied
// to the backend so the frontend and backend can run on separate ports
// without CORS friction. In production, set VITE_API_URL instead
// (see .env.example) and the app will call that URL directly.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:4000",
      "/uploads": "http://localhost:4000",
    },
  },
});
