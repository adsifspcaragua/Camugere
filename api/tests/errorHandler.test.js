import { jest } from "@jest/globals";
import { errorHandler, notFoundHandler } from "../src/middlewares/errorHandler.js";
import { HttpError, badRequest, conflict, forbidden, notFound, unauthorized } from "../src/lib/httpError.js";

function resposta() {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
}

function tratar(error) {
  const res = resposta();
  errorHandler(error, {}, res, () => {});
  return { status: res.status.mock.calls[0][0], body: res.json.mock.calls[0][0] };
}

describe("httpError helpers", () => {
  it.each([
    [badRequest("x", ["d"]), 400],
    [unauthorized(), 401],
    [forbidden(), 403],
    [notFound(), 404],
    [conflict("c"), 409],
  ])("cria HttpError com o status correto", (erro, status) => {
    expect(erro).toBeInstanceOf(HttpError);
    expect(erro.status).toBe(status);
  });

  it("usa mensagens padrão", () => {
    expect(unauthorized().message).toBe("Não autenticado.");
    expect(forbidden().message).toBe("Acesso negado.");
    expect(notFound().message).toBe("Recurso não encontrado.");
  });
});

describe("errorHandler", () => {
  it("responde HttpError com status, mensagem e detalhes", () => {
    expect(tratar(badRequest("Dados inválidos", ["nome: obrigatório"]))).toEqual({
      status: 400,
      body: { message: "Dados inválidos", details: ["nome: obrigatório"] },
    });
  });

  it.each([
    ["cpf_unique", "CPF"],
    ["Usuario_email_key", "e-mail"],
    [["isbn"], "ISBN"],
  ])("traduz P2002 do campo %s", (target, campo) => {
    const { status, body } = tratar({ code: "P2002", meta: { target } });
    expect(status).toBe(409);
    expect(body.message).toContain(campo);
  });

  it("usa a mensagem genérica de P2002 para outros campos", () => {
    expect(tratar({ code: "P2002", meta: { target: "numeroInventario" } })).toEqual({
      status: 409,
      body: { message: "Já existe um registro com esses dados únicos." },
    });
  });

  it("mapeia P2003 para 409 e P2025 para 404", () => {
    expect(tratar({ code: "P2003" }).status).toBe(409);
    expect(tratar({ code: "P2025" }).status).toBe(404);
  });

  it("responde 413 para corpo grande demais", () => {
    expect(tratar({ type: "entity.too.large" }).status).toBe(413);
  });

  it("responde 400 para JSON malformado", () => {
    expect(tratar({ type: "entity.parse.failed" }).status).toBe(400);
  });

  it("responde 500 sem vazar detalhes para erros desconhecidos", () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(tratar(new Error("segredo interno"))).toEqual({ status: 500, body: { message: "Erro interno do servidor." } });
    spy.mockRestore();
  });
});

describe("notFoundHandler", () => {
  it("informa método e rota", () => {
    const res = resposta();
    notFoundHandler({ method: "GET", originalUrl: "/x" }, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json.mock.calls[0][0].message).toBe("Rota GET /x não encontrada.");
  });
});
