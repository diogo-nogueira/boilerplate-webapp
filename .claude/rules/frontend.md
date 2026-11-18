---
paths:
  - "frontend/**"
---

# Convenções do frontend

- Uma página nova acrescenta-se em `frontend/src/pages/`, no menu em `frontend/src/navigation.ts` e nas rotas em `frontend/src/App.tsx`. O nome da aplicação está só em `frontend/src/appName.ts`.
- Cores e medidas só pelos tokens de `frontend/src/styles/tokens.css` (claro e escuro); texto com contraste de pelo menos 4.5:1.

## Peças reutilizáveis (`frontend/src/`)

- `api/client.ts`: `apiGet`, `apiSend` (com CSRF), `ApiError` e `setUnauthorizedHandler`. Sessão terminada leva ao Entrar; falta de permissão mostra a mensagem do servidor.
- `hooks/useApiData.ts` (carregar dados de um GET) e `hooks/useFormErrors.tsx`, que usa `fieldErrors.ts` (na raiz de `src/`: `splitFieldErrors`, `formErrorsFrom`).
- `components/Pagination.tsx` (`Pagination`, `FirstPageButton`) e `pagination.ts` (`pageFromParams`, `pageQuery`): a página fica no URL. A resposta paginada tem o tipo `Page<T>` em `api/types.ts`.
- `format.ts`: `addDays`, `todayIso`, `formatShortDate`, `formatDayRange` e `formatQuantity` (datas AAAA-MM-DD e números em pt-PT).
- `test/renderApp.tsx`: `renderApp(url)` mostra a app inteira num endereço, com o `AuthProvider` real, para os testes de ecrã.
- `styles/app.css`: tabela, formulário, botões, etiquetas e faixas.

## Padrões

- Pedido de escrita: `apiSend` envia e `useFormErrors` (com `splitFieldErrors`) mostra cada erro junto do seu campo; os erros sem campo vão para a faixa.
- Lista paginada: `Pagination` e `pageFromParams`/`pageQuery`.
- Testes de ecrã: ficheiros `*.test.tsx` ao lado das páginas, com React Testing Library e `userEvent` sobre o Vitest e o jsdom; a API simula-se com `vi.mock("../api/client")` (exemplos: `pages/LoginPage.test.tsx`, `components/Layout.test.tsx`). A limpeza entre testes está em `frontend/src/test/setup.ts`.
