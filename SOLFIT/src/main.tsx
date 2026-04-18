import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import { GameProvider } from "./context/GameContext.tsx";
import "./styles/index.css";

createRoot(document.getElementById("root")!).render(
  <GameProvider>
    <App />
  </GameProvider>
);
