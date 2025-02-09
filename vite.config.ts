import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    "process.env": process.env,
  },
  plugins: [react()],
  optimizeDeps: {
    exclude: ["lucide-react"],
  },
});

// Code reviewed - no apparent errors in the Vite config
// Basic config with React plugin and process.env define
// Excludes lucide-react from optimized deps
// Config structure follows Vite best practices
