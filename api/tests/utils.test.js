import { isValidCpf, onlyDigits } from "../src/utils/cpf.js";
import { addDays, isAtrasado } from "../src/utils/dates.js";
import { formatarInventario, gerarInventarios, proximoSequencial } from "../src/services/inventario.js";

describe("cpf", () => {
  it("aceita CPF válido com ou sem máscara", () => {
    expect(isValidCpf("529.982.247-25")).toBe(true);
    expect(isValidCpf("52998224725")).toBe(true);
  });
  it("rejeita dígitos repetidos, tamanho errado e dígito verificador incorreto", () => {
    expect(isValidCpf("11111111111")).toBe(false);
    expect(isValidCpf("123")).toBe(false);
    expect(isValidCpf("52998224724")).toBe(false);
  });
  it("remove caracteres não numéricos", () => expect(onlyDigits("(21) 9999-0000")).toBe("2199990000"));
});

describe("datas", () => {
  it("soma dias", () => expect(addDays("2026-01-30T12:00:00Z", 3).toISOString().slice(0, 10)).toBe("2026-02-02"));
  it("só considera atrasado empréstimo não devolvido e vencido", () => {
    const hoje = new Date("2026-03-20T12:00:00Z");
    const base = { dataInicio: new Date("2026-03-01T12:00:00Z"), diasLocacao: 14 };
    expect(isAtrasado({ ...base, statusDevolucao: false }, hoje)).toBe(true);
    expect(isAtrasado({ ...base, statusDevolucao: true }, hoje)).toBe(false);
    expect(isAtrasado({ ...base, diasLocacao: 30, statusDevolucao: false }, hoje)).toBe(false);
  });
});

describe("inventário", () => {
  it("formata com zeros à esquerda", () => expect(formatarInventario(12, 3)).toBe("0012-03"));
  it("continua a sequência existente da obra", () => {
    expect(proximoSequencial(["0012-01", "0012-04", "0099-09"], 12)).toBe(5);
    expect(gerarInventarios(7, 2)).toEqual(["0007-01", "0007-02"]);
  });
});
