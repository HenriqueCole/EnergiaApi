import { useState } from "react";
import { registrarLeitura } from "../api/energia";
import { ApiError } from "../api/client";
import type { Consumo } from "../api/types";
import { Topbar } from "./Topbar";
import { IconCheck, IconAlert } from "./icons";

const EQUIPAMENTOS = [
  { id: 1, nome: "Ar-condicionado Sala A", limite: 10 },
  { id: 2, nome: "Servidor Datacenter", limite: 20 },
];

export function NovaLeitura() {
  const [equipamentoId, setEquipamentoId] = useState(1);
  const [consumo, setConsumo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<Consumo | null>(null);
  const [excedeu, setExcedeu] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const equipamento = EQUIPAMENTOS.find((e) => e.id === equipamentoId)!;
  const valor = Number(consumo.replace(",", "."));
  const invalido = consumo.trim() === "" || Number.isNaN(valor) || valor < 0;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (invalido) return;
    setSubmitting(true);
    setError(null);
    setResult(null);
    try {
      const leitura = await registrarLeitura({ equipamentoId, consumoKwh: valor });
      setResult(leitura);
      setExcedeu(valor > equipamento.limite);
      setConsumo("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Falha ao registrar leitura.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Topbar title="Nova leitura" sub="Registre o consumo e dispare alertas automáticos de pico" />

      <div className="panel card reveal d2" style={{ maxWidth: 560 }}>
        <div className="panel-head">
          <h3>Registrar consumo</h3>
        </div>

        <form className="form-grid" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="equip">Equipamento</label>
            <select
              id="equip"
              value={equipamentoId}
              onChange={(e) => setEquipamentoId(Number(e.target.value))}
            >
              {EQUIPAMENTOS.map((e) => (
                <option key={e.id} value={e.id}>{e.nome}</option>
              ))}
            </select>
            <span className="hint">Limite de alerta: {equipamento.limite} kWh</span>
          </div>

          <div className="field">
            <label htmlFor="consumo">Consumo (kWh)</label>
            <input
              id="consumo"
              inputMode="decimal"
              placeholder="Ex.: 15"
              value={consumo}
              onChange={(e) => setConsumo(e.target.value)}
            />
            {consumo.trim() !== "" && invalido && (
              <span className="err">Informe um valor numérico positivo.</span>
            )}
            {!invalido && valor > equipamento.limite && (
              <span className="hint" style={{ color: "var(--amber)" }}>
                Acima do limite - vai gerar um alerta.
              </span>
            )}
          </div>

          {error && <div className="banner err">{error}</div>}

          {result && (
            <div className={`banner ${excedeu ? "warn" : "ok"}`}>
              {excedeu ? <IconAlert width={18} height={18} /> : <IconCheck width={18} height={18} />}
              <span>
                Leitura #{result.id} registrada · {result.consumoKwh.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} kWh
                {excedeu ? " · alerta disparado" : ""}
              </span>
            </div>
          )}

          <button className="btn btn-primary" type="submit" disabled={submitting || invalido}>
            {submitting ? "Registrando..." : "Registrar leitura"}
          </button>
        </form>
      </div>
    </>
  );
}
