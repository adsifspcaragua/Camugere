import { jest } from "@jest/globals";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const tx = { usuario: { update: jest.fn() }, leitor: { update: jest.fn() }, exemplar: { findMany: jest.fn(), createMany: jest.fn(), findFirst: jest.fn() } };
const prismaMock = {
  usuario: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
  leitor: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), count: jest.fn() },
  bibliotecario: { findMany: jest.fn(), findUnique: jest.fn(), findFirst: jest.fn(), create: jest.fn(), count: jest.fn(), delete: jest.fn() },
  exemplar: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
  obra: { findUnique: jest.fn() },
  emprestimo: { count: jest.fn(), findMany: jest.fn() },
  $transaction: jest.fn((fn) => fn(tx)),
};
jest.unstable_mockModule("../src/lib/prisma.js", () => ({ prisma: prismaMock }));

const leitorService = await import("../src/services/leitorService.js");
const exemplarService = await import("../src/services/exemplarService.js");
const usuarioService = await import("../src/services/usuarioService.js");
const bibliotecarioService = await import("../src/services/bibliotecarioService.js");

beforeEach(() => {
  jest.clearAllMocks();
  prismaMock.$transaction.mockImplementation((fn) => fn(tx));
});

describe("leitorService", () => {
  const leitorDb = { id: 1, id_usuario: 11, cpf: "52998224725", suspensoes: [] };

  it("formatarLeitor troca a lista de suspensões pela ativa", () => {
    const ativa = { id: 9, dataFim: null, dataEncerramento: null };
    expect(leitorService.formatarLeitor({ id: 1, suspensoes: [{ id: 8, dataFim: "2000-01-01", dataEncerramento: null }, ativa] })).toEqual({
      id: 1,
      suspensaoAtiva: ativa,
    });
    expect(leitorService.formatarLeitor({ id: 1 })).toEqual({ id: 1, suspensaoAtiva: null });
    expect(leitorService.formatarLeitor(null)).toBeNull();
  });

  it("cria leitor com usuário vinculado e senha aleatória já em hash", async () => {
    prismaMock.leitor.create.mockResolvedValue(leitorDb);
    await leitorService.criar({ nome: "Ana", email: "ana@x.com", cpf: "52998224725", telefone: undefined, cidade: "Caraguá", extra: "ignorado" });
    const { data } = prismaMock.leitor.create.mock.calls[0][0];
    expect(data).toMatchObject({ cpf: "52998224725", cidade: "Caraguá" });
    expect(data).not.toHaveProperty("extra");
    expect(data).not.toHaveProperty("telefone");
    expect(data.usuario.create).toMatchObject({ nome: "Ana", email: "ana@x.com" });
    expect(data.usuario.create.hash).toMatch(/^\$2[aby]\$/);
  });

  it("buscarPorId responde 404 para inexistente", async () => {
    prismaMock.leitor.findUnique.mockResolvedValue(null);
    await expect(leitorService.buscarPorId(1)).rejects.toMatchObject({ status: 404 });
  });

  it("atualiza nome/e-mail no usuário e o restante no leitor", async () => {
    prismaMock.leitor.findUnique.mockResolvedValue(leitorDb);
    tx.leitor.update.mockResolvedValue(leitorDb);
    await leitorService.atualizar(1, { nome: "Ana B", telefone: "12999999999" });
    expect(tx.usuario.update).toHaveBeenCalledWith({ where: { id: 11 }, data: { nome: "Ana B", email: undefined } });
    expect(tx.leitor.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 1 }, data: { telefone: "12999999999" } }));
  });

  it("não toca no usuário quando nome e e-mail não mudam", async () => {
    prismaMock.leitor.findUnique.mockResolvedValue(leitorDb);
    tx.leitor.update.mockResolvedValue(leitorDb);
    await leitorService.atualizar(1, { cidade: "Ubatuba" });
    expect(tx.usuario.update).not.toHaveBeenCalled();
  });

  it("não exclui leitor com empréstimos ativos", async () => {
    prismaMock.leitor.findUnique.mockResolvedValue(leitorDb);
    prismaMock.emprestimo.count.mockResolvedValue(2);
    await expect(leitorService.remover(1)).rejects.toMatchObject({ status: 409 });
    expect(prismaMock.usuario.delete).not.toHaveBeenCalled();
  });

  it("exclui o usuário (cascata) quando não há empréstimos ativos", async () => {
    prismaMock.leitor.findUnique.mockResolvedValue(leitorDb);
    prismaMock.emprestimo.count.mockResolvedValue(0);
    await leitorService.remover(1);
    expect(prismaMock.usuario.delete).toHaveBeenCalledWith({ where: { id: 11 } });
  });

  it("lista leitores formatados e o histórico de empréstimos", async () => {
    prismaMock.leitor.findMany.mockResolvedValue([leitorDb]);
    expect(await leitorService.listar()).toEqual([{ id: 1, id_usuario: 11, cpf: "52998224725", suspensaoAtiva: null }]);
    prismaMock.leitor.findUnique.mockResolvedValue(leitorDb);
    prismaMock.emprestimo.findMany.mockResolvedValue([{ id: 5 }]);
    expect(await leitorService.historicoEmprestimos(1)).toEqual([{ id: 5 }]);
    expect(prismaMock.emprestimo.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { id_leitor: 1 } }));
  });
});

