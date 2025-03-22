import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { browserLogger } from "./src/vite-plugins/browser-logger";
import istanbul from 'vite-plugin-istanbul';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const plugins: Plugin[] = [];

  // Initialize react plugin and filter out falsy values
  const maybeReactPlugin = react();
  if (maybeReactPlugin) {
    if (Array.isArray(maybeReactPlugin)) {
      plugins.push(...maybeReactPlugin.filter(Boolean) as Plugin[]);
    } else {
      plugins.push(maybeReactPlugin);
    }
  }

  // Add browserLogger plugin in development mode
  if (mode === 'development') {
    const browserLoggerPlugin = browserLogger();
    if (browserLoggerPlugin) {
      plugins.push(browserLoggerPlugin);
    }
  }

  // Add istanbul plugin if coverage is enabled
  if (process.env.VITE_ENABLE_COVERAGE === 'true' || process.env.VITEST) {
    const istanbulPlugin = istanbul({
      include: 'src/*',
      exclude: ['node_modules', 'test/', 'e2e/'],
      extension: ['.js', '.jsx', '.ts', '.tsx'],
      requireEnv: false,
    });
    if (istanbulPlugin) {
      plugins.push(istanbulPlugin);
    }
  }

  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      sourcemap: process.env.VITE_ENABLE_COVERAGE === 'true' ? true : false,
    },
  };
});
