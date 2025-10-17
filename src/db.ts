// src/db.ts
import { openDB } from "idb";
import { db as firestore } from "./firebase";
import { collection, addDoc, getDocs, deleteDoc, doc } from "firebase/firestore";

export const dbPromise = openDB("tasks-db", 1, {
  upgrade(db) {
    if (!db.objectStoreNames.contains("tasks")) {
      db.createObjectStore("tasks", { keyPath: "id", autoIncrement: true });
    }
  },
});

export type Task = {
  id?: number | string; // Número local o ID de Firestore
  title: string;
  description?: string;
  date?: string;
};

// ------------------- IndexedDB -------------------
export const saveTask = async (task: Task): Promise<void> => {
  const db = await dbPromise;
  await db.add("tasks", task);
};

export const getTasks = async (): Promise<Task[]> => {
  const db = await dbPromise;
  return await db.getAll("tasks");
};

export const deleteTask = async (id: number | string): Promise<void> => {
  const db = await dbPromise;
  await db.delete("tasks", id);
};

export const clearTasks = async (): Promise<void> => {
  const db = await dbPromise;
  await db.clear("tasks");
};

// ------------------- Firebase Firestore -------------------
export const saveTaskToFirestore = async (task: Task): Promise<void> => {
  await addDoc(collection(firestore, "tareas"), task);
};

export const getTasksFromFirestore = async (): Promise<Task[]> => {
  const snapshot = await getDocs(collection(firestore, "tareas"));
  return snapshot.docs.map((docu) => ({
    id: docu.id,
    ...docu.data(),
  })) as Task[];
};

export const deleteTaskFromFirestore = async (id: string): Promise<void> => {
  await deleteDoc(doc(firestore, "tareas", id));
};

// ------------------- Background Sync -------------------
/**
 * Registrar sincronización en segundo plano (Background Sync)
 * Llamar cada vez que se guarda o elimina una tarea en modo offline
 */
export const registerSync = async (): Promise<void> => {
  if ("serviceWorker" in navigator && "SyncManager" in window) {
    try {
      const reg = await navigator.serviceWorker.ready;
      // 'sync' is not present on ServiceWorkerRegistration in all TypeScript lib versions,
      // so cast to any before calling register to avoid compile error and check at runtime.
      if ((reg as any).sync && typeof (reg as any).sync.register === "function") {
        await (reg as any).sync.register("sync-entries");
        console.log("🔁 Sincronización en segundo plano registrada");
      } else {
        console.log("⚠️ Background Sync API no disponible en esta ServiceWorkerRegistration");
      }
    } catch (err) {
      console.error("❌ Error registrando Background Sync:", err);
    }
  } else {
    console.log("⚠️ Background Sync no soportado en este navegador");
  }
};
