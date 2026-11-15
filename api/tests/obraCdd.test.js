import { jest } from "@jest/globals";

const tx = {
  cdd: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
  autor: { findFirst: jest.fn(), create: jest.fn() },
  obra: { create: jest.fn(), update: jest.fn(), findUnique: jest.fn(), findFirst: jest.fn() },
  exemplar: { create: jest.fn(), findMany: jest.fn(), count: jest.fn() },
};
const prismaMock = { ...tx, $transaction: jest.fn((fn) => fn(tx)) };
jest.unstable_mockModule("../src/lib/prisma.js", () => ({ prisma: prismaMock }));
jest.unstable_mockModule("../src/services/exemplarService.js", () => ({ criarParaObra: jest.fn() }));

const obraService = await import("../src/services/obraService.js");
const obraCriada = { id: 1, titulo: "T", autores: [], exemplares: [], cdd: null };

beforeEach(() => {
  jest.clearAllMocks();
  prismaMock.$transaction.mockImplementation((fn) => fn(tx));
  tx.autor.findFirst.mockResolvedValue({ id: 1 });
  tx.obra.create.mockResolvedValue({ id: 1 });
  tx.obra.update.mockResolvedValue(obraCriada);
  tx.obra.findUnique.mockResolvedValue(obraCriada);
  tx.obra.findFirst.mockResolvedValue(null);
});

describe("vínculo de CDD na obra", () => {
  it("conecta a um CDD já cadastrado, normalizando o código", async () => {
    tx.cdd.findUnique.mockResolvedValue({ id: "869.3", descricao: "Ficção" });
    await obraService.criar({ titulo: "T", autor: "A B", cdd: "869,3", cddDescricao: "ficção", numExemplares: 1 });
    expect(tx.cdd.findUnique).toHaveBeenCalledWith({ where: { id: "869.3" } });
    expect(tx.obra.create.mock.calls[0][0].data.cdd).toEqual({ connect: { id: "869.3" } });
    expect(tx.cdd.create).not.toHaveBeenCalled();
  });

  it("recusa descrição divergente de um CDD cadastrado", async () => {
    tx.cdd.findUnique.mockResolvedValue({ id: "869.3", descricao: "Ficção" });
    await expect(obraService.criar({ titulo: "T", autor: "A B", cdd: "869.3", cddDescricao: "Poesia", numExemplares: 1 })).rejects.toMatchObject({ status: 409 });
  });

  it("exige descrição para cadastrar um CDD novo", async () => {
    tx.cdd.findUnique.mockResolvedValue(null);
    await expect(obraService.criar({ titulo: "T", autor: "A B", cdd: "123", numExemplares: 1 })).rejects.toMatchObject({ status: 400 });
    expect(tx.cdd.create).not.toHaveBeenCalled();
  });

  it("cadastra o CDD novo quando há descrição", async () => {
    tx.cdd.findUnique.mockResolvedValue(null);
    await obraService.criar({ titulo: "T", autor: "A B", cdd: "123", cddDescricao: "Nova classe", numExemplares: 1 });
    expect(tx.cdd.create).toHaveBeenCalledWith({ data: { id: "123", descricao: "Nova classe" } });
  });

  it("desvincula o CDD quando o campo é limpo na edição", async () => {
    await obraService.atualizar(1, { cdd: null, cddDescricao: null });
    expect(tx.obra.update.mock.calls[0][0].data.cdd).toEqual({ disconnect: true });
  });

  it("importação cadastra CDD novo mesmo sem descrição e lista os códigos a completar", async () => {
    tx.cdd.findUnique.mockResolvedValue(null);
    const res = await obraService.importarEmLote([{ titulo: "Livro", autor: "A B", cdd: "869e" }]);
    expect(tx.cdd.create).toHaveBeenCalledWith({ data: { id: "869e", descricao: "" } });
    expect(tx.obra.create.mock.calls[0][0].data.cdd).toEqual({ connect: { id: "869e" } });
    expect(res.criadas).toBe(1);
    expect(res.cddsSemDescricao).toEqual(["869e"]);
  });

  it("a descrição informada completa um CDD cadastrado sem descrição", async () => {
    tx.cdd.findUnique.mockResolvedValue({ id: "869.3", descricao: "" });
    await obraService.criar({ titulo: "T", autor: "A B", cdd: "869.3", cddDescricao: "Ficção", numExemplares: 1 });
    expect(tx.cdd.update).toHaveBeenCalledWith({ where: { id: "869.3" }, data: { descricao: "Ficção" } });
  });
});
