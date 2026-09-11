import { IconChevronLeft, IconChevronRight } from "./icons";

interface Props {
  page: number;
  totalPages: number;
  totalItems: number;
  onChange: (page: number) => void;
}

export function Pagination({ page, totalPages, totalItems, onChange }: Props) {
  const pages = Math.max(totalPages, 1);
  return (
    <div className="pager">
      <span className="dim mono">
        {totalItems} registros · página {page}/{pages}
      </span>
      <div className="pages">
        <button onClick={() => onChange(page - 1)} disabled={page <= 1} aria-label="Anterior">
          <IconChevronLeft width={18} height={18} />
        </button>
        <button onClick={() => onChange(page + 1)} disabled={page >= pages} aria-label="Próxima">
          <IconChevronRight width={18} height={18} />
        </button>
      </div>
    </div>
  );
}
