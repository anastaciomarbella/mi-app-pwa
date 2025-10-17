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
  id?: number | string;
  title: string;
  description?: string;
  date?: string;
};

export const saveTask = async (task: Task) => {
  const db = await dbPromise;
  await db.add("tasks", task);
};

export const getTasks = async (): Promise<Task[]> => {
  const db = await dbPromise;
  return await db.getAll("tasks");
};

export const deleteTask = async (id: number | string) => {
  const db = await dbPromise;
  await db.delete("tasks", id);
};

// Firestore
export const saveTaskToFirestore = async (task: Task) => {
  await addDoc(collection(firestore, "tareas"), task);
};

export const getTasksFromFirestore = async (): Promise<Task[]> => {
  const snapshot = await getDocs(collection(firestore, "tareas"));
  return snapshot.docs.map(docu => ({ id: docu.id, ...docu.data() })) as Task[];
};

export const deleteTaskFromFirestore = async (id: string) => {
  await deleteDoc(doc(firestore, "tareas", id));
};

// Background Sync
export const registerSync = async () => {
  if ("serviceWorker" in navigator && "SyncManager" in window) {
    try {
      const reg = await navigator.serviceWorker.ready;
      if ((reg as any).sync && typeof (reg as any).sync.register === "function") {
        await (reg as any).sync.register("sync-entries");
        console.log("🔁 Sincronización en segundo plano registrada");
      }
    } catch (err) {
      console.error("❌ Error registrando Background Sync:", err);
    }
  }
};
