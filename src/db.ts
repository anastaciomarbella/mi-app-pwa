import { openDB } from "idb";

export const dbPromise = openDB("tasks-db", 1, {
  upgrade(db) {
    if (!db.objectStoreNames.contains("tasks")) {
      db.createObjectStore("tasks", { keyPath: "id", autoIncrement: true });
    }
  },
});

export type Task = {
  id?: number;
  title: string;
  description?: string;
  date?: string;
};

export const saveTask = async (task: Task): Promise<void> => {
  const db = await dbPromise;
  await db.add("tasks", task);
};

export const getTasks = async (): Promise<Task[]> => {
  const db = await dbPromise;
  return await db.getAll("tasks");
};

export const deleteTask = async (id: number): Promise<void> => {
  const db = await dbPromise;
  await db.delete("tasks", id);
};

export const clearTasks = async (): Promise<void> => {
  const db = await dbPromise;
  await db.clear("tasks");
};

/**
 * Registrar sincronización en segundo plano (Background Sync)
 * Llamar cada vez que se guarda una tarea en modo offline
 */
export const registerSync = async (): Promise<void> => {
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    try {
      const reg = await navigator.serviceWorker.ready;
      const syncManager = (reg as any).sync;
      if (syncManager && typeof syncManager.register === 'function') {
        await syncManager.register('sync-entries');
        console.log('🔁 Sincronización en segundo plano registrada');
      } else {
        console.log('⚠️ SyncManager no disponible en ServiceWorkerRegistration');
      }
    } catch (err) {
      console.error('❌ Error registrando Background Sync:', err);
    }
  } else {
    console.log('⚠️ Background Sync no soportado en este navegador');
  }
};
