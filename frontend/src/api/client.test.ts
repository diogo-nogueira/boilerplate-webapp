import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiError, apiGet, apiSend, setUnauthorizedHandler } from "./client";

function jsonResponse(body: string, status: number): Response {
  return new Response(body, { status, headers: { "Content-Type": "application/json" } });
}

afterEach(() => {
  vi.unstubAllGlobals();
  setUnauthorizedHandler(() => {});
  document.cookie = "csrftoken=; expires=Thu, 01 Jan 1970 00:00:00 GMT";
});

// Responde a cada caminho com o que estiver no mapa.
function fetchByPath(responses: Record<string, () => Response>) {
  return vi.fn().mockImplementation(async (path: string) => responses[path]());
}

describe("cliente da API", () => {
  it("envia o token CSRF lido do cookie nos pedidos POST", async () => {
    document.cookie = "csrftoken=abc123";
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    await apiSend("POST", "/api/auth/logout/");
    const headers = new Headers(fetchMock.mock.calls.at(-1)![1].headers);
    expect(headers.get("X-CSRFToken")).toBe("abc123");
  });

  it("chama o handler de sessão expirada num 403", async () => {
    const onUnauthorized = vi.fn();
    setUnauthorizedHandler(onUnauthorized);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse('{"detail":"x"}', 403)));
    await expect(apiGet("/api/items/")).rejects.toBeInstanceOf(ApiError);
    expect(onUnauthorized).toHaveBeenCalledOnce();
  });

  it("não chama o handler quando o login falha", async () => {
    document.cookie = "csrftoken=abc123";
    const onUnauthorized = vi.fn();
    setUnauthorizedHandler(onUnauthorized);
    const detail = "Utilizador ou palavra-passe incorretos.";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(`{"detail":"${detail}"}`, 400)));
    const error = await apiSend("POST", "/api/auth/login/", { username: "a", password: "b" })
      .catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(400);
    expect((error as ApiError).detail).toBe(detail);
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it("expõe os erros por campo de um 400 de validação", async () => {
    document.cookie = "csrftoken=abc123";
    const body = '{"end_date":["Fim antes do início."],"priority":["Fora do intervalo."]}';
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(body, 400)));
    const error = await apiSend("PATCH", "/api/items/1/", {}).catch((e) => e);
    expect((error as ApiError).fieldErrors).toEqual({
      end_date: ["Fim antes do início."],
      priority: ["Fora do intervalo."],
    });
    expect((error as ApiError).detail).toBe("Fim antes do início.");
  });

  it("pede o cookie CSRF antes do POST quando ainda não existe", async () => {
    document.cookie = "csrftoken=; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    const fetchMock = vi.fn().mockImplementation(async (path: string) => {
      if (path === "/api/auth/csrf/") {
        document.cookie = "csrftoken=novo";
        return new Response(null, { status: 204 });
      }
      return new Response(null, { status: 204 });
    });
    vi.stubGlobal("fetch", fetchMock);
    await apiSend("POST", "/api/auth/logout/");
    expect(fetchMock.mock.calls[0][0]).toBe("/api/auth/csrf/");
    const headers = new Headers(fetchMock.mock.calls[1][1].headers);
    expect(headers.get("X-CSRFToken")).toBe("novo");
  });

  it("usa uma mensagem genérica quando o erro não traz JSON", async () => {
    document.cookie = "csrftoken=abc123";
    const html = "<html><body>CSRF verification failed</body></html>";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      new Response(html, { status: 403, headers: { "Content-Type": "text/html" } }),
    ));
    const error = await apiSend("POST", "/api/auth/login/", {}).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).detail).toBe("Não foi possível concluir o pedido. Tente outra vez.");
  });

  it("devolve o JSON da resposta e aceita respostas sem corpo", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse('{"username":"ana"}', 200)));
    await expect(apiGet<{ username: string }>("/api/auth/me/")).resolves.toEqual({ username: "ana" });

    document.cookie = "csrftoken=abc123";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 204 })));
    await expect(apiSend("POST", "/api/auth/logout/")).resolves.toBeUndefined();
  });

  it("chama o handler quando o 403 vem de uma sessão que terminou", async () => {
    const onUnauthorized = vi.fn();
    setUnauthorizedHandler(onUnauthorized);
    const fetchMock = fetchByPath({
      "/api/items/": () => jsonResponse('{"detail":"x"}', 403),
      "/api/auth/me/": () => jsonResponse('{"detail":"x"}', 403),
    });
    vi.stubGlobal("fetch", fetchMock);
    await expect(apiGet("/api/items/")).rejects.toBeInstanceOf(ApiError);
    expect(fetchMock.mock.calls.map((call) => call[0])).toEqual([
      "/api/items/",
      "/api/auth/me/",
    ]);
    expect(onUnauthorized).toHaveBeenCalledOnce();
  });

  it("não termina a sessão num 403 de falta de permissão", async () => {
    const onUnauthorized = vi.fn();
    setUnauthorizedHandler(onUnauthorized);
    vi.stubGlobal("fetch", fetchByPath({
      "/api/items/": () => jsonResponse("{}", 403),
      "/api/auth/me/": () => jsonResponse('{"username":"ana"}', 200),
    }));
    const error = await apiGet("/api/items/").catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(403);
    expect((error as ApiError).detail).toBe("Não tem permissão para fazer isto.");
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it("mostra o detalhe do servidor num 403 de falta de permissão", async () => {
    vi.stubGlobal("fetch", fetchByPath({
      "/api/items/": () => jsonResponse('{"detail":"Sem acesso a este recurso."}', 403),
      "/api/auth/me/": () => jsonResponse('{"username":"ana"}', 200),
    }));
    const error = await apiGet("/api/items/").catch((caught: unknown) => caught);
    expect((error as ApiError).detail).toBe("Sem acesso a este recurso.");
  });

  it("não envia o token CSRF nos pedidos GET", async () => {
    document.cookie = "csrftoken=abc123";
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse("{}", 200));
    vi.stubGlobal("fetch", fetchMock);
    await apiGet("/api/items/");
    const headers = new Headers(fetchMock.mock.calls.at(-1)![1].headers);
    expect(headers.has("X-CSRFToken")).toBe(false);
  });

  it("lança ApiError quando uma resposta de sucesso não traz JSON válido", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      new Response("<html></html>", { status: 200, headers: { "Content-Type": "text/html" } }),
    ));
    await expect(apiGet("/api/items/")).rejects.toBeInstanceOf(ApiError);
  });
});
