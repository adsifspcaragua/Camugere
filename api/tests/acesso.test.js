import { jest } from "@jest/globals";
import crypto from "node:crypto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import request from "supertest";

const tx = {
  bibliotecario: { count: jest.fn(), create: jest.fn() },
  usuario: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
  redefinicaoSenha: { updateMany: jest.fn() },
};
const prismaMock = {
  bibliotecario: { count: jest.fn(), findUnique: jest.fn(), findFirst: jest.fn() },
  usuario: { findUnique: jest.fn(), update: jest.fn() },
  redefinicaoSenha: { deleteMany: jest.fn(), create: jest.fn(), findUnique: jest.fn() },
  emprestimo: { findMany: jest.fn() },
  $transaction: jest.fn(),
};
const email = { configurado: true, enviarRedefinicaoSenha: jest.fn() };

jest.unstable_mockModule("../src/lib/prisma.js", () => ({ prisma: prismaMock }));
jest.unstable_mockModule("../src/services/emailService.js", () => ({
  emailConfigurado: () => email.configurado,
  enviarRedefinicaoSenha: email.enviarRedefinicaoSenha,
  enviarEmailEmprestimo: jest.fn(),
  enviarLembreteDevolucao: jest.fn(),
  enviarTeste: jest.fn(),
  explicarFalhaSmtp: (e) => e.message,
}));

const acesso = await import("../src/services/acessoService.js");
const { rateLimit } = await import("../src/middlewares/rateLimit.js");
const { default: app } = await import("../src/app.js");

const sha256 = (t) => crypto.createHash("sha256").update(t).digest("hex");
const tokenDe = (id, id_bibliotecario, v = 0) => jwt.sign({ id, id_bibliotecario, v }, "test-secret");

beforeEach(() => {
  jest.clearAllMocks();
  email.configurado = true;
  prismaMock.$transaction.mockImplementation((arg) => (typeof arg === "function" ? arg(tx) : Promise.all(arg)));
  prismaMock.bibliotecario.findFirst.mockResolvedValue({ id: 1 });
});

describe("primeiro acesso", () => {
  it("é necessário só quando não há bibliotecário", async () => {
    prismaMock.bibliotecario.count.mockResolvedValueOnce(0).mockResolvedValueOnce(2);
    await expect(acesso.precisaPrimeiroAcesso()).resolves.toBe(true);
    await expect(acesso.precisaPrimeiroAcesso()).resolves.toBe(false);
  });

  it("cria a primeira conta com senha em hash e já devolve a sessão", async () => {
    tx.bibliotecario.count.mockResolvedValue(0);
    tx.usuario.findUnique.mockResolvedValue(null);
    tx.usuario.create.mockImplementation(({ data }) => ({ id: 1, versaoToken: 0, ...data }));
    tx.bibliotecario.create.mockResolvedValue({ id: 5, id_usuario: 1 });

    const r = await acesso.configurarPrimeiroAcesso({ nome: "Maria", email: "maria@bib.org", senha: "segredo1" });

    const { hash } = tx.usuario.create.mock.calls[0][0].data;
    expect(await bcrypt.compare("segredo1", hash)).toBe(true);
    expect(r.usuario).toEqual({ id: 1, nome: "Maria", email: "maria@bib.org" });
    expect(jwt.verify(r.token, "test-secret")).toMatchObject({ id: 1, id_bibliotecario: 5, v: 0 });
    expect(prismaMock.$transaction.mock.calls[0][1]).toEqual({ isolationLevel: "Serializable" });
  });

  it("recusa quando já existe bibliotecário", async () => {
    tx.bibliotecario.count.mockResolvedValue(1);
    await expect(acesso.configurarPrimeiroAcesso({ nome: "X", email: "x@x.org", senha: "123456" })).rejects.toMatchObject({ status: 409 });
    expect(tx.usuario.create).not.toHaveBeenCalled();
  });

  it("recusa e-mail já cadastrado", async () => {
    tx.bibliotecario.count.mockResolvedValue(0);
    tx.usuario.findUnique.mockResolvedValue({ id: 9 });
    await expect(acesso.configurarPrimeiroAcesso({ nome: "X", email: "x@x.org", senha: "123456" })).rejects.toMatchObject({ status: 409 });
  });

  it("rotas: GET informa a situação e POST valida os dados", async () => {
    prismaMock.bibliotecario.count.mockResolvedValue(0);
    const get = await request(app).get("/primeiro-acesso");
    expect(get.body.data).toEqual({ necessario: true });

    const post = await request(app).post("/primeiro-acesso").send({ nome: "M", email: "invalido", senha: "1" });
    expect(post.status).toBe(400);
  });
});

