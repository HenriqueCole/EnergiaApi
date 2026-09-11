import { useEffect, useState } from "react";
import { gerarRelatorio, listarConsumos } from "../api/energia";
import type { Consumo, Relatorio } from "../api/types";
import { Topbar } from "./Topbar";
import { StatGridSkeleton, ChartSkeleton, ListSkeleton } from "./Skeleton";
import { IconBolt, IconGauge, IconPeak, IconAlert, IconServer } from "./icons";

const EQUIPAMENTOS = [1, 2];

function fmt(value: number, casas = 1) {
  return value.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });
}

export function Dashboard() {
  const [relatorios, setRelatorios] = useState<Relatorio[]>([]);
  const [consumos, setConsumos] = useState<Consumo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [rels, consumosPage] = await Promise.all([
          Promise.all(EQUIPAMENTOS.map((id) => gerarRelatorio(id))),
          listarConsumos(1, 12),
        ]);
        if (!active) return;
        setRelatorios(rels);
        setConsumos([...consumosPage.items].reverse());
      } catch {
        if (active) setError("Não foi possível carregar o painel. A API está rodando?");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const total = relatorios.reduce((acc, r) => acc + r.consumoTotalKwh, 0);
  const leituras = relatorios.reduce((acc, r) => acc + r.qtdLeituras, 0);
  const alertas = relatorios.reduce((acc, r) => acc + r.qtdAlertas, 0);
  const medio = leituras > 0 ? total / leituras : 0;
  const pico = relatorios.reduce((acc, r) => Math.max(acc, r.maiorPico), 0);
  const maxBar = Math.max(1, ...consumos.map((c) => c.consumoKwh));

  return (
    <>
      <Topbar title="Painel de eficiência" sub="Visão geral do consumo e dos alertas de pico" />

      {error && <div className="banner err reveal d2">{error}</div>}

      {loading ? (
        <StatGridSkeleton />
      ) : (
      <div className="stat-grid">
        <div className="stat card reveal d2">
          <div className="ico"><IconBolt width={20} height={20} /></div>
          <div className="value mono">{fmt(total)}<small>kWh</small></div>
          <div className="label">Consumo acumulado</div>
        </div>
        <div className="stat card amber reveal d3">
          <div className="ico"><IconGauge width={20} height={20} /></div>
          <div className="value mono">{fmt(medio, 2)}<small>kWh</small></div>
          <div className="label">Média por leitura</div>
        </div>
        <div className="stat card cyan reveal d4">
          <div className="ico"><IconPeak width={20} height={20} /></div>
          <div className="value mono">{fmt(pico)}<small>kWh</small></div>
          <div className="label">Maior pico registrado</div>
        </div>
        <div className="stat card danger reveal d5">
          <div className="ico"><IconAlert width={20} height={20} /></div>
          <div className="value mono">{alertas}</div>
          <div className="label">Alertas disparados</div>
        </div>
      </div>
      )}

      <div className="grid-2">
        <div className="panel card reveal d4">
          <div className="panel-head">
            <h3>Leituras recentes</h3>
            <span className="chip"><i className="dotc" style={{ background: "var(--accent)" }} />kWh por leitura</span>
          </div>
          {loading ? (
            <ChartSkeleton />
          ) : consumos.length === 0 ? (
            <div className="state-note">Sem leituras ainda. Registre a primeira em "Nova leitura".</div>
          ) : (
            <div className="chart">
              {consumos.map((c) => (
                <div
                  key={c.id}
                  className={`bar${c.consumoKwh >= pico && pico > 0 ? " over" : ""}`}
                  title={`${c.equipamento} · ${fmt(c.consumoKwh, 2)} kWh`}
                >
                  <div className="fill" style={{ height: `${(c.consumoKwh / maxBar) * 100}%` }} />
                  <span className="cap">{fmt(c.consumoKwh, 0)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="panel card reveal d5">
          <div className="panel-head">
            <h3>Por equipamento</h3>
          </div>
          {loading ? (
            <ListSkeleton rows={2} />
          ) : (
          <div className="alist">
            {relatorios.map((r) => (
              <div key={r.equipamentoId} className="alert" style={alertStyle(r.qtdAlertas)}>
                <div className="ico" style={icoStyle(r.qtdAlertas)}><IconServer width={18} height={18} /></div>
                <div>
                  <div className="src" style={srcStyle(r.qtdAlertas)}>
                    {r.qtdAlertas > 0 ? `${r.qtdAlertas} alertas` : "Dentro do limite"}
                  </div>
                  <div className="title">{r.equipamento}</div>
                  <div className="meta">
                    <span className="mono">{fmt(r.consumoTotalKwh)}</span> kWh · {r.qtdLeituras} leituras
                  </div>
                </div>
              </div>
            ))}
          </div>
          )}
        </div>
      </div>
    </>
  );
}

function alertStyle(qtd: number): React.CSSProperties {
  return qtd > 0
    ? { borderColor: "rgba(255,81,97,0.4)", ["--bar" as string]: "var(--danger)" }
    : { borderColor: "rgba(46,230,166,0.4)", ["--bar" as string]: "var(--accent)" };
}

function icoStyle(qtd: number) {
  return qtd > 0
    ? { background: "rgba(255,81,97,0.16)", color: "var(--danger)" }
    : { background: "rgba(46,230,166,0.16)", color: "var(--accent)" };
}

function srcStyle(qtd: number) {
  return { color: qtd > 0 ? "var(--danger)" : "var(--accent)" };
}
