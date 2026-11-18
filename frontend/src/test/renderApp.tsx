import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router";

import App from "../App";
import { AuthProvider } from "../auth/AuthContext";

// A app inteira num endereço, com a sessão real do AuthProvider.
// Cada ficheiro de teste simula a API com vi.mock("../api/client").
export function renderApp(url: string) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>,
  );
}
