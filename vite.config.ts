import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { browserLogger } from "./src/vite-plugins/browser-logger";
import istanbul from 'vite-plugin-istanbul';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
    mode === 'development' && browserLogger(),
    (process.env.VITE_ENABLE_COVERAGE === 'true' || process.env.VITEST) && istanbul({
      include: 'src/*',
      exclude: ['node_modules', 'test/', 'e2e/'],
      extension: ['.js', '.jsx', '.ts', '.tsx'],
      requireEnv: false,
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    sourcemap: process.env.VITE_ENABLE_COVERAGE === 'true' ? true : false,
  },
}));
