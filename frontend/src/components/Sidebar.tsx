import { useAuth } from "../auth/AuthContext";
import { IconBolt, IconChart, IconList, IconAlert, IconPlus, IconLogout } from "./icons";

export type View = "dashboard" | "consumos" | "leitura" | "alertas";

const items: { id: View; label: string; icon: typeof IconChart }[] = [
  { id: "dashboard", label: "Painel", icon: IconChart },
  { id: "consumos", label: "Consumos", icon: IconList },
  { id: "leitura", label: "Nova leitura", icon: IconPlus },
  { id: "alertas", label: "Alertas", icon: IconAlert },
];

export function Sidebar({ view, onChange }: { view: View; onChange: (v: View) => void }) {
  const { usuario, signOut } = useAuth();
  const inicial = (usuario ?? "?").charAt(0).toUpperCase();

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="glyph"><IconBolt width={24} height={24} /></div>
        <div>
          <h1>Energia<span>Watch</span></h1>
          <p>ESG Monitor</p>
        </div>
      </div>

      {items.map(({ id, label, icon: Icon }) => (
        <div
          key={id}
          className={`nav-item${view === id ? " active" : ""}`}
          onClick={() => onChange(id)}
        >
          <Icon />
          <span>{label}</span>
        </div>
      ))}

      <div className="spacer" />

      <div className="user-card">
        <div className="avatar">{inicial}</div>
        <div className="info">
          <strong>{usuario}</strong>
          <span>Administrador</span>
        </div>
        <button className="icon-btn" onClick={signOut} title="Sair" aria-label="Sair">
          <IconLogout width={18} height={18} />
        </button>
      </div>
    </aside>
  );
}
