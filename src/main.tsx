import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { requestNotificationPermission } from "./firebase";

async function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
      console.log("✅ Service Worker registrado:", registration);

      await navigator.serviceWorker.ready; // 🔑 esperar que esté activo
      console.log("🔹 Service Worker activo");

      // Solicitar notificaciones
      await requestNotificationPermission();
    } catch (err) {
      console.error("❌ Error registrando SW o Push:", err);
    }
  }
}

registerServiceWorker();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
