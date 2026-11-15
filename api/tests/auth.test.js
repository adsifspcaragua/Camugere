import { jest } from "@jest/globals";
import jwt from "jsonwebtoken";

const prismaMock = { bibliotecario: { findFirst: jest.fn() } };
jest.unstable_mockModule("../src/lib/prisma.js", () => ({ prisma: prismaMock }));

const { authMiddleware, extractToken } = await import("../src/middlewares/auth.js");

const assinar = (payload, segredo = "test-secret", opts) => jwt.sign(payload, segredo, opts);

async function rodar(headers) {
  const req = { headers };
  const next = jest.fn();
  await authMiddleware(req, {}, next);
  const [erro] = next.mock.calls[0];
  return { req, next, erro };
}

beforeEach(() => {
  jest.clearAllMocks();
  prismaMock.bibliotecario.findFirst.mockResolvedValue({ id: 7 });
});

describe("extractToken", () => {
  it("lê o header Bearer", () => {
    expect(extractToken({ headers: { authorization: "Bearer abc" } })).toBe("abc");
  });

  it("aceita o header legado jwt_token", () => {
    expect(extractToken({ headers: { jwt_token: "legado" } })).toBe("legado");
  });

  it("ignora Authorization sem o prefixo Bearer", () => {
    expect(extractToken({ headers: { authorization: "Basic xyz" } })).toBeUndefined();
  });
});

describe("authMiddleware", () => {
  it("rejeita requisição sem token", async () => {
    const { erro } = await rodar({});
    expect(erro.status).toBe(401);
    expect(erro.message).toMatch(/não informado/);
  });

  it("rejeita token assinado com outro segredo", async () => {
    const { erro } = await rodar({ authorization: `Bearer ${assinar({ id: 1, id_bibliotecario: 7 }, "outro")}` });
    expect(erro.status).toBe(401);
    expect(prismaMock.bibliotecario.findFirst).not.toHaveBeenCalled();
  });

  it("rejeita token expirado", async () => {
    const { erro } = await rodar({ authorization: `Bearer ${assinar({ id: 1, id_bibliotecario: 7, exp: 1 })}` });
    expect(erro.status).toBe(401);
  });

  it("rejeita token sem id_bibliotecario", async () => {
    const { erro } = await rodar({ authorization: `Bearer ${assinar({ id: 1 })}` });
    expect(erro.status).toBe(401);
    expect(prismaMock.bibliotecario.findFirst).not.toHaveBeenCalled();
  });

  it("rejeita token de usuário que não é mais bibliotecário (acesso revogado)", async () => {
    prismaMock.bibliotecario.findFirst.mockResolvedValue(null);
    const { erro, req } = await rodar({ authorization: `Bearer ${assinar({ id: 0, id_bibliotecario: 0 })}` });
    expect(erro.status).toBe(401);
    expect(erro.message).toMatch(/revogado/);
    expect(req.auth).toBeUndefined();
  });

  it("confere o par usuário/bibliotecário no banco", async () => {
    await rodar({ authorization: `Bearer ${assinar({ id: 3, id_bibliotecario: 7 })}` });
    expect(prismaMock.bibliotecario.findFirst).toHaveBeenCalledWith({
      where: { id: 7, id_usuario: 3 },
      select: { id: true },
    });
  });

  it("encaminha falha do banco ao handler de erro", async () => {
    const falha = new Error("db down");
    prismaMock.bibliotecario.findFirst.mockRejectedValue(falha);
    const { erro } = await rodar({ authorization: `Bearer ${assinar({ id: 3, id_bibliotecario: 7 })}` });
    expect(erro).toBe(falha);
  });

  it("libera token válido de bibliotecário ativo e preenche req.auth", async () => {
    const { erro, req } = await rodar({ authorization: `Bearer ${assinar({ id: 3, id_bibliotecario: 7 })}` });
    expect(erro).toBeUndefined();
    expect(req.auth).toMatchObject({ id: 3, id_bibliotecario: 7 });
  });
});
