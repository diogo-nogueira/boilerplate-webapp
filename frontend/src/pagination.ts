// A página vive no endereço (?page=N), igual nas listas com páginas.

// Página do endereço: só números inteiros a partir de 1; o resto conta como página 1.
export function pageFromParams(params: URLSearchParams): number {
  const page = Number(params.get("page"));
  return Number.isInteger(page) && page >= 1 ? page : 1;
}

// A página 1 é a omissão, por isso não vai para o endereço.
export function pageQuery(page: number): string {
  return page > 1 ? `?page=${page}` : "";
}
