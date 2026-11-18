// Itens da barra de topo. Uma página nova acrescenta-se aqui e em App.tsx.
// Todas as páginas pedem sessão; o servidor verifica as permissões de cada pedido.

export type NavItem = {
  path: string;
  label: string;
};

export const HOME_PATH = "/";

export const NAV_ITEMS: NavItem[] = [{ path: HOME_PATH, label: "Início" }];
