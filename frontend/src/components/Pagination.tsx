type PaginationProps = {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
};

// Ao mudar de página, a vista volta ao topo (a nova página começa por cima).
function goToPage(page: number, onChange: (page: number) => void) {
  window.scrollTo({ top: 0 });
  onChange(page);
}

// Anterior e seguinte por baixo de uma tabela. Com uma só página não mostra nada.
export function Pagination({ page, totalPages, onChange }: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }
  return (
    <nav className="pagination" aria-label="Paginação">
      <button
        type="button"
        className="button button-quiet button-small"
        disabled={page <= 1}
        onClick={() => goToPage(page - 1, onChange)}
      >
        Anterior
      </button>
      <span className="pagination-position">
        Página {page} de {totalPages}
      </span>
      <button
        type="button"
        className="button button-quiet button-small"
        disabled={page >= totalPages}
        onClick={() => goToPage(page + 1, onChange)}
      >
        Seguinte
      </button>
    </nav>
  );
}

// Mostra-se junto do erro quando uma página que já não existe falha (a lista encolheu).
export function FirstPageButton({ page, onClick }: { page: number; onClick: () => void }) {
  if (page <= 1) {
    return null;
  }
  return (
    <button type="button" className="button button-quiet" onClick={onClick}>
      Voltar à primeira página
    </button>
  );
}
