// Formas das respostas da API. Os nomes dos campos são os do backend.
// Datas chegam como texto AAAA-MM-DD.

// GET /api/auth/me/ e resposta do login
export type Me = {
  username: string;
  display_name: string;
};

// Resposta paginada das listas da API
export type Page<T> = { count: number; page: number; total_pages: number; results: T[] };
