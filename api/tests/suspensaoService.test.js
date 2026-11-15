import { jest } from "@jest/globals";

const prismaMock = {
  leitor: { findUnique: jest.fn() },
  suspensao: { findFirst: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
};
jest.unstable_mockModule("../src/lib/prisma.js", () => ({ prisma: prismaMock }));

const service = await import("../src/services/suspensaoService.js");

beforeEach(() => {
  jest.clearAllMocks();
  prismaMock.leitor.findUnique.mockResolvedValue({ id: 1 });
  prismaMock.suspensao.findFirst.mockResolvedValue(null);
  prismaMock.suspensao.create.mockImplementation(({ data }) => Promise.resolve(data));
});

describe("regras de situação", () => {
  const agora = new Date("2026-05-10T12:00:00Z");

  it("suspensão com fim no passado não está ativa", () => {
    expect(service.isAtiva({ dataFim: "2026-05-10T11:59:59Z", dataEncerramento: null }, agora)).toBe(false);
  });

  it("suspensão encerrada manualmente não está ativa mesmo sem data de fim", () => {
    expect(service.isAtiva({ dataFim: null, dataEncerramento: "2026-05-01" }, agora)).toBe(false);
  });

  it("whereAtiva filtra não encerradas e sem fim ou com fim futuro", () => {
    expect(service.whereAtiva(agora)).toEqual({ dataEncerramento: null, OR: [{ dataFim: null }, { dataFim: { gt: agora } }] });
  });
});

describe("suspender", () => {
  it("cria suspensão com prazo em dias e registra o bibliotecário", async () => {
    const r = await service.suspender(1, { motivo: "Atraso", dias: 10 }, 7);
    expect(r).toMatchObject({ id_leitor: 1, motivo: "Atraso", id_bibliotecario: 7 });
    expect(Math.round((r.dataFim - r.dataInicio) / 86_400_000)).toBe(10);
  });

  it("cria suspensão indeterminada quando dias é nulo", async () => {
    const r = await service.suspender(1, { motivo: "Dano", dias: null }, 7);
    expect(r.dataFim).toBeNull();
  });

  it("responde 404 para leitor inexistente", async () => {
    prismaMock.leitor.findUnique.mockResolvedValue(null);
    await expect(service.suspender(1, { motivo: "x" }, 7)).rejects.toMatchObject({ status: 404 });
  });

  it("não permite duas suspensões ativas", async () => {
    prismaMock.suspensao.findFirst.mockResolvedValue({ id: 3 });
    await expect(service.suspender(1, { motivo: "x" }, 7)).rejects.toMatchObject({ status: 409 });
    expect(prismaMock.suspensao.create).not.toHaveBeenCalled();
  });
});

describe("encerrar e listar", () => {
  it("encerra suspensão ativa", async () => {
    prismaMock.suspensao.findUnique.mockResolvedValue({ id: 3, dataFim: null, dataEncerramento: null });
    prismaMock.suspensao.update.mockResolvedValue({ id: 3 });
    await service.encerrar(3);
    expect(prismaMock.suspensao.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 3 }, data: { dataEncerramento: expect.any(Date) } }));
  });

  it("responde 404 para suspensão inexistente e 409 para já encerrada", async () => {
    prismaMock.suspensao.findUnique.mockResolvedValue(null);
    await expect(service.encerrar(3)).rejects.toMatchObject({ status: 404 });
    prismaMock.suspensao.findUnique.mockResolvedValue({ id: 3, dataFim: null, dataEncerramento: new Date() });
    await expect(service.encerrar(3)).rejects.toMatchObject({ status: 409 });
  });

  it("anexa a situação de cada suspensão ao histórico", async () => {
    prismaMock.suspensao.findMany.mockResolvedValue([
      { id: 1, dataFim: null, dataEncerramento: null },
      { id: 2, dataFim: "2000-01-01", dataEncerramento: null },
    ]);
    const r = await service.listarPorLeitor(1);
    expect(r.map((s) => s.situacao)).toEqual(["ativa", "cumprida"]);
  });

  it("buscarAtiva usa o client recebido (transação)", async () => {
    const db = { suspensao: { findFirst: jest.fn().mockResolvedValue(null) } };
    await service.buscarAtiva(1, db);
    expect(db.suspensao.findFirst).toHaveBeenCalled();
    expect(prismaMock.suspensao.findFirst).not.toHaveBeenCalled();
  });
});
