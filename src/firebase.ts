import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyCnOsFkxZEdMXPu_DtEfI2Rexkq4Fsje2k",
  authDomain: "mi-awp.firebaseapp.com",
  projectId: "mi-awp",
  storageBucket: "mi-awp.firebasestorage.app",
  messagingSenderId: "580697464751",
  appId: "1:580697464751:web:06fc2a00db56b10661d95a",
  measurementId: "G-1SKW4SGEDN",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const messaging = getMessaging(app);

// Registrar SW
navigator.serviceWorker.register('/firebase-messaging-sw.js')
  .then(reg => console.log('✅ SW Firebase Messaging registrado', reg))
  .catch(err => console.error('❌ Error registrando SW Firebase', err));

// Pedir permiso y obtener token
export const requestNotificationPermission = async () => {
  if ("Notification" in window) {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      try {
        const registration = await navigator.serviceWorker.ready;
        const token = await getToken(messaging, {
          vapidKey: "BCwXvmapgzoj2vk_FKaNeWykYtJYsWhp_QI2Qx5eJE8wxm99R8pNNgtsyjvNMImptgfhr2OwbGwDH98g4oI_owk",
          serviceWorkerRegistration: registration
        });
        console.log("🔑 Token FCM:", token);
      } catch (err) {
        console.error("❌ Error al obtener token de notificación:", err);
      }
    }
  }
};

// Mensajes en primer plano
onMessage(messaging, (payload) => {
  console.log("📩 Notificación foreground:", payload);
  new Notification(payload.notification?.title || "Notificación", {
    body: payload.notification?.body,
    icon: "/icons/icon-192x192.png"
  });
});

export { app, db, messaging };
