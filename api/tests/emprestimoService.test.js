import { jest } from "@jest/globals";

const tx = {
  leitor: { findUnique: jest.fn() },
  suspensao: { findFirst: jest.fn() },
  exemplar: { updateMany: jest.fn(), findUnique: jest.fn() },
  emprestimo: { create: jest.fn(), update: jest.fn() },
};
const prismaMock = {
  emprestimo: { findMany: jest.fn(), findUnique: jest.fn(), findFirst: jest.fn(), update: jest.fn(), delete: jest.fn() },
  exemplar: { update: jest.fn() },
  $transaction: jest.fn(),
};
const enviarEmailEmprestimo = jest.fn();
jest.unstable_mockModule("../src/lib/prisma.js", () => ({ prisma: prismaMock }));
jest.unstable_mockModule("../src/services/emailService.js", () => ({ enviarEmailEmprestimo, enviarLembreteDevolucao: jest.fn(), explicarFalhaSmtp: (e) => `falha: ${e.message}` }));

const service = await import("../src/services/emprestimoService.js");

const ativo = { id: 10, id_exemplar: 5, statusDevolucao: false, dataInicio: new Date("2026-05-01T12:00:00Z"), diasLocacao: 14 };
const devolvido = { ...ativo, statusDevolucao: true };
const dados = { id_leitor: 1, id_exemplar: 5, diasLocacao: 14, enviarNotificacao: true };

beforeEach(() => {
  jest.clearAllMocks();
  prismaMock.$transaction.mockImplementation((arg) => (typeof arg === "function" ? arg(tx) : Promise.all(arg)));
  tx.leitor.findUnique.mockResolvedValue({ id: 1 });
  tx.suspensao.findFirst.mockResolvedValue(null);
  tx.exemplar.updateMany.mockResolvedValue({ count: 1 });
  tx.emprestimo.create.mockResolvedValue({ id: 99, ...dados });
  enviarEmailEmprestimo.mockResolvedValue({ enviado: true });
});

describe("criar empréstimo", () => {
  it("reserva o exemplar de forma atômica e cria o empréstimo", async () => {
    const r = await service.criar(dados);
    expect(tx.exemplar.updateMany).toHaveBeenCalledWith({ where: { id: 5, disponivel: true }, data: { disponivel: false } });
    expect(tx.emprestimo.create).toHaveBeenCalledWith(expect.objectContaining({ data: { id_leitor: 1, id_exemplar: 5, diasLocacao: 14 } }));
    expect(r).toMatchObject({ id: 99, emailNotification: { enviado: true } });
  });

  it("falha com 404 se o leitor não existe", async () => {
    tx.leitor.findUnique.mockResolvedValue(null);
    await expect(service.criar(dados)).rejects.toMatchObject({ status: 404, message: "Leitor não encontrado." });
    expect(tx.exemplar.updateMany).not.toHaveBeenCalled();
  });

  it("bloqueia leitor com suspensão por prazo, informando data e motivo", async () => {
    tx.suspensao.findFirst.mockResolvedValue({ motivo: "Atraso", dataFim: new Date("2026-06-10T15:00:00Z") });
    await expect(service.criar(dados)).rejects.toMatchObject({ status: 409, message: "Leitor suspenso até 10/06/2026. Motivo: Atraso" });
  });

  it("bloqueia leitor com suspensão indeterminada", async () => {
    tx.suspensao.findFirst.mockResolvedValue({ motivo: "Dano", dataFim: null });
    await expect(service.criar(dados)).rejects.toMatchObject({ status: 409, message: "Leitor suspenso. Motivo: Dano" });
  });

  it("responde 409 quando o exemplar já está emprestado", async () => {
    tx.exemplar.updateMany.mockResolvedValue({ count: 0 });
    tx.exemplar.findUnique.mockResolvedValue({ id: 5 });
    await expect(service.criar(dados)).rejects.toMatchObject({ status: 409, message: "Este exemplar já está emprestado." });
    expect(tx.emprestimo.create).not.toHaveBeenCalled();
  });

  it("responde 404 quando o exemplar não existe", async () => {
    tx.exemplar.updateMany.mockResolvedValue({ count: 0 });
    tx.exemplar.findUnique.mockResolvedValue(null);
    await expect(service.criar(dados)).rejects.toMatchObject({ status: 404, message: "Exemplar não encontrado." });
  });

  it("não envia e-mail quando a notificação está desligada", async () => {
    const r = await service.criar({ ...dados, enviarNotificacao: false });
    expect(enviarEmailEmprestimo).not.toHaveBeenCalled();
    expect(r.emailNotification).toEqual({ enviado: false, desativado: true });
  });

  it("mantém o empréstimo quando o e-mail falha", async () => {
    const spy = jest.spyOn(console, "warn").mockImplementation(() => {});
    enviarEmailEmprestimo.mockRejectedValue(new Error("SMTP fora"));
    const r = await service.criar(dados);
    expect(r.id).toBe(99);
    expect(r.emailNotification).toEqual({ enviado: false, motivo: "falha: SMTP fora" });
    spy.mockRestore();
  });
});

