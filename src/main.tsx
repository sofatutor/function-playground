import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ServiceProvider } from './providers/ServiceProvider'
import { initLogger, overrideConsoleMethods } from './utils/logger'

// Initialize logger and override console methods
initLogger();
overrideConsoleMethods();

createRoot(document.getElementById("root")!).render(
  <ServiceProvider>
    <App />
  </ServiceProvider>
);
