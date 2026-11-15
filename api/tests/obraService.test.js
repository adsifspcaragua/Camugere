import { jest } from "@jest/globals";

const tx = {
  cdd: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
  autor: { findFirst: jest.fn(), create: jest.fn() },
  obra: { create: jest.fn(), update: jest.fn(), findUnique: jest.fn() },
};
const prismaMock = {
  obra: { findMany: jest.fn(), findUnique: jest.fn(), findFirst: jest.fn(), delete: jest.fn() },
  exemplar: { count: jest.fn() },
  $transaction: jest.fn(),
};
const criarParaObra = jest.fn();
jest.unstable_mockModule("../src/lib/prisma.js", () => ({ prisma: prismaMock }));
jest.unstable_mockModule("../src/services/exemplarService.js", () => ({ criarParaObra }));

const obraService = await import("../src/services/obraService.js");

const obraDb = {
  id: 1,
  titulo: "Dom Casmurro",
  cdd: { id: "869.3", descricao: "Ficção" },
  autores: [{ autor: { nome: "Machado", sobrenome: "de Assis" } }],
  exemplares: [],
};

beforeEach(() => {
  jest.clearAllMocks();
  prismaMock.$transaction.mockImplementation((fn) => fn(tx));
  prismaMock.obra.findFirst.mockResolvedValue(null);
  tx.autor.findFirst.mockResolvedValue(null);
  tx.autor.create.mockResolvedValueOnce({ id: 1 }).mockResolvedValue({ id: 2 });
  tx.obra.create.mockResolvedValue({ id: 1 });
  tx.obra.findUnique.mockResolvedValue(obraDb);
  tx.obra.update.mockResolvedValue(obraDb);
  tx.cdd.findUnique.mockResolvedValue({ id: "869.3", descricao: "Ficção" });
});

describe("formatação e consultas", () => {
  it("achata autores e CDD", () => {
    expect(obraService.formatarObra(obraDb)).toMatchObject({ id: 1, cdd: "869.3", cddDescricao: "Ficção" });
    expect(obraService.formatarObra({ ...obraDb, cdd: null, autores: [] })).toMatchObject({ autor: "", cdd: null, cddDescricao: null });
    expect(obraService.formatarObra(null)).toBeNull();
  });

  it("lista só obras ativas, em ordem de título", async () => {
    prismaMock.obra.findMany.mockResolvedValue([obraDb]);
    const r = await obraService.listar();
    expect(prismaMock.obra.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { ativa: true }, orderBy: { titulo: "asc" } }));
    expect(r).toHaveLength(1);
  });

  it("buscarPorId responde 404 para inexistente", async () => {
    prismaMock.obra.findUnique.mockResolvedValue(null);
    await expect(obraService.buscarPorId(9)).rejects.toMatchObject({ status: 404 });
    prismaMock.obra.findUnique.mockResolvedValue(obraDb);
    await expect(obraService.buscarPorId(1)).resolves.toMatchObject({ titulo: "Dom Casmurro" });
  });
});

