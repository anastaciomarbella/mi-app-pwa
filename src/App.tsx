import { useEffect } from "react";

function App() {
  // ✅ Registrar el Service Worker al montar el componente
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((reg) => console.log("Service Worker registrado:", reg))
          .catch((err) => console.error("Error registrando SW:", err));
      });
    }
  }, []);

  // ✅ Lógica del botón (con React)
  const handleClick = () => {
    alert("¡Hola! PWA funcionando correctamente.");
  };

  // ✅ Render del botón
  return (
    <div style={{ textAlign: "center", marginTop: "3rem" }}>
      <h1>Mi App Progresiva</h1>
      <p>Haz clic en el botón para probar la PWA:</p>
      <button id="clickMe" onClick={handleClick}>
        ¡Haz clic aquí!
      </button>
    </div>
  );
}

export default App;