describe("exemplarService", () => {
  it("filtra por disponibilidade só quando informada", async () => {
    prismaMock.exemplar.findMany.mockResolvedValue([]);
    await exemplarService.listar();
    expect(prismaMock.exemplar.findMany.mock.calls[0][0].where).toBeUndefined();
    await exemplarService.listar({ disponivel: false });
    expect(prismaMock.exemplar.findMany.mock.calls[1][0].where).toEqual({ disponivel: false });
  });

  it("responde 404 ao criar exemplar de obra inexistente", async () => {
    prismaMock.obra.findUnique.mockResolvedValue(null);
    await expect(exemplarService.criar({ id_obra: 1 })).rejects.toMatchObject({ status: 404 });
  });

  it("usa o número de inventário informado", async () => {
    prismaMock.obra.findUnique.mockResolvedValue({ id: 1 });
    await exemplarService.criar({ id_obra: 1, numeroInventario: "INV-1", disponivel: true });
    expect(prismaMock.exemplar.create).toHaveBeenCalledWith(expect.objectContaining({ data: { id_obra: 1, numeroInventario: "INV-1", disponivel: true } }));
  });

  it("gera o número de inventário quando ausente", async () => {
    prismaMock.obra.findUnique.mockResolvedValue({ id: 1 });
    tx.exemplar.findMany.mockResolvedValue([]);
    tx.exemplar.findFirst.mockResolvedValue({ id: 3 });
    await expect(exemplarService.criar({ id_obra: 1 })).resolves.toEqual({ id: 3 });
    expect(tx.exemplar.createMany).toHaveBeenCalledTimes(1);
    expect(tx.exemplar.createMany.mock.calls[0][0].data).toHaveLength(1);
  });

  it("criarParaObra não faz nada para quantidade zero", async () => {
    await exemplarService.criarParaObra(tx, 1, 0);
    expect(tx.exemplar.findMany).not.toHaveBeenCalled();
  });

  it("não exclui exemplar emprestado", async () => {
    prismaMock.exemplar.findUnique.mockResolvedValue({ id: 1, disponivel: false });
    await expect(exemplarService.remover(1)).rejects.toMatchObject({ status: 409 });
    prismaMock.exemplar.findUnique.mockResolvedValue({ id: 1, disponivel: true });
    await exemplarService.remover(1);
    expect(prismaMock.exemplar.delete).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 1 } }));
  });

  it("buscarPorId responde 404 para inexistente", async () => {
    prismaMock.exemplar.findUnique.mockResolvedValue(null);
    await expect(exemplarService.buscarPorId(1)).rejects.toMatchObject({ status: 404 });
  });
});

