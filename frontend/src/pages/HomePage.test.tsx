import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { apiGet } from "../api/client";
import { renderApp } from "../test/renderApp";

vi.mock("../api/client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../api/client")>()),
  apiGet: vi.fn(),
  apiSend: vi.fn(),
}));

describe("HomePage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(apiGet).mockResolvedValue({ username: "ana", display_name: "Ana Silva" });
  });

  it("dá as boas-vindas pelo nome e diz por onde começar", async () => {
    renderApp("/");

    expect(await screen.findByRole("heading", { name: "Bem-vindo, Ana Silva" })).toBeTruthy();
    expect(vi.mocked(apiGet)).toHaveBeenCalledWith("/api/auth/me/");
    const main = screen.getByRole("main");
    expect(main.textContent).toContain("README.md");
    expect(main.textContent).toContain("CLAUDE.md");
  });

  it("leva um endereço desconhecido para o Início", async () => {
    renderApp("/nao-existe");

    expect(await screen.findByRole("heading", { name: "Bem-vindo, Ana Silva" })).toBeTruthy();
  });

  it("leva para o Início quem já tem sessão e abre o Entrar", async () => {
    renderApp("/entrar");

    expect(await screen.findByRole("heading", { name: "Bem-vindo, Ana Silva" })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Entrar" })).toBeNull();
  });
});
