// Importa Firebase
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCnOsFkxZEdMXPu_DtEfI2Rexkq4Fsje2k",
  authDomain: "mi-awp.firebaseapp.com",
  projectId: "mi-awp",
  storageBucket: "mi-awp.firebasestorage.app",
  messagingSenderId: "580697464751",
  appId: "1:580697464751:web:06fc2a00db56b10661d95a",
  measurementId: "G-1SKW4SGEDN"
};
// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Firestore
export const db = getFirestore(app);
// Analytics
export const analytics = getAnalytics(app);