describe("alterar a própria senha", () => {
  const usuario = async (senha) => ({ id: 3, hash: await bcrypt.hash(senha, 4), versaoToken: 1 });

  it("troca a senha, incrementa a versão e devolve token novo", async () => {
    prismaMock.usuario.findUnique.mockResolvedValue(await usuario("antiga1"));
    prismaMock.usuario.update.mockResolvedValue({ id: 3, versaoToken: 2 });

    const r = await acesso.alterarPropriaSenha({ id: 3, id_bibliotecario: 7 }, { senhaAtual: "antiga1", novaSenha: "nova123" });

    const { data } = prismaMock.usuario.update.mock.calls[0][0];
    expect(await bcrypt.compare("nova123", data.hash)).toBe(true);
    expect(data.versaoToken).toEqual({ increment: 1 });
    expect(jwt.verify(r.token, "test-secret")).toMatchObject({ id: 3, id_bibliotecario: 7, v: 2 });
  });

  it("recusa senha atual errada, indicando o campo", async () => {
    prismaMock.usuario.findUnique.mockResolvedValue(await usuario("antiga1"));
    await expect(acesso.alterarPropriaSenha({ id: 3 }, { senhaAtual: "errada", novaSenha: "nova123" })).rejects.toMatchObject({
      status: 400,
      details: [expect.stringMatching(/^senhaAtual:/)],
    });
    expect(prismaMock.usuario.update).not.toHaveBeenCalled();
  });

  it("recusa nova senha igual à atual", async () => {
    prismaMock.usuario.findUnique.mockResolvedValue(await usuario("mesma12"));
    await expect(acesso.alterarPropriaSenha({ id: 3 }, { senhaAtual: "mesma12", novaSenha: "mesma12" })).rejects.toMatchObject({ status: 400 });
  });

  it("rota PATCH /me/senha exige login", async () => {
    const res = await request(app).patch("/me/senha").send({ senhaAtual: "a", novaSenha: "bbbbbb" });
    expect(res.status).toBe(401);
  });
});

describe("redefinir senha de colega", () => {
  it("grava nova senha do colega e encerra as sessões dele", async () => {
    prismaMock.bibliotecario.findUnique.mockResolvedValue({ id_usuario: 20 });
    prismaMock.usuario.update.mockResolvedValue({});
    await acesso.redefinirSenhaDeColega(8, { novaSenha: "trocada1" }, { id_bibliotecario: 1 });
    expect(prismaMock.usuario.update.mock.calls[0][0]).toMatchObject({ where: { id: 20 }, data: { versaoToken: { increment: 1 } } });
  });

  it("não serve para a própria conta e acusa colega inexistente", async () => {
    await expect(acesso.redefinirSenhaDeColega(1, { novaSenha: "trocada1" }, { id_bibliotecario: 1 })).rejects.toMatchObject({ status: 400 });
    prismaMock.bibliotecario.findUnique.mockResolvedValue(null);
    await expect(acesso.redefinirSenhaDeColega(8, { novaSenha: "trocada1" }, { id_bibliotecario: 1 })).rejects.toMatchObject({ status: 404 });
  });

  it("rota PATCH /bibliotecario/:id/senha valida o tamanho da senha", async () => {
    const res = await request(app).patch("/bibliotecario/8/senha").set("Authorization", `Bearer ${tokenDe(1, 1)}`).send({ novaSenha: "123" });
    expect(res.status).toBe(400);
  });
});

describe("esqueci minha senha", () => {
  const bibliotecaria = { id: 4, nome: "Ana", email: "ana@bib.org", bibliotecarios: [{ id: 2 }] };

  it("sem e-mail configurado, avisa sem consultar o banco", async () => {
    email.configurado = false;
    await expect(acesso.solicitarRedefinicao({ email: "ana@bib.org" })).resolves.toEqual({ emailConfigurado: false });
    expect(prismaMock.usuario.findUnique).not.toHaveBeenCalled();
  });

  it("e-mail sem acesso recebe a mesma resposta e nada é enviado", async () => {
    prismaMock.usuario.findUnique.mockResolvedValue(null);
    await expect(acesso.solicitarRedefinicao({ email: "x@x.org" })).resolves.toEqual({ emailConfigurado: true });
    prismaMock.usuario.findUnique.mockResolvedValue({ ...bibliotecaria, bibliotecarios: [] });
    await expect(acesso.solicitarRedefinicao({ email: "leitor@x.org" })).resolves.toEqual({ emailConfigurado: true });
    expect(email.enviarRedefinicaoSenha).not.toHaveBeenCalled();
  });

  it("gera link de uso único, guarda só o hash e envia por e-mail", async () => {
    prismaMock.usuario.findUnique.mockResolvedValue(bibliotecaria);
    await acesso.solicitarRedefinicao({ email: "ana@bib.org" });

    expect(prismaMock.redefinicaoSenha.deleteMany).toHaveBeenCalledWith({ where: { id_usuario: 4, usadoEm: null } });
    const { link } = email.enviarRedefinicaoSenha.mock.calls[0][0];
    const token = new URL(link).searchParams.get("redefinir");
    const salvo = prismaMock.redefinicaoSenha.create.mock.calls[0][0].data;
    expect(salvo.tokenHash).toBe(sha256(token));
    expect(salvo.tokenHash).not.toContain(token);
    expect(salvo.expiraEm.getTime() - Date.now()).toBeGreaterThan(29 * 60_000);
  });

  it("falha no envio não revela nada a quem pediu", async () => {
    prismaMock.usuario.findUnique.mockResolvedValue(bibliotecaria);
    email.enviarRedefinicaoSenha.mockRejectedValue(new Error("smtp fora"));
    jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(acesso.solicitarRedefinicao({ email: "ana@bib.org" })).resolves.toEqual({ emailConfigurado: true });
    console.error.mockRestore();
  });
});

