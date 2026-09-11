import { useEffect, useState } from "react";
import { listarAlertas } from "../api/energia";
import type { Alerta, PagedResult } from "../api/types";
import { Topbar } from "./Topbar";
import { Pagination } from "./Pagination";
import { ListSkeleton } from "./Skeleton";
import { IconAlert } from "./icons";

const PAGE_SIZE = 8;

function tempo(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function Alertas() {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<PagedResult<Alerta> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    listarAlertas(page, PAGE_SIZE)
      .then((res) => active && setData(res))
      .catch(() => active && setError("Não foi possível carregar os alertas."))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [page]);

  return (
    <>
      <Topbar title="Alertas de consumo" sub="Picos que excederam o limite definido por equipamento" />

      <div className="panel card reveal d2">
        <div className="panel-head">
          <h3>Ocorrências</h3>
          <span className="chip"><i className="dotc" style={{ background: "var(--danger)" }} />Acima do limite</span>
        </div>

        {error && <div className="banner err">{error}</div>}

        {loading ? (
          <ListSkeleton rows={5} />
        ) : !data || data.items.length === 0 ? (
          <div className="state-note">Nenhum alerta. Consumo dentro dos limites.</div>
        ) : (
          <div className="alist">
            {data.items.map((a) => (
              <div
                key={a.id}
                className="alert card"
                style={{ borderColor: "rgba(255,81,97,0.4)", ["--bar" as string]: "var(--danger)" }}
              >
                <div className="ico" style={{ background: "rgba(255,81,97,0.16)", color: "var(--danger)" }}>
                  <IconAlert width={18} height={18} />
                </div>
                <div>
                  <div className="src" style={{ color: "var(--danger)" }}>
                    {a.equipamento} · {tempo(a.dataHora)}
                  </div>
                  <div className="title">{a.mensagem}</div>
                  <div className="meta">
                    Consumo registrado: <span className="mono">{a.consumoRegistrado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span> kWh
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {data && (
          <Pagination
            page={data.page}
            totalPages={data.totalPages}
            totalItems={data.totalItems}
            onChange={setPage}
          />
        )}
      </div>
    </>
  );
}