describe("criar e atualizar", () => {
  it("recusa ISBN duplicado ao criar", async () => {
    prismaMock.obra.findFirst.mockResolvedValue({ id: 2, titulo: "Outra" });
    await expect(obraService.criar({ titulo: "T", isbn: "123", autor: "A B" })).rejects.toMatchObject({ status: 409 });
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("cria autores novos, reaproveita existentes e sem duplicar", async () => {
    tx.autor.findFirst.mockImplementation(({ where }) => Promise.resolve(where.nome === "Machado" ? { id: 5 } : null));
    await obraService.criar({ titulo: "T", autor: "Machado de Assis, Clarice Lispector, machado de assis", numExemplares: 2 });
    expect(tx.obra.create.mock.calls[0][0].data.autores.create).toEqual([{ id_autor: 5 }, { id_autor: 1 }]);
    expect(criarParaObra).toHaveBeenCalledWith(tx, 1, 2);
  });

  it("recusa ISBN que pertence a outra obra ao atualizar", async () => {
    prismaMock.obra.findFirst.mockResolvedValue({ id: 2, titulo: "Outra" });
    await expect(obraService.atualizar(1, { isbn: "123" })).rejects.toMatchObject({ status: 409 });
    expect(prismaMock.obra.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { isbn: "123", NOT: { id: 1 } } }));
  });

  it("só troca os autores quando o campo é enviado", async () => {
    await obraService.atualizar(1, { titulo: "Novo" });
    expect(tx.obra.update.mock.calls[0][0].data).toEqual({ titulo: "Novo" });
    await obraService.atualizar(1, { autor: "Clarice Lispector" });
    expect(tx.obra.update.mock.calls[1][0].data.autores).toEqual({ deleteMany: {}, create: [{ id_autor: 1 }] });
  });

  it("não exclui obra com exemplares emprestados", async () => {
    prismaMock.exemplar.count.mockResolvedValue(1);
    await expect(obraService.remover(1)).rejects.toMatchObject({ status: 409 });
    prismaMock.exemplar.count.mockResolvedValue(0);
    await obraService.remover(1);
    expect(prismaMock.obra.delete).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 1 } }));
  });
});

describe("importação em lote", () => {
  it("rejeita linha sem título e segue com as demais", async () => {
    const r = await obraService.importarEmLote([{ titulo: "  " }, { titulo: "Livro", autor: "A B" }]);
    expect(r.criadas).toBe(1);
    expect(r.erros).toEqual([{ linha: 1, erro: "Título não informado ou inválido." }]);
  });

  it("acrescenta exemplares e completa só os campos vazios de obra existente", async () => {
    prismaMock.obra.findFirst.mockResolvedValueOnce({ id: 7, isbn: "111", editora: "Antiga", autores: [], id_cdd: null });
    tx.cdd.findUnique.mockResolvedValue(null);
    const r = await obraService.importarEmLote([
      { isbn: "111", titulo: "Livro", editora: "Nova", anoPublicacao: 1999, autor: "A B", cdd: "800", numExemplares: "3" },
    ]);
    expect(criarParaObra).toHaveBeenCalledWith(tx, 7, 3);
    const { data } = tx.obra.update.mock.calls[0][0];
    expect(data).toMatchObject({ anoPublicacao: 1999, cdd: { connect: { id: "800" } } });
    expect(data).not.toHaveProperty("editora");
    expect(data).not.toHaveProperty("isbn");
    expect(r).toMatchObject({ criadas: 0, atualizadas: 1, exemplaresCriados: 3, cddsSemDescricao: ["800"] });
  });

  it("procura por título quando o ISBN não encontra a obra", async () => {
    prismaMock.obra.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 8, autores: [{}], id_cdd: "869.3", isbn: "x", editora: "x" });
    const r = await obraService.importarEmLote([{ isbn: "999", titulo: " Livro ", editora: "Y" }]);
    expect(prismaMock.obra.findFirst.mock.calls[1][0].where).toEqual({ titulo: "Livro" });
    expect(tx.obra.update).not.toHaveBeenCalled();
    expect(r.atualizadas).toBe(1);
  });

  it("registra o erro da linha sem interromper a importação", async () => {
    prismaMock.$transaction.mockRejectedValueOnce(new Error("falha no banco"));
    const r = await obraService.importarEmLote([{ titulo: "A", autor: "A B" }, { titulo: "B", autor: "A B" }]);
    expect(r.erros).toEqual([{ linha: 1, titulo: "A", erro: "falha no banco" }]);
    expect(r.criadas).toBe(1);
  });

  it("usa 1 exemplar quando a quantidade é inválida", async () => {
    await obraService.importarEmLote([{ titulo: "A", autor: "A B", numExemplares: "abc" }]);
    expect(criarParaObra).toHaveBeenCalledWith(tx, 1, 1);
  });
});