describe("redefinir com o link", () => {
  const token = "t".repeat(43);
  const pedido = (extra = {}) => ({ id: 6, id_usuario: 4, usadoEm: null, expiraEm: new Date(Date.now() + 60_000), ...extra });

  it("valida o link sem consumi-lo", async () => {
    prismaMock.redefinicaoSenha.findUnique.mockResolvedValue(pedido());
    await expect(acesso.validarLink(token)).resolves.toEqual({ valido: true });
    expect(prismaMock.redefinicaoSenha.findUnique).toHaveBeenCalledWith({ where: { tokenHash: sha256(token) } });
  });

  it.each([
    ["expirado", pedido({ expiraEm: new Date(Date.now() - 1) })],
    ["já usado", pedido({ usadoEm: new Date() })],
    ["inexistente", null],
  ])("link %s é recusado", async (_, registro) => {
    prismaMock.redefinicaoSenha.findUnique.mockResolvedValue(registro);
    await expect(acesso.validarLink(token)).resolves.toEqual({ valido: false });
    await expect(acesso.redefinirComLink({ token, novaSenha: "nova123" })).rejects.toMatchObject({ status: 400 });
  });

  it("token curto nem chega ao banco", async () => {
    await expect(acesso.validarLink("abc")).resolves.toEqual({ valido: false });
    expect(prismaMock.redefinicaoSenha.findUnique).not.toHaveBeenCalled();
  });

  it("troca a senha, marca o link como usado e encerra as sessões", async () => {
    prismaMock.redefinicaoSenha.findUnique.mockResolvedValue(pedido());
    tx.redefinicaoSenha.updateMany.mockResolvedValue({ count: 1 });
    tx.usuario.update.mockResolvedValue({});
    await expect(acesso.redefinirComLink({ token, novaSenha: "nova123" })).resolves.toEqual({ redefinida: true });
    expect(tx.redefinicaoSenha.updateMany.mock.calls[0][0].where).toEqual({ id: 6, usadoEm: null });
    expect(tx.usuario.update.mock.calls[0][0]).toMatchObject({ where: { id: 4 }, data: { versaoToken: { increment: 1 } } });
  });

  it("dois usos simultâneos: só o primeiro troca a senha", async () => {
    prismaMock.redefinicaoSenha.findUnique.mockResolvedValue(pedido());
    tx.redefinicaoSenha.updateMany.mockResolvedValue({ count: 0 });
    await expect(acesso.redefinirComLink({ token, novaSenha: "nova123" })).rejects.toMatchObject({ status: 400 });
    expect(tx.usuario.update).not.toHaveBeenCalled();
  });

  it("rota de redefinição valida a nova senha", async () => {
    const res = await request(app).post("/senha/redefinir").send({ token, novaSenha: "1" });
    expect(res.status).toBe(400);
  });
});

describe("limite de tentativas", () => {
  const executar = (mw, status = 200) =>
    new Promise((resolve) => {
      const handlers = {};
      const res = { statusCode: status, on: (ev, fn) => (handlers[ev] = fn) };
      mw({ ip: "1.1.1.1" }, res, (erro) => {
        handlers.finish?.();
        resolve(erro);
      });
    });

  it("bloqueia com 429 ao passar do máximo", async () => {
    const mw = rateLimit({ max: 2, janelaMs: 60_000 });
    expect(await executar(mw)).toBeUndefined();
    expect(await executar(mw)).toBeUndefined();
    expect((await executar(mw)).status).toBe(429);
  });

  it("apenasFalhas ignora as respostas de sucesso", async () => {
    const mw = rateLimit({ max: 1, janelaMs: 60_000, apenasFalhas: true });
    for (let i = 0; i < 3; i++) expect(await executar(mw, 200)).toBeUndefined();
    expect(await executar(mw, 401)).toBeUndefined();
    expect((await executar(mw, 401)).status).toBe(429);
  });

  it("POST /senha/esqueci responde igual e limita a 5 pedidos", async () => {
    email.configurado = false;
    const respostas = [];
    for (let i = 0; i < 6; i++) respostas.push((await request(app).post("/senha/esqueci").send({ email: "a@b.org" })).status);
    expect(respostas).toEqual([200, 200, 200, 200, 200, 429]);
  });
});
