import { useState } from "react";
import { useAuth } from "./auth/AuthContext";
import { Login } from "./components/Login";
import { Sidebar } from "./components/Sidebar";
import type { View } from "./components/Sidebar";
import { Dashboard } from "./components/Dashboard";
import { Consumos } from "./components/Consumos";
import { NovaLeitura } from "./components/NovaLeitura";
import { Alertas } from "./components/Alertas";
import "./styles/app.css";

export default function App() {
  const { isAuthenticated } = useAuth();
  const [view, setView] = useState<View>("dashboard");

  if (!isAuthenticated) return <Login />;

  return (
    <div className="shell">
      <Sidebar view={view} onChange={setView} />
      <main className="main" key={view}>
        {view === "dashboard" && <Dashboard />}
        {view === "consumos" && <Consumos />}
        {view === "leitura" && <NovaLeitura />}
        {view === "alertas" && <Alertas />}
      </main>
    </div>
  );
}
