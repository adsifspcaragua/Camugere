import { createLeitorSchema } from "../src/schemas/leitorSchema.js";
import { loginSchema } from "../src/schemas/usuarioSchema.js";
import { createEmprestimoSchema } from "../src/schemas/emprestimoSchema.js";

describe("schemas", () => {
  it("normaliza leitor e aceita o campo legado 'contato'", () => {
    const r = createLeitorSchema.safeParse({ nome: "Joana", contato: "JOANA@X.COM", cpf: "529.982.247-25", telefone: "" });
    expect(r.success).toBe(true);
    expect(r.data).toEqual({ nome: "Joana", email: "joana@x.com", cpf: "52998224725", telefone: null });
  });
  it("rejeita CPF inválido", () => {
    expect(createLeitorSchema.safeParse({ nome: "Joana", email: "j@x.com", cpf: "11111111111" }).success).toBe(false);
  });
  it("login aceita 'hash' como alias de 'senha'", () => {
    expect(loginSchema.parse({ email: "a@b.com", hash: "123" })).toEqual({ email: "a@b.com", senha: "123" });
  });
  it("empréstimo usa 14 dias por padrão", () => {
    expect(createEmprestimoSchema.parse({ id_leitor: "1", id_exemplar: 2 }).diasLocacao).toBe(14);
  });
});
