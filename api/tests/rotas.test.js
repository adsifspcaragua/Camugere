import { jest } from "@jest/globals";
import fs from "fs";
import path from "path";
import jwt from "jsonwebtoken";

const prismaMock = {
  bibliotecario: { findFirst: jest.fn(), findUnique: jest.fn(), count: jest.fn() },
  leitor: { findUnique: jest.fn() },
  suspensao: { findFirst: jest.fn(), create: jest.fn() },
  emprestimo: { findUnique: jest.fn(), findMany: jest.fn(), update: jest.fn() },
  obraAutor: { findMany: jest.fn(), create: jest.fn(), delete: jest.fn() },
};
jest.unstable_mockModule("../src/lib/prisma.js", () => ({ prisma: prismaMock }));

const { default: request } = await import("supertest");
const { default: app } = await import("../src/app.js");
const { CAPAS_DIR } = await import("../src/services/capaService.js");

const auth = { Authorization: `Bearer ${jwt.sign({ id: 3, id_bibliotecario: 7 }, "test-secret")}` };
const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(16)]);
const criados = [];

beforeEach(() => {
  jest.clearAllMocks();
  prismaMock.bibliotecario.findFirst.mockResolvedValue({ id: 7 });
});

afterAll(() => {
  for (const arquivo of criados) fs.rmSync(path.join(CAPAS_DIR, arquivo), { force: true });
});

describe("rotas públicas e autenticação", () => {
  it("GET / responde status ok", async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });

  it("rejeita token de bibliotecário removido (D3)", async () => {
    prismaMock.bibliotecario.findFirst.mockResolvedValue(null);
    const res = await request(app).get("/obraautor/list").set(auth);
    expect(res.status).toBe(401);
  });

  it("POST /validate devolve o payload de um token válido", async () => {
    const token = jwt.sign({ id: 3 }, "test-secret");
    const res = await request(app).post("/validate").send({ token });
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(3);
  });

  it("POST /login valida o corpo antes de consultar o banco", async () => {
    const res = await request(app).post("/login").send({ email: "invalido" });
    expect(res.status).toBe(400);
    expect(res.body.details.length).toBeGreaterThan(0);
  });
});

describe("leitor / suspensão", () => {
  it("registra o bibliotecário do token como autor da suspensão", async () => {
    prismaMock.leitor.findUnique.mockResolvedValue({ id: 1 });
    prismaMock.suspensao.findFirst.mockResolvedValue(null);
    prismaMock.suspensao.create.mockImplementation(({ data }) => Promise.resolve({ id: 1, ...data }));
    const res = await request(app).post("/leitor/1/suspender").set(auth).send({ motivo: "Atraso recorrente", dias: 5 });
    expect(res.status).toBe(201);
    expect(prismaMock.suspensao.create.mock.calls[0][0].data.id_bibliotecario).toBe(7);
  });

  it("rejeita motivo curto demais", async () => {
    const res = await request(app).post("/leitor/1/suspender").set(auth).send({ motivo: "x" });
    expect(res.status).toBe(400);
  });
});

describe("empréstimo", () => {
  it("renovar rejeita mais de 365 dias", async () => {
    const res = await request(app).patch("/emprestimo/renovar/10").set(auth).send({ dias: 400 });
    expect(res.status).toBe(400);
  });

  it("renovar aplica o padrão de 14 dias", async () => {
    prismaMock.emprestimo.findUnique.mockResolvedValue({ id: 10, statusDevolucao: false });
    prismaMock.emprestimo.update.mockResolvedValue({ id: 10 });
    const res = await request(app).patch("/emprestimo/renovar/10").set(auth).send({});
    expect(res.status).toBe(200);
    expect(prismaMock.emprestimo.update.mock.calls[0][0].data.diasLocacao).toEqual({ increment: 14 });
  });

  it("GET /emprestimo/lembretes informa a contagem de pendentes", async () => {
    prismaMock.emprestimo.findMany.mockResolvedValue([]);
    const res = await request(app).get("/emprestimo/lembretes").set(auth);
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ diasAntes: 2, pendentes: 0 });
  });
});

describe("bibliotecário", () => {
  it("impede remover o próprio acesso", async () => {
    const res = await request(app).delete("/bibliotecario/delete/7").set(auth);
    expect(res.status).toBe(409);
  });

  it("não expõe rota de atualização", async () => {
    const res = await request(app).put("/bibliotecario/update/1").set(auth).send({});
    expect(res.status).toBe(404);
  });
});

describe("obra x autor", () => {
  it("valida ids da rota", async () => {
    const res = await request(app).get("/obraautor/getbyid/obra/abc").set(auth);
    expect(res.status).toBe(400);
    expect(res.body.message).toContain("id_obra");
  });

  it("remove vínculo pela chave composta", async () => {
    prismaMock.obraAutor.delete.mockResolvedValue({ id_obra: 1, id_autor: 2 });
    const res = await request(app).delete("/obraautor/delete/1/2").set(auth);
    expect(res.status).toBe(200);
    expect(prismaMock.obraAutor.delete).toHaveBeenCalledWith(expect.objectContaining({ where: { id_obra_id_autor: { id_obra: 1, id_autor: 2 } } }));
  });
});

describe("upload de capa", () => {
  it("exige arquivo ou URL", async () => {
    const res = await request(app).post("/upload/capa").set(auth);
    expect(res.status).toBe(400);
  });

  it("recusa tipos que não são imagem", async () => {
    const res = await request(app).post("/upload/capa").set(auth).attach("capa", Buffer.from("oi"), { filename: "x.txt", contentType: "text/plain" });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Formato inválido/);
  });

  it("salva PNG enviado e devolve URL pública", async () => {
    const res = await request(app).post("/upload/capa").set(auth).attach("capa", PNG, { filename: "c.png", contentType: "image/png" });
    expect(res.status).toBe(201);
    expect(res.body.path).toMatch(/^\/uploads\/capas\/\d+-[0-9a-f]{12}\.png$/);
    criados.push(path.basename(res.body.path));
  });

  it("recusa URL para rede interna (SSRF)", async () => {
    const res = await request(app).post("/upload/capa").set(auth).send({ url: "http://127.0.0.1/capa.png" });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Endereço da capa não permitido.");
  });
});
