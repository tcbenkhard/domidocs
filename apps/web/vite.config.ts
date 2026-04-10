import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const rootDir = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@domidocs/contracts": path.resolve(
        rootDir,
        "../../packages/contracts/src/index.ts",
      ),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/auth": {
        target: "http://127.0.0.1:3001",
        changeOrigin: true,
      },
      "/api": {
        target: "http://127.0.0.1:3002",
        changeOrigin: true,
      },
      "/.well-known": {
        target: "http://127.0.0.1:3001",
        changeOrigin: true,
      },
      "/health": {
        target: "http://127.0.0.1:3002",
        changeOrigin: true,
      },
    },
  },
});