describe("usuarioService", () => {
  const credenciais = { email: "ana@x.com", senha: "segredo123" };
  let hash;
  beforeAll(async () => {
    hash = await bcrypt.hash(credenciais.senha, 4);
  });

  it("autentica bibliotecário e emite JWT com id e id_bibliotecario", async () => {
    prismaMock.usuario.findUnique.mockResolvedValue({ id: 1, nome: "Ana", email: credenciais.email, hash, bibliotecarios: [{ id: 7 }] });
    const r = await usuarioService.autenticar(credenciais);
    expect(jwt.verify(r.token, "test-secret")).toMatchObject({ id: 1, id_bibliotecario: 7 });
    expect(r.usuario).toEqual({ id: 1, nome: "Ana", email: credenciais.email });
  });

  it("usa a mesma mensagem para e-mail inexistente e senha errada", async () => {
    prismaMock.usuario.findUnique.mockResolvedValue(null);
    const e1 = await usuarioService.autenticar(credenciais).catch((e) => e);
    prismaMock.usuario.findUnique.mockResolvedValue({ id: 1, hash, bibliotecarios: [{ id: 7 }] });
    const e2 = await usuarioService.autenticar({ ...credenciais, senha: "errada" }).catch((e) => e);
    expect(e1.status).toBe(401);
    expect(e2.status).toBe(401);
    expect(e1.message).toBe(e2.message);
  });

  it("nega login (403) a usuário sem perfil de bibliotecário", async () => {
    prismaMock.usuario.findUnique.mockResolvedValue({ id: 1, hash, bibliotecarios: [] });
    await expect(usuarioService.autenticar(credenciais)).rejects.toMatchObject({ status: 403 });
  });

  it("validarToken aceita token válido e rejeita inválido", () => {
    const token = jwt.sign({ id: 1 }, "test-secret");
    expect(usuarioService.validarToken(token)).toMatchObject({ id: 1 });
    expect(() => usuarioService.validarToken("lixo")).toThrow(expect.objectContaining({ status: 401 }));
  });

  it("criar e atualizar nunca gravam a senha em texto puro", async () => {
    await usuarioService.criar({ nome: "A", email: "a@x.com", senha: "segredo123" });
    const criado = prismaMock.usuario.create.mock.calls[0][0].data;
    expect(criado).not.toHaveProperty("senha");
    expect(await bcrypt.compare("segredo123", criado.hash)).toBe(true);

    await usuarioService.atualizar(1, { nome: "B" });
    expect(prismaMock.usuario.update.mock.calls[0][0].data).toEqual({ nome: "B" });
    await usuarioService.atualizar(1, { senha: "nova12345" });
    expect(prismaMock.usuario.update.mock.calls[1][0].data.hash).toMatch(/^\$2[aby]\$/);
  });

  it("perfil devolve usuário e bibliotecário do token", async () => {
    prismaMock.usuario.findUnique.mockResolvedValue({ id: 1, nome: "Ana" });
    expect(await usuarioService.perfil({ id: 1, id_bibliotecario: 7 })).toEqual({
      usuario: { id: 1, nome: "Ana" },
      bibliotecario: { id: 7, id_usuario: 1 },
    });
    prismaMock.usuario.findUnique.mockResolvedValue(null);
    await expect(usuarioService.buscarPorId(2)).rejects.toMatchObject({ status: 404 });
  });
});

describe("bibliotecarioService", () => {
  it("promove usuário existente e recusa duplicidade", async () => {
    prismaMock.usuario.findUnique.mockResolvedValue(null);
    await expect(bibliotecarioService.criar({ id_usuario: 1 })).rejects.toMatchObject({ status: 404 });
    prismaMock.usuario.findUnique.mockResolvedValue({ id: 1 });
    prismaMock.bibliotecario.findFirst.mockResolvedValue({ id: 7 });
    await expect(bibliotecarioService.criar({ id_usuario: 1 })).rejects.toMatchObject({ status: 409 });
    prismaMock.bibliotecario.findFirst.mockResolvedValue(null);
    await bibliotecarioService.criar({ id_usuario: 1 });
    expect(prismaMock.bibliotecario.create).toHaveBeenCalled();
  });

  it("não deixa remover o próprio acesso", async () => {
    await expect(bibliotecarioService.remover(7, { id_bibliotecario: 7 })).rejects.toMatchObject({ status: 409 });
  });

  it("mantém ao menos um bibliotecário", async () => {
    prismaMock.bibliotecario.findUnique.mockResolvedValue({ id: 8, id_usuario: 2 });
    prismaMock.bibliotecario.count.mockResolvedValue(1);
    await expect(bibliotecarioService.remover(8, { id_bibliotecario: 7 })).rejects.toMatchObject({ status: 409 });
  });

  it("remove só o perfil se o usuário também é leitor; senão remove o usuário", async () => {
    prismaMock.bibliotecario.findUnique.mockResolvedValue({ id: 8, id_usuario: 2 });
    prismaMock.bibliotecario.count.mockResolvedValue(3);
    prismaMock.leitor.count.mockResolvedValue(1);
    await bibliotecarioService.remover(8, { id_bibliotecario: 7 });
    expect(prismaMock.bibliotecario.delete).toHaveBeenCalledWith({ where: { id: 8 } });
    expect(prismaMock.usuario.delete).not.toHaveBeenCalled();

    prismaMock.leitor.count.mockResolvedValue(0);
    await bibliotecarioService.remover(8, { id_bibliotecario: 7 });
    expect(prismaMock.usuario.delete).toHaveBeenCalledWith({ where: { id: 2 } });
  });

  it("cadastra login e perfil juntos e responde 404 para inexistente", async () => {
    await bibliotecarioService.cadastrar({ nome: "C", email: "c@x.com", senha: "segredo123" });
    expect(prismaMock.bibliotecario.create.mock.calls[0][0].data.usuario.create).toMatchObject({ nome: "C", email: "c@x.com" });
    prismaMock.bibliotecario.findUnique.mockResolvedValue(null);
    await expect(bibliotecarioService.buscarPorId(1)).rejects.toMatchObject({ status: 404 });
  });
});
