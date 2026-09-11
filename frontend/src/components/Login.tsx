import { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { ApiError } from "../api/client";
import { IconBolt } from "./icons";

export function Login() {
  const { signIn } = useAuth();
  const [usuario, setUsuario] = useState("admin");
  const [senha, setSenha] = useState("123456");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signIn(usuario.trim(), senha);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível entrar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-wrap">
      <div className="login-card card reveal d1">
        <div className="glyph"><IconBolt width={28} height={28} /></div>
        <div className="eyebrow">Plataforma ESG · Energia</div>
        <h1>Energia<span>Watch</span></h1>
        <p className="lead">Monitore o consumo, receba alertas de pico e acompanhe a eficiência energética dos seus equipamentos.</p>

        <form className="form-grid" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="usuario">Usuário</label>
            <input
              id="usuario"
              value={usuario}
              autoComplete="username"
              onChange={(e) => setUsuario(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="senha">Senha</label>
            <input
              id="senha"
              type="password"
              value={senha}
              autoComplete="current-password"
              onChange={(e) => setSenha(e.target.value)}
            />
          </div>

          {error && <div className="banner err">{error}</div>}

          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="login-hint">
          Demo: <code>admin</code> / <code>123456</code>
        </p>
      </div>
    </div>
  );
}
