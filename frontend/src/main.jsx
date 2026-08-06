import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Toaster } from "react-hot-toast";
import "./index.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3500,
        style: {
          background: "var(--bg-secondary)",
          color: "var(--text-primary)",
          border: "1px solid var(--border-color)",
          borderRadius: "12px",
          fontSize: "14px",
          fontFamily: "Inter, sans-serif",
          boxShadow: "var(--shadow-lg)",
          padding: "12px 16px",
        },
        success: {
          iconTheme: { primary: "#10b981", secondary: "white" },
        },
        error: {
          iconTheme: { primary: "#ef4444", secondary: "white" },
        },
      }}
    />
  </StrictMode>
);