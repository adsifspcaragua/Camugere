import { jest } from "@jest/globals";
import jwt from "jsonwebtoken";
import request from "supertest";

const conexao = { verify: jest.fn(), sendMail: jest.fn(), close: jest.fn() };
const nodemailerMock = { createTransport: jest.fn(() => conexao), createTestAccount: jest.fn(), getTestMessageUrl: jest.fn(() => false) };
let salvo = null;
const prismaMock = {
  configuracaoEmail: {
    findUnique: jest.fn(async () => salvo),
    // Como o Prisma: create exige todos os campos obrigatórios; update aceita parte deles.
    create: jest.fn(async ({ data }) => {
      if (!data.senhaCifrada) throw new Error("Argument `senhaCifrada` is missing.");
      return (salvo = { ...data, atualizadoEm: new Date() });
    }),
    update: jest.fn(async ({ data }) => (salvo = { ...salvo, ...data, atualizadoEm: new Date() })),
    deleteMany: jest.fn(async () => (salvo = null)),
  },
  bibliotecario: { findFirst: jest.fn().mockResolvedValue({ id: 1 }) },
  usuario: { findUnique: jest.fn().mockResolvedValue({ email: "maria@bib.org" }) },
};
jest.unstable_mockModule("nodemailer", () => ({ default: nodemailerMock }));
jest.unstable_mockModule("../src/lib/prisma.js", () => ({ prisma: prismaMock }));

const { cifrar, decifrar } = await import("../src/lib/cripto.js");
const config = await import("../src/services/configEmailService.js");
const email = await import("../src/services/emailService.js");
const { default: app } = await import("../src/app.js");

const auth = { Authorization: `Bearer ${jwt.sign({ id: 1, id_bibliotecario: 1, v: 0 }, "test-secret")}` };
const GMAIL = { host: "smtp.gmail.com", porta: 587, usuario: "biblioteca@gmail.com", senha: "abcd efgh ijkl mnop", nomeRemetente: "Biblioteca Camugerê" };

beforeEach(() => {
  jest.clearAllMocks();
  salvo = null;
  delete process.env.SMTP_HOST;
  delete process.env.SMTP_USER;
  delete process.env.SMTP_PASS;
  config.invalidarParaTeste();
  conexao.verify.mockResolvedValue(true);
  conexao.sendMail.mockResolvedValue({ messageId: "1" });
});

describe("cifragem da senha", () => {
  it("ida e volta, com IV diferente a cada vez", () => {
    const a = cifrar("segredo");
    expect(a).not.toContain("segredo");
    expect(cifrar("segredo")).not.toBe(a);
    expect(decifrar(a)).toBe("segredo");
  });

  it("valor adulterado ou inválido vira null", () => {
    const [iv, tag, dados] = cifrar("segredo").split(".");
    expect(decifrar(`${iv}.${tag}.${Buffer.from("x").toString("base64")}${dados}`)).toBeNull();
    expect(decifrar("lixo")).toBeNull();
  });
});

describe("configuração pela tela", () => {
  it("sem nada configurado", async () => {
    await expect(config.obterParaTela()).resolves.toMatchObject({ configurado: false, origem: null, senhaDefinida: false });
    await expect(email.emailConfigurado()).resolves.toBe(false);
  });

  it("salva com a senha cifrada e nunca devolve a senha", async () => {
    const tela = await config.salvar(GMAIL);
    expect(salvo.senhaCifrada).not.toContain("abcd");
    expect(decifrar(salvo.senhaCifrada)).toBe(GMAIL.senha);
    expect(tela).toMatchObject({ configurado: true, origem: "tela", host: "smtp.gmail.com", porta: 587, seguro: false, senhaDefinida: true });
    expect(JSON.stringify(tela)).not.toContain("abcd");
    await expect(email.emailConfigurado()).resolves.toBe(true);
  });

  it("porta 465 liga a conexão segura por padrão", async () => {
    await config.salvar({ ...GMAIL, porta: 465 });
    expect(salvo.seguro).toBe(true);
  });

  it("senha em branco ao editar mantém a anterior (sem tentar criar outro registro)", async () => {
    await config.salvar(GMAIL);
    await config.salvar({ ...GMAIL, senha: "", porta: 465, nomeRemetente: "Biblioteca" });
    expect(prismaMock.configuracaoEmail.create).toHaveBeenCalledTimes(1);
    expect(prismaMock.configuracaoEmail.update.mock.calls[0][0].data).not.toHaveProperty("senhaCifrada");
    expect(salvo.porta).toBe(465);
    expect(decifrar(salvo.senhaCifrada)).toBe(GMAIL.senha);
    expect(salvo.nomeRemetente).toBe("Biblioteca");
  });

  it("exige a senha na primeira configuração", async () => {
    await expect(config.salvar({ ...GMAIL, senha: "" })).rejects.toMatchObject({ status: 400, details: [expect.stringMatching(/^senha:/)] });
  });

  it("a configuração da tela tem prioridade sobre o .env e é usada no envio", async () => {
    Object.assign(process.env, { SMTP_HOST: "smtp.env", SMTP_USER: "env@x.org", SMTP_PASS: "p" });
    config.invalidarParaTeste();
    expect((await config.obterSmtp()).origem).toBe("env");

    await config.salvar(GMAIL);
    await email.enviarEmailEmprestimo({
      dataInicio: new Date(), diasLocacao: 14, leitor: { usuario: { nome: "Ana", email: "ana@x.com" } }, exemplar: { numeroInventario: "1", obra: { titulo: "Livro" } },
    });
    expect(nodemailerMock.createTransport).toHaveBeenLastCalledWith(expect.objectContaining({ host: "smtp.gmail.com", auth: { user: "biblioteca@gmail.com", pass: GMAIL.senha } }));
    expect(conexao.sendMail.mock.calls[0][0].from).toBe('"Biblioteca Camugerê" <biblioteca@gmail.com>');
  });

  it("senha cifrada com outra chave (JWT_SECRET trocado) conta como não configurado", async () => {
    salvo = { id: 1, ...GMAIL, seguro: false, senhaCifrada: "a.b.c", atualizadoEm: new Date() };
    await expect(config.obterParaTela()).resolves.toMatchObject({ configurado: false, senhaDefinida: false });
    await expect(email.emailConfigurado()).resolves.toBe(false);
  });

  it("remover volta para o .env (ou nada)", async () => {
    await config.salvar(GMAIL);
    await expect(config.remover()).resolves.toMatchObject({ configurado: false });
    await expect(email.emailConfigurado()).resolves.toBe(false);
  });
});

describe("e-mail de teste", () => {
  it("verifica a conexão e envia", async () => {
    await config.salvar(GMAIL);
    await expect(email.enviarTeste("maria@bib.org")).resolves.toEqual({ enviadoPara: "maria@bib.org" });
    expect(conexao.verify).toHaveBeenCalled();
    expect(conexao.sendMail.mock.calls[0][0].to).toBe("maria@bib.org");
  });

  it.each([
    [{ code: "EAUTH", responseCode: 535 }, /senha de app/],
    [{ code: "ENOTFOUND" }, /não encontrado/],
    [{ code: "ETIMEDOUT" }, /Não foi possível conectar/],
    [{ message: "outro" }, /recusou o envio: outro/],
  ])("explica a falha %o em linguagem simples", async (erro, msg) => {
    await config.salvar(GMAIL);
    conexao.verify.mockRejectedValue(Object.assign(new Error(erro.message ?? "x"), erro));
    await expect(email.enviarTeste("maria@bib.org")).rejects.toThrow(msg);
  });
});

describe("rotas /configuracao/email", () => {
  it("exigem login", async () => {
    expect((await request(app).get("/configuracao/email")).status).toBe(401);
  });

  it("PUT valida, salva e GET não expõe a senha", async () => {
    expect((await request(app).put("/configuracao/email").set(auth).send({ host: "", porta: 0, usuario: "" })).status).toBe(400);
    const put = await request(app).put("/configuracao/email").set(auth).send(GMAIL);
    expect(put.status).toBe(200);
    const get = await request(app).get("/configuracao/email").set(auth);
    expect(get.body.data).toMatchObject({ configurado: true, usuario: "biblioteca@gmail.com" });
    expect(JSON.stringify(get.body)).not.toContain("abcd");
  });

  it("POST teste envia para o e-mail de quem está logado e devolve 400 com a explicação", async () => {
    await config.salvar(GMAIL);
    const okRes = await request(app).post("/configuracao/email/teste").set(auth);
    expect(okRes.body.message).toBe("E-mail de teste enviado para maria@bib.org.");
    conexao.verify.mockRejectedValue(Object.assign(new Error("auth"), { code: "EAUTH" }));
    const falha = await request(app).post("/configuracao/email/teste").set(auth);
    expect(falha.status).toBe(400);
    expect(falha.body.message).toMatch(/senha de app/);
  });

  it("DELETE remove", async () => {
    await config.salvar(GMAIL);
    const res = await request(app).delete("/configuracao/email").set(auth);
    expect(res.body.data.configurado).toBe(false);
  });
});
