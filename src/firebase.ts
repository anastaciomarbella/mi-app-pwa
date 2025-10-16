import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyCnOsFkxZEdMXPu_DtEfI2Rexkq4Fsje2k",
  authDomain: "mi-awp.firebaseapp.com",
  projectId: "mi-awp",
  storageBucket: "mi-awp.firebasestorage.app",
  messagingSenderId: "580697464751",
  appId: "1:580697464751:web:06fc2a00db56b10661d95a",
  measurementId: "G-1SKW4SGEDN"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const analytics = getAnalytics(app);
export const messaging = getMessaging(app);

// Solicitar permiso para notificaciones
export async function requestNotificationPermission() {
  const permission = await Notification.requestPermission();
  if (permission === "granted") {
    const token = await getToken(messaging, {
      vapidKey: "BCwXvmapgzoj2vk_FKaNeWykYtJYsWhp_QI2Qx5eJE8wxm99R8pNNgtsyjvNMImptgfhr2OwbGwDH98g4oI_owk" // ⚠️ Reemplaza con tu clave pública
    });
    console.log("📲 Token FCM:", token);
    return token;
  } else {
    console.warn("Permiso de notificaciones denegado");
  }
}

// Escuchar notificaciones en primer plano
onMessage(messaging, (payload) => {
  console.log("📩 Notificación en primer plano:", payload);
  new Notification(payload.notification?.title ?? "Notificación", {
    body: payload.notification?.body,
    icon: "/icons/icon-192x192.png"
  });
});
