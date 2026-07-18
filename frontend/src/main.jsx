import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./styles.css";

const t0 = window.__lifelens_start || performance.now();
console.log(`[Startup] JS Bundle Loaded & Executing: ${(performance.now() - t0).toFixed(1)}ms`);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
console.log(`[Startup] React Render Triggered: ${(performance.now() - t0).toFixed(1)}ms`);
