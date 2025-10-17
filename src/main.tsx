import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

async function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
      console.log("✅ Service Worker registrado:", registration);

      
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        console.log("❌ Permiso de notificaciones denegado");
        return;
      }

      const publicVapidKey = "TU_PUBLIC_KEY_VAPID"; 
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicVapidKey),
      });

      console.log("✅ Suscripción Push creada:", subscription);

  
      await fetch("/api/subscribe", {
        method: "POST",
        body: JSON.stringify(subscription),
        headers: {
          "Content-Type": "application/json",
        },
      });
    } catch (err) {
      console.error("❌ Error registrando SW o suscribiendo a Push:", err);
    }
  }
}


function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}


registerServiceWorker();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
