import { formatCpf, formatPhone, initials, matches, toCsv } from "../lib/format.js";

describe("format", () => {
  it("mascara CPF e telefone progressivamente", () => {
    expect(formatCpf("52998224725")).toBe("529.982.247-25");
    expect(formatCpf("5299")).toBe("529.9");
    expect(formatPhone("21987654321")).toBe("(21) 98765-4321");
    expect(formatPhone("2133334444")).toBe("(21) 3333-4444");
  });
  it("gera iniciais com primeiro e último nome", () => expect(initials("Carolina Maria de Jesus")).toBe("CJ"));
  it("busca ignorando acentos e caixa", () => expect(matches("joao", "João Silva")).toBe(true));
  it("escapa aspas no CSV", () => expect(toCsv([['a"b', 1]])).toBe('"a""b","1"'));
});
