import { vi } from "vitest";
import { ApiError, api, apiUrl, friendlyStatusMessage, getToken, isOnline, request, setToken, setUnauthorizedHandler, subscribeConnection, TOKEN_KEY } from "../lib/api.js";

const jsonResponse = (status, body) => ({ ok: status >= 200 && status < 300, status, json: () => (body === undefined ? Promise.reject(new Error("sem json")) : Promise.resolve(body)) });

beforeEach(() => {
  localStorage.clear();
  globalThis.fetch = vi.fn().mockResolvedValue(jsonResponse(200, { data: 1 }));
  setUnauthorizedHandler(() => {});
});

describe("token", () => {
  it("salva e remove o token do localStorage", () => {
    setToken("abc");
    expect(localStorage.getItem(TOKEN_KEY)).toBe("abc");
    expect(getToken()).toBe("abc");
    setToken(null);
    expect(getToken()).toBeNull();
  });
});

describe("request", () => {
  it("envia o token e serializa o corpo em JSON", async () => {
    setToken("tkn");
    await api.post("/x", { a: 1 });
    const [url, opts] = fetch.mock.calls[0];
    expect(url).toBe("http://localhost:3000/x");
    expect(opts.method).toBe("POST");
    expect(opts.headers).toMatchObject({ Authorization: "Bearer tkn", "Content-Type": "application/json" });
    expect(opts.body).toBe('{"a":1}');
  });

  it("não envia token quando auth=false", async () => {
    setToken("tkn");
    await api.post("/login", { e: 1 }, { auth: false });
    expect(fetch.mock.calls[0][1].headers.Authorization).toBeUndefined();
  });

  it("GET não envia Content-Type nem corpo", async () => {
    await api.get("/y");
    const opts = fetch.mock.calls[0][1];
    expect(opts.method).toBe("GET");
    expect(opts.body).toBeUndefined();
    expect(opts.headers["Content-Type"]).toBeUndefined();
  });

  it("envia FormData sem converter e sem Content-Type", async () => {
    const fd = new FormData();
    fd.append("capa", "x");
    await api.post("/upload/capa", fd);
    const opts = fetch.mock.calls[0][1];
    expect(opts.body).toBe(fd);
    expect(opts.headers["Content-Type"]).toBeUndefined();
  });

  it("put, patch e delete usam o método certo", async () => {
    await api.put("/a", {});
    await api.patch("/b");
    await api.delete("/c");
    expect(fetch.mock.calls.map(([, o]) => o.method)).toEqual(["PUT", "PATCH", "DELETE"]);
  });

  it("lança ApiError com mensagem e detalhes da API", async () => {
    fetch.mockResolvedValue(jsonResponse(400, { message: "Dados inválidos", details: ["nome: obrigatório"] }));
    const erro = await request("/x").catch((e) => e);
    expect(erro).toBeInstanceOf(ApiError);
    expect(erro).toMatchObject({ status: 400, message: "Dados inválidos", details: ["nome: obrigatório"] });
  });

  it("usa mensagem amigável quando a API não responde JSON", async () => {
    fetch.mockResolvedValue(jsonResponse(502));
    await expect(request("/x")).rejects.toMatchObject({ status: 502, message: expect.stringMatching(/servidor teve um problema/) });
  });

  it("chama o handler de sessão expirada em 401 autenticado", async () => {
    const handler = vi.fn();
    setUnauthorizedHandler(handler);
    fetch.mockResolvedValue(jsonResponse(401, { message: "Token inválido" }));
    await expect(request("/x")).rejects.toMatchObject({ status: 401 });
    expect(handler).toHaveBeenCalledTimes(1);
    await expect(request("/login", { auth: false })).rejects.toMatchObject({ status: 401 });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("marca offline em falha de rede e volta a online na próxima resposta", async () => {
    const ouvinte = vi.fn();
    const sair = subscribeConnection(ouvinte);
    fetch.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    await expect(request("/x")).rejects.toMatchObject({ status: 0, message: expect.stringMatching(/Sem conexão/) });
    expect(isOnline()).toBe(false);
    await request("/x");
    expect(isOnline()).toBe(true);
    expect(ouvinte.mock.calls).toEqual([[false], [true]]);
    sair();
  });

  it("informa timeout sem marcar offline", async () => {
    fetch.mockRejectedValueOnce(Object.assign(new Error("aborted"), { name: "AbortError" }));
    await expect(request("/x")).rejects.toMatchObject({ status: 0, message: expect.stringMatching(/demorou demais/) });
    expect(isOnline()).toBe(true);
  });
});

describe("mensagens e URLs", () => {
  it.each([
    [403, /permissão/],
    [404, /Não encontramos/],
    [409, /conflita/],
    [413, /grande demais/],
    [429, /Muitas tentativas/],
    [500, /servidor teve um problema/],
    [418, /erro 418/],
  ])("status %i", (status, msg) => {
    expect(friendlyStatusMessage(status)).toMatch(msg);
  });

  it("monta URL absoluta da API", () => {
    expect(apiUrl("/uploads/a.png")).toBe("http://localhost:3000/uploads/a.png");
  });
});
