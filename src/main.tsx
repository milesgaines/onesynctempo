import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { BrowserRouter } from "react-router-dom";

import { TempoDevtools } from "tempo-devtools";

console.log("🚀 [MAIN] Starting OneSync application");
console.log("🔧 [MAIN] Environment:", {
  NODE_ENV: import.meta.env.NODE_ENV,
  VITE_TEMPO: import.meta.env.VITE_TEMPO,
  BASE_URL: import.meta.env.BASE_URL,
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL
    ? "✅ Set"
    : "❌ Missing",
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY
    ? "✅ Set"
    : "❌ Missing",
});

try {
  TempoDevtools.init();
  console.log("✅ [MAIN] Tempo devtools initialized");
} catch (error) {
  console.error("❌ [MAIN] Failed to initialize Tempo devtools:", error);
}

const basename = import.meta.env.BASE_URL;
console.log("🌐 [MAIN] Router basename:", basename);

const rootElement = document.getElementById("root");
if (!rootElement) {
  console.error("❌ [MAIN] Root element not found!");
  throw new Error("Root element not found");
}

console.log("📦 [MAIN] Rendering React app");
ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <BrowserRouter basename={basename}>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);

console.log("✅ [MAIN] React app rendered successfully");