describe("consultas", () => {
  it("lista ativos filtrando por statusDevolucao", async () => {
    prismaMock.emprestimo.findMany.mockResolvedValue([]);
    await service.listarAtivos();
    expect(prismaMock.emprestimo.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { statusDevolucao: false } }));
  });

  it("lista todos sem filtro, do mais recente ao mais antigo", async () => {
    prismaMock.emprestimo.findMany.mockResolvedValue([]);
    await service.listar();
    expect(prismaMock.emprestimo.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: undefined, orderBy: { dataInicio: "desc" } }));
  });

  it("filtra atrasados pela data prevista", async () => {
    prismaMock.emprestimo.findMany.mockResolvedValue([
      { id: 1, statusDevolucao: false, dataInicio: new Date("2026-05-01T12:00:00Z"), diasLocacao: 7 },
      { id: 2, statusDevolucao: false, dataInicio: new Date("2026-05-10T12:00:00Z"), diasLocacao: 14 },
    ]);
    const r = await service.listarAtrasados(new Date("2026-05-12T12:00:00Z"));
    expect(r.map((e) => e.id)).toEqual([1]);
  });

  it("buscarPorId responde 404 para inexistente", async () => {
    prismaMock.emprestimo.findUnique.mockResolvedValue(null);
    await expect(service.buscarPorId(1)).rejects.toMatchObject({ status: 404 });
  });

  it("buscarAtivoPorExemplar responde 404 quando não há empréstimo ativo", async () => {
    prismaMock.emprestimo.findFirst.mockResolvedValue(null);
    await expect(service.buscarAtivoPorExemplar(5)).rejects.toMatchObject({ status: 404 });
    prismaMock.emprestimo.findFirst.mockResolvedValue(ativo);
    await expect(service.buscarAtivoPorExemplar(5)).resolves.toBe(ativo);
    expect(prismaMock.emprestimo.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id_exemplar: 5, statusDevolucao: false } }));
  });
});

describe("devolução", () => {
  it("marca como devolvido e libera o exemplar na mesma transação", async () => {
    prismaMock.emprestimo.findUnique.mockResolvedValue(ativo);
    prismaMock.emprestimo.update.mockResolvedValue(devolvido);
    prismaMock.exemplar.update.mockResolvedValue({});
    const r = await service.registrarDevolucao(10);
    expect(r).toBe(devolvido);
    expect(prismaMock.emprestimo.update).toHaveBeenCalledWith(expect.objectContaining({ data: { statusDevolucao: true, dataDevolucao: expect.any(Date) } }));
    expect(prismaMock.exemplar.update).toHaveBeenCalledWith({ where: { id: 5 }, data: { disponivel: true } });
  });

  it("recusa devolver duas vezes", async () => {
    prismaMock.emprestimo.findUnique.mockResolvedValue(devolvido);
    await expect(service.registrarDevolucao(10)).rejects.toMatchObject({ status: 409 });
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("desfaz devolução quando o exemplar continua disponível", async () => {
    prismaMock.emprestimo.findUnique.mockResolvedValue(devolvido);
    tx.exemplar.updateMany.mockResolvedValue({ count: 1 });
    tx.emprestimo.update.mockResolvedValue(ativo);
    await expect(service.desfazerDevolucao(10)).resolves.toBe(ativo);
    expect(tx.emprestimo.update).toHaveBeenCalledWith(expect.objectContaining({ data: { statusDevolucao: false, dataDevolucao: null } }));
  });

  it("não desfaz se o exemplar já foi emprestado de novo", async () => {
    prismaMock.emprestimo.findUnique.mockResolvedValue(devolvido);
    tx.exemplar.updateMany.mockResolvedValue({ count: 0 });
    await expect(service.desfazerDevolucao(10)).rejects.toMatchObject({ status: 409 });
    expect(tx.emprestimo.update).not.toHaveBeenCalled();
  });

  it("não desfaz empréstimo que não foi devolvido", async () => {
    prismaMock.emprestimo.findUnique.mockResolvedValue(ativo);
    await expect(service.desfazerDevolucao(10)).rejects.toMatchObject({ status: 409 });
  });
});

describe("renovação e remoção", () => {
  it("renova somando dias e zerando o lembrete", async () => {
    prismaMock.emprestimo.findUnique.mockResolvedValue(ativo);
    prismaMock.emprestimo.update.mockResolvedValue(ativo);
    await service.renovar(10, 7);
    expect(prismaMock.emprestimo.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 10 }, data: { diasLocacao: { increment: 7 }, lembreteEnviadoEm: null } }),
    );
  });

  it("não renova empréstimo devolvido", async () => {
    prismaMock.emprestimo.findUnique.mockResolvedValue(devolvido);
    await expect(service.renovar(10, 7)).rejects.toMatchObject({ status: 409 });
  });

  it("ao remover empréstimo ativo, libera o exemplar", async () => {
    prismaMock.emprestimo.findUnique.mockResolvedValue(ativo);
    prismaMock.emprestimo.delete.mockResolvedValue(ativo);
    prismaMock.exemplar.update.mockResolvedValue({});
    await expect(service.remover(10)).resolves.toBe(ativo);
    expect(prismaMock.exemplar.update).toHaveBeenCalledWith({ where: { id: 5 }, data: { disponivel: true } });
  });

  it("ao remover empréstimo devolvido, não mexe no exemplar", async () => {
    prismaMock.emprestimo.findUnique.mockResolvedValue(devolvido);
    prismaMock.emprestimo.delete.mockResolvedValue(devolvido);
    await service.remover(10);
    expect(prismaMock.exemplar.update).not.toHaveBeenCalled();
  });

  it("atualizar repassa os dados ao Prisma", async () => {
    prismaMock.emprestimo.update.mockResolvedValue(ativo);
    await service.atualizar(10, { diasLocacao: 20 });
    expect(prismaMock.emprestimo.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 10 }, data: { diasLocacao: 20 } }));
  });
});
