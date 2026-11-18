// Cliente da API do Django: sessão por cookie e proteção CSRF.

const CSRF_PATH = "/api/auth/csrf/";
const LOGIN_PATH = "/api/auth/login/";
const ME_PATH = "/api/auth/me/";
const PERMISSION_ERROR = "Não tem permissão para fazer isto.";
const GENERIC_ERROR = "Não foi possível concluir o pedido. Tente outra vez.";
const NETWORK_ERROR =
  "Não foi possível contactar o servidor. Confirme que o backend está a correr.";

export class ApiError extends Error {
  status: number;
  detail: string;
  // Erros de validação por campo: {"name": ["mensagem"]}. Vazio nos outros erros.
  fieldErrors: Record<string, string[]>;

  constructor(status: number, detail: string, fieldErrors: Record<string, string[]> = {}) {
    super(detail);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
    this.fieldErrors = fieldErrors;
  }
}

let onUnauthorized: () => void = () => {};

// O AuthContext regista aqui o que fazer quando a sessão deixa de ser válida.
export function setUnauthorizedHandler(fn: () => void): void {
  onUnauthorized = fn;
}

export function apiGet<T>(path: string): Promise<T> {
  return request<T>("GET", path);
}

export async function apiSend<T>(
  method: "POST" | "PATCH" | "DELETE",
  path: string,
  body?: unknown,
): Promise<T> {
  await ensureCsrfCookie();
  return request<T>(method, path, body);
}

// Lido a cada pedido porque o Django troca o token quando alguém entra.
function readCsrfToken(): string | null {
  for (const part of document.cookie.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === "csrftoken" && rest.length > 0) {
      const value = rest.join("=");
      return value === "" ? null : decodeURIComponent(value);
    }
  }
  return null;
}

async function ensureCsrfCookie(): Promise<void> {
  if (readCsrfToken() === null) {
    await request<void>("GET", CSRF_PATH);
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers = new Headers({ Accept: "application/json" });
  if (method !== "GET") {
    headers.set("X-CSRFToken", readCsrfToken() ?? "");
  }
  if (body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;
  try {
    response = await fetch(path, {
      method,
      headers,
      credentials: "same-origin",
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, NETWORK_ERROR);
  }

  if (!response.ok) {
    throw await errorFromResponse(path, response);
  }
  try {
    return (await readJson(response)) as T;
  } catch {
    throw new ApiError(response.status, GENERIC_ERROR);
  }
}

// O DRF responde 403 tanto sem sessão como sem permissão (e o CSRF falhado
// também é 403). Só se o /me/ também recusar é que a sessão terminou.
async function errorFromResponse(path: string, response: Response): Promise<ApiError> {
  const { detail, fieldErrors } = await readErrorBody(response);
  const refused = response.status === 401 || response.status === 403;
  // Um login falhado não é uma sessão que terminou.
  if (!refused || path === LOGIN_PATH) {
    return new ApiError(response.status, detail ?? GENERIC_ERROR, fieldErrors);
  }
  if (path === ME_PATH || (await sessionIsGone())) {
    onUnauthorized();
    return new ApiError(response.status, detail ?? GENERIC_ERROR);
  }
  return new ApiError(response.status, detail ?? PERMISSION_ERROR);
}

// Chama o fetch diretamente (e não request) para a verificação não se repetir.
async function sessionIsGone(): Promise<boolean> {
  try {
    const response = await fetch(ME_PATH, {
      headers: { Accept: "application/json" },
      credentials: "same-origin",
    });
    return response.status === 401 || response.status === 403;
  } catch {
    // Sem resposta não há prova de que a sessão terminou.
    return false;
  }
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  return text === "" ? undefined : JSON.parse(text);
}

type ErrorBody = { detail: string | null; fieldErrors: Record<string, string[]> };

// Os erros nem sempre vêm em JSON (o Django responde em HTML quando o CSRF falha).
// detail é null quando não há mensagem aproveitável.
async function readErrorBody(response: Response): Promise<ErrorBody> {
  let body: unknown;
  try {
    body = await readJson(response);
  } catch {
    return { detail: null, fieldErrors: {} };
  }
  if (typeof body !== "object" || body === null) {
    return { detail: null, fieldErrors: {} };
  }
  const detail = (body as { detail?: unknown }).detail;
  if (typeof detail === "string") {
    return { detail, fieldErrors: {} };
  }
  const fieldErrors = readFieldErrors(body);
  return { detail: firstMessage(fieldErrors), fieldErrors };
}

// Erros de validação do DRF: {"campo": ["mensagem"]}. Ignora o que não for lista de textos.
function readFieldErrors(body: object): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const [field, messages] of Object.entries(body)) {
    if (Array.isArray(messages) && messages.every((message) => typeof message === "string")) {
      result[field] = messages;
    }
  }
  return result;
}

function firstMessage(fieldErrors: Record<string, string[]>): string | null {
  for (const messages of Object.values(fieldErrors)) {
    if (messages.length > 0) {
      return messages[0];
    }
  }
  return null;
}
