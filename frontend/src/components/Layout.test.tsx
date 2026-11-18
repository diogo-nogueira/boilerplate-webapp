import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError, apiGet, apiSend } from "../api/client";
import { APP_NAME } from "../appName";
import { renderApp } from "../test/renderApp";

vi.mock("../api/client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../api/client")>()),
  apiGet: vi.fn(),
  apiSend: vi.fn(),
}));

describe("Layout", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(apiGet).mockResolvedValue({ username: "ana", display_name: "Ana Silva" });
  });

  it("mostra na barra de topo o nome da aplicação, o Início e o utilizador", async () => {
    renderApp("/");

    const banner = await screen.findByRole("banner");
    expect(within(banner).getByText(APP_NAME)).toBeTruthy();
    expect(within(banner).getByRole("link", { name: "Início" }).getAttribute("aria-current")).toBe(
      "page",
    );
    expect(within(banner).getByText("Ana Silva")).toBeTruthy();
  });

  it("termina a sessão ao carregar em Sair e volta ao Entrar", async () => {
    const user = userEvent.setup();
    vi.mocked(apiSend).mockResolvedValue(undefined);
    renderApp("/");

    await user.click(await screen.findByRole("button", { name: "Sair" }));

    expect(vi.mocked(apiSend)).toHaveBeenCalledWith("POST", "/api/auth/logout/");
    expect(await screen.findByRole("heading", { name: "Entrar" })).toBeTruthy();
  });

  it("mostra o erro e mantém a sessão quando não consegue sair", async () => {
    const user = userEvent.setup();
    vi.mocked(apiSend).mockRejectedValue(new ApiError(0, "Sem ligação ao servidor."));
    renderApp("/");

    await user.click(await screen.findByRole("button", { name: "Sair" }));

    expect((await screen.findByRole("alert")).textContent).toBe("Sem ligação ao servidor.");
    expect(screen.getByRole("heading", { name: "Bem-vindo, Ana Silva" })).toBeTruthy();
  });
});
