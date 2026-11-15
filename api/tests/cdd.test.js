import { jest } from "@jest/globals";

const prismaMock = {
  cdd: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
};
jest.unstable_mockModule("../src/lib/prisma.js", () => ({ prisma: prismaMock }));

const { normalizarCodigo, mesmaDescricao } = await import("../src/lib/cdd.js");
const { createCddSchema } = await import("../src/schemas/cddSchema.js");
const cddService = await import("../src/services/cddService.js");

beforeEach(() => jest.resetAllMocks());

describe("normalizarCodigo", () => {
  it("remove espaços, troca vírgula por ponto e preserva letras", () => {
    expect(normalizarCodigo(" 869,3 ")).toBe("869.3");
    expect(normalizarCodigo("869 e")).toBe("869e");
    expect(normalizarCodigo(null)).toBe("");
  });

  it("compara descrições ignorando caixa e espaços extras", () => {
    expect(mesmaDescricao(" Ciência  política", "ciência política")).toBe(true);
    expect(mesmaDescricao("História", "Geografia")).toBe(false);
  });
});

describe("createCddSchema", () => {
  it("normaliza o código", () => {
    expect(createCddSchema.parse({ id: " 869,3", descricao: "Ficção" }).id).toBe("869.3");
  });

  it("rejeita código que não começa com número", () => {
    expect(() => createCddSchema.parse({ id: "abc", descricao: "x" })).toThrow();
    expect(() => createCddSchema.parse({ id: "  ", descricao: "x" })).toThrow();
  });
});

describe("cddService", () => {
  it("lista com a quantidade de obras vinculadas", async () => {
    prismaMock.cdd.findMany.mockResolvedValue([{ id: "869.3", descricao: "Ficção", _count: { obras: 4 } }]);
    expect(await cddService.listar()).toEqual([{ id: "869.3", descricao: "Ficção", obras: 4 }]);
  });

  it("recusa cadastrar um código que já existe", async () => {
    prismaMock.cdd.findUnique.mockResolvedValue({ id: "869.3", descricao: "Ficção" });
    await expect(cddService.criar({ id: "869.3", descricao: "Outra" })).rejects.toMatchObject({ status: 409 });
    expect(prismaMock.cdd.create).not.toHaveBeenCalled();
  });

  it("não exclui CDD em uso por obras", async () => {
    prismaMock.cdd.findUnique.mockResolvedValue({ id: "869.3", descricao: "Ficção", _count: { obras: 2 } });
    await expect(cddService.remover("869.3")).rejects.toMatchObject({ status: 409 });
    expect(prismaMock.cdd.delete).not.toHaveBeenCalled();
  });

  it("exclui CDD sem obras", async () => {
    prismaMock.cdd.findUnique.mockResolvedValue({ id: "100", descricao: "Filosofia", _count: { obras: 0 } });
    prismaMock.cdd.delete.mockResolvedValue({ id: "100", descricao: "Filosofia" });
    await cddService.remover("100");
    expect(prismaMock.cdd.delete).toHaveBeenCalledWith({ where: { id: "100" }, select: { id: true, descricao: true } });
  });
});
