import { useState, useEffect } from "react";
import {
  saveTask,
  getTasks,
  deleteTask,
  registerSync,
} from "./db";
import type { Task } from "./db";
import { requestNotificationPermission } from "./firebase";

function App() {
  const [tarea, setTarea] = useState("");
  const [listaTareas, setListaTareas] = useState<Task[]>([]);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Cargar tareas e inicializar notificaciones
  useEffect(() => {
    async function initApp() {
      const allTasks = await getTasks();
      setListaTareas(allTasks);

      // Pedir permiso de notificaciones Firebase
      await requestNotificationPermission();
    }

    initApp();

    // Detectar cambios de conexión
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Formulario: agregar o editar tarea
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (tarea.trim() === "") return;

    if (editIndex !== null) {
      const nuevasTareas = [...listaTareas];
      nuevasTareas[editIndex].title = tarea;
      setListaTareas(nuevasTareas);
      setEditIndex(null);

      if (nuevasTareas[editIndex].id !== undefined) {
        await deleteTask(nuevasTareas[editIndex].id);
      }
      await saveTask(nuevasTareas[editIndex]);
      await registerSync();

      // Notificación local al editar
      new Notification("Tarea actualizada", {
        body: `Se actualizó: ${tarea}`,
        icon: "/icons/icon-192.png",
      });
    } else {
      const nuevaTarea: Task = {
        title: tarea,
        date: new Date().toLocaleString(),
      };
      setListaTareas([...listaTareas, nuevaTarea]);
      await saveTask(nuevaTarea);
      await registerSync();

      // Notificación local al agregar
      new Notification("Nueva tarea agregada", {
        body: `Se agregó: ${tarea}`,
        icon: "/icons/icon-192.png",
      });
    }

    setTarea("");
  };

  // Eliminar tarea
  const handleEliminar = async (index: number) => {
    const tareaAEliminar = listaTareas[index];
    if (tareaAEliminar.id !== undefined) {
      await deleteTask(tareaAEliminar.id);
    }
    const nuevasTareas = listaTareas.filter((_, i) => i !== index);
    setListaTareas(nuevasTareas);

    // Notificación local
    new Notification("Tarea eliminada", {
      body: `Se eliminó una tarea.`,
      icon: "/icons/icon-192.png",
    });
  };

  // Editar tarea
  const handleEditar = (index: number) => {
    setTarea(listaTareas[index].title);
    setEditIndex(index);
  };

  return (
    <div
      style={{
        backgroundColor: "#f8b3c8",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        color: "#333",
        padding: "2rem",
      }}
    >
      <h1>🌷 Bienvenida a tu App React 🌷</h1>
      <p>Aplicación progresiva con almacenamiento offline y notificaciones.</p>
      <p style={{ color: isOnline ? "green" : "red" }}>
        Estado de conexión: {isOnline ? "Online" : "Offline"}
      </p>

      {/* Formulario */}
      <form onSubmit={handleSubmit} style={{ marginBottom: "2rem" }}>
        <input
          type="text"
          placeholder="Escribe una actividad..."
          value={tarea}
          onChange={(e) => setTarea(e.target.value)}
          style={{
            padding: "0.5rem",
            width: "250px",
            borderRadius: "5px",
            border: "1px solid #ccc",
          }}
        />
        <button
          type="submit"
          style={{
            marginLeft: "1rem",
            padding: "0.5rem 1rem",
            backgroundColor: "#fff",
            color: "#e91e63",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          {editIndex !== null ? "Guardar" : "Agregar"}
        </button>
      </form>

      {/* Lista de tareas */}
      <ul style={{ listStyle: "none", padding: 0, width: "300px" }}>
        {listaTareas.map((t, index) => (
          <li
            key={index}
            style={{
              background: "#fff",
              marginBottom: "0.5rem",
              padding: "0.5rem 1rem",
              borderRadius: "8px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              color: "#e91e63",
            }}
          >
            <span>{t.title}</span>
            <div>
              <button
                onClick={() => handleEditar(index)}
                style={{
                  marginRight: "0.5rem",
                  backgroundColor: "#f48fb1",
                  color: "#fff",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                  padding: "3px 8px",
                  fontWeight: "bold",
                }}
              >
                Editar
              </button>

              <button
                onClick={() => handleEliminar(index)}
                style={{
                  backgroundColor: "transparent",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "1rem",
                  color: "#e91e63",
                  fontWeight: "bold",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <span style={{ marginRight: "4px" }}>❤️</span> Eliminar
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
