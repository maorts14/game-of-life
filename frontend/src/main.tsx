import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthGameSync } from "./auth/AuthGameSync";
import { AuthProvider } from "./auth/AuthProvider";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <AuthGameSync />
        <App />
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>,
);
