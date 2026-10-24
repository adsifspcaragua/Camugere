import { jest } from "@jest/globals";
import jwt from "jsonwebtoken";

const prismaMock = {
  cdd: { findMany: jest.fn() },
  emprestimo: { findUnique: jest.fn() },
};
jest.unstable_mockModule("../src/lib/prisma.js", () => ({ prisma: prismaMock }));

const { default: request } = await import("supertest");
const { default: app } = await import("../src/app.js");
const token = jwt.sign({ id: 1, id_bibliotecario: 1 }, "test-secret");
const auth = { Authorization: `Bearer ${token}` };

describe("API", () => {
  it("bloqueia rotas protegidas sem token", async () => {
    const res = await request(app).get("/cdd/list");
    expect(res.status).toBe(401);
  });

  it("aceita o header legado jwt_token", async () => {
    prismaMock.cdd.findMany.mockResolvedValue([{ id: "869.3", descricao: "Ficção" }]);
    const res = await request(app).get("/cdd/list").set("jwt_token", token);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });

  it("retorna 400 com detalhes quando o corpo é inválido", async () => {
    const res = await request(app).post("/emprestimo/create").set(auth).send({ id_leitor: "x" });
    expect(res.status).toBe(400);
    expect(res.body.details.length).toBeGreaterThan(0);
  });

  it("retorna 404 para empréstimo inexistente", async () => {
    prismaMock.emprestimo.findUnique.mockResolvedValue(null);
    const res = await request(app).patch("/emprestimo/devolver/99").set(auth);
    expect(res.status).toBe(404);
  });

  it("retorna 400 para id inválido", async () => {
    const res = await request(app).get("/emprestimo/get/abc").set(auth);
    expect(res.status).toBe(400);
  });
});
