import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError, apiGet } from "../api/client";
import { useApiData } from "./useApiData";

vi.mock("../api/client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../api/client")>()),
  apiGet: vi.fn(),
}));

const FALLBACK = "Não foi possível carregar.";

describe("useApiData", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("começa a carregar e depois devolve os dados", async () => {
    vi.mocked(apiGet).mockResolvedValue({ n: 1 });
    const { result } = renderHook(() => useApiData<{ n: number }>("/api/x/", FALLBACK));

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual({ n: 1 });
    expect(result.current.error).toBeNull();
  });

  it("mostra o detalhe de um ApiError e não deixa dados por baixo", async () => {
    vi.mocked(apiGet).mockRejectedValue(new ApiError(500, "Falhou no servidor."));
    const { result } = renderHook(() => useApiData("/api/x/", FALLBACK));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe("Falhou no servidor.");
    expect(result.current.data).toBeNull();
  });

  it("usa a mensagem por defeito quando o erro não vem do servidor", async () => {
    vi.mocked(apiGet).mockRejectedValue(new Error("rede"));
    const { result } = renderHook(() => useApiData("/api/x/", FALLBACK));

    await waitFor(() => expect(result.current.error).toBe(FALLBACK));
  });

  it("ignora a resposta de um endereço antigo depois de o endereço mudar", async () => {
    let resolveOld: (value: unknown) => void = () => {};
    vi.mocked(apiGet).mockImplementation((path: string) =>
      path === "/api/a/"
        ? new Promise((resolve) => {
            resolveOld = resolve;
          })
        : Promise.resolve({ from: path }),
    );
    const { result, rerender } = renderHook(({ path }) => useApiData("/" + path, FALLBACK), {
      initialProps: { path: "api/a/" },
    });

    rerender({ path: "api/b/" });
    await waitFor(() => expect(result.current.data).toEqual({ from: "/api/b/" }));

    // O act deixa o React aplicar a atualização de estado, se o hook a fizesse.
    await act(async () => {
      resolveOld({ from: "/api/a/" });
    });
    expect(result.current.data).toEqual({ from: "/api/b/" });
    expect(result.current.loading).toBe(false);
  });

  it("volta a pedir os mesmos dados quando o reloadKey muda", async () => {
    vi.mocked(apiGet).mockResolvedValueOnce({ n: 1 }).mockResolvedValueOnce({ n: 2 });
    const { result, rerender } = renderHook(({ key }) => useApiData("/api/x/", FALLBACK, key), {
      initialProps: { key: 0 },
    });
    await waitFor(() => expect(result.current.data).toEqual({ n: 1 }));

    rerender({ key: 1 });
    await waitFor(() => expect(result.current.data).toEqual({ n: 2 }));
    expect(vi.mocked(apiGet)).toHaveBeenCalledTimes(2);
  });
});
