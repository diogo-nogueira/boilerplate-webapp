import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError, apiGet, apiSend } from "../api/client";
import { APP_NAME } from "../appName";
import { renderApp } from "../test/renderApp";

// Mantém o ApiError verdadeiro: os testes de erro rejeitam com ele.
vi.mock("../api/client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../api/client")>()),
  apiGet: vi.fn(),
  apiSend: vi.fn(),
}));

describe("LoginPage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Sem sessão: o /me/ recusa.
    vi.mocked(apiGet).mockRejectedValue(new ApiError(403, "Não autenticado."));
  });

  it("mostra o nome da aplicação e o formulário de entrada", async () => {
    renderApp("/entrar");

    expect(await screen.findByRole("heading", { name: "Entrar" })).toBeTruthy();
    expect(screen.getByText(APP_NAME)).toBeTruthy();
    expect(screen.getByLabelText("Utilizador")).toBeTruthy();
    expect(screen.getByLabelText("Palavra-passe")).toBeTruthy();
  });

  it("entra com o utilizador e a palavra-passe e abre o Início", async () => {
    const user = userEvent.setup();
    vi.mocked(apiSend).mockResolvedValue({ username: "ana", display_name: "Ana Silva" });
    renderApp("/entrar");

    await user.type(await screen.findByLabelText("Utilizador"), " ana ");
    await user.type(screen.getByLabelText("Palavra-passe"), "segredo");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    expect(await screen.findByRole("heading", { name: "Bem-vindo, Ana Silva" })).toBeTruthy();
    expect(vi.mocked(apiSend)).toHaveBeenCalledWith("POST", "/api/auth/login/", {
      username: "ana",
      password: "segredo",
    });
  });

  it("mostra a mensagem do servidor quando o login falha", async () => {
    const user = userEvent.setup();
    const detail = "Utilizador ou palavra-passe incorretos.";
    vi.mocked(apiSend).mockRejectedValue(new ApiError(400, detail));
    renderApp("/entrar");

    await user.type(await screen.findByLabelText("Utilizador"), "ana");
    await user.type(screen.getByLabelText("Palavra-passe"), "errada");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    expect((await screen.findByRole("alert")).textContent).toBe(detail);
    expect(screen.getByRole("heading", { name: "Entrar" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Entrar" }).hasAttribute("disabled")).toBe(false);
  });

  it("leva para o Entrar quem abre o Início sem sessão", async () => {
    renderApp("/");

    expect(await screen.findByRole("heading", { name: "Entrar" })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: /Bem-vindo/ })).toBeNull();
  });
});
