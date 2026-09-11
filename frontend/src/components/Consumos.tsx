import { useEffect, useState } from "react";
import { listarConsumos } from "../api/energia";
import type { Consumo, PagedResult } from "../api/types";
import { Topbar } from "./Topbar";
import { Pagination } from "./Pagination";
import { TableSkeleton } from "./Skeleton";

const PAGE_SIZE = 8;

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function Consumos() {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<PagedResult<Consumo> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    listarConsumos(page, PAGE_SIZE)
      .then((res) => active && setData(res))
      .catch(() => active && setError("Não foi possível carregar os consumos."))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [page]);

  return (
    <>
      <Topbar title="Consumos registrados" sub="Histórico paginado de leituras de energia" />

      <div className="panel card reveal d2">
        <div className="panel-head">
          <h3>Leituras</h3>
          <span className="chip mono">{PAGE_SIZE} por página</span>
        </div>

        {error && <div className="banner err">{error}</div>}

        {loading ? (
          <TableSkeleton rows={PAGE_SIZE} />
        ) : !data || data.items.length === 0 ? (
          <div className="state-note">Nenhuma leitura encontrada.</div>
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Equipamento</th>
                  <th>Setor</th>
                  <th>Data / hora</th>
                  <th>Consumo</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((c) => (
                  <tr key={c.id}>
                    <td className="mono dim">#{c.id}</td>
                    <td>{c.equipamento}</td>
                    <td><span className="tag">{c.setor}</span></td>
                    <td className="mono muted">{formatDate(c.dataHora)}</td>
                    <td className="kwh">{c.consumoKwh.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} kWh</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
