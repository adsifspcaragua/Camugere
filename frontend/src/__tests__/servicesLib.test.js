import { vi } from "vitest";
import { loadSettings, saveSettings } from "../services/settings.js";
import { buscarCep } from "../services/cepService.js";
import * as emprestimoService from "../services/emprestimoService.js";
import { CLASSES_CDD, devolveuAtrasado, filterByPeriod, porClasseCdd, porMes, relatorioAtrasos, topAtrasos, topLeitores, topObras } from "../lib/reports.js";
import { tomPara } from "../lib/palette.js";

const resposta = (status, body) => ({ ok: status < 300, status, json: () => Promise.resolve(body) });

beforeEach(() => {
  localStorage.clear();
  globalThis.fetch = vi.fn();
});

describe("settings", () => {
  it("usa padrões e mescla o que foi salvo", () => {
    expect(loadSettings()).toEqual({ prazoPadrao: 14, renovacaoDias: 14, enviarEmailPadrao: true });
    saveSettings({ prazoPadrao: 7 });
    expect(loadSettings()).toMatchObject({ prazoPadrao: 7, renovacaoDias: 14 });
  });

  it("volta aos padrões se o armazenamento estiver corrompido", () => {
    localStorage.setItem("camugere:settings", "{quebrado");
    expect(loadSettings().prazoPadrao).toBe(14);
  });
});

describe("buscarCep", () => {
  it("converte a resposta do ViaCEP", async () => {
    fetch.mockResolvedValue(resposta(200, { logradouro: "Rua A", bairro: "Centro", localidade: "Caraguatatuba", uf: "SP" }));
    await expect(buscarCep("11660000")).resolves.toEqual({ logradouro: "Rua A", bairro: "Centro", cidade: "Caraguatatuba", uf: "SP" });
    expect(fetch.mock.calls[0][0]).toBe("https://viacep.com.br/ws/11660000/json/");
  });

  it("informa CEP inexistente ou malformado", async () => {
    fetch.mockResolvedValue(resposta(200, { erro: true }));
    await expect(buscarCep("00000000")).rejects.toThrow("CEP não encontrado");
    fetch.mockResolvedValue(resposta(400, null));
    await expect(buscarCep("1")).rejects.toThrow("CEP não encontrado");
  });

  it("informa falha de rede", async () => {
    fetch.mockRejectedValue(new TypeError("offline"));
    await expect(buscarCep("11660000")).rejects.toThrow(/Não foi possível consultar/);
  });
});

describe("emprestimoService (frontend)", () => {
  beforeEach(() => fetch.mockResolvedValue(resposta(200, { data: { ok: true } })));

  it.each([
    ["listEmprestimos", [], "GET", "/emprestimo/list"],
    ["createEmprestimo", [{ id_leitor: 1 }], "POST", "/emprestimo/create"],
    ["devolverEmprestimo", [3], "PATCH", "/emprestimo/devolver/3"],
    ["renovarEmprestimo", [3, 7], "PATCH", "/emprestimo/renovar/3"],
    ["deleteEmprestimo", [3], "DELETE", "/emprestimo/delete/3"],
    ["statusLembretes", [], "GET", "/emprestimo/lembretes"],
    ["enviarLembretes", [], "POST", "/emprestimo/lembretes/enviar"],
    ["desfazerDevolucao", [3], "PATCH", "/emprestimo/desfazer-devolucao/3"],
    ["definirPrazo", [3, 21], "PUT", "/emprestimo/update/3"],
  ])("%s chama %s %s", async (fn, args, method, path) => {
    await emprestimoService[fn](...args);
    const [url, opts] = fetch.mock.calls[0];
    expect(url.endsWith(path)).toBe(true);
    expect(opts.method).toBe(method);
  });

  it("renovar e definirPrazo enviam os dias no corpo", async () => {
    await emprestimoService.renovarEmprestimo(3, 7);
    await emprestimoService.definirPrazo(3, 21);
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({ dias: 7 });
    expect(JSON.parse(fetch.mock.calls[1][1].body)).toEqual({ diasLocacao: 21 });
  });
});

describe("relatórios", () => {
  const d = (s) => new Date(s);
  const loans = [
    { obra: { id: 1, titulo: "B" }, leitor: { id: 1, nome: "Ana" }, dataInicio: d("2026-01-10"), dataPrevista: d("2026-01-24"), devolvido: true, dataDevolucao: d("2026-01-30") },
    { obra: { id: 1, titulo: "B" }, leitor: { id: 2, nome: "Bia" }, dataInicio: d("2026-02-10"), dataPrevista: d("2026-02-24"), devolvido: true, dataDevolucao: d("2026-02-20") },
    { obra: { id: 2, titulo: "A" }, leitor: { id: 1, nome: "Ana" }, dataInicio: d("2026-02-15"), dataPrevista: d("2026-03-01"), devolvido: false, atrasado: true },
    { obra: { id: 3, titulo: "C" }, leitor: { id: 3, nome: "Caio" }, dataInicio: d("2025-12-01"), dataPrevista: d("2025-12-15"), devolvido: false },
  ];

  it("filtra por ano e mês", () => {
    expect(filterByPeriod(loans, { ano: 2026, mes: null })).toHaveLength(3);
    expect(filterByPeriod(loans, { ano: 2026, mes: 1 })).toHaveLength(2);
    expect(filterByPeriod(loans, { ano: null, mes: null })).toHaveLength(4);
  });

  it("ranqueia obras e leitores por quantidade, desempatando pelo nome", () => {
    expect(topObras(loans).map((r) => [r.label, r.count])).toEqual([["B", 2], ["A", 1], ["C", 1]]);
    expect(topLeitores(loans)[0]).toMatchObject({ label: "Ana", count: 2 });
  });

  it("conta atrasos em aberto e devoluções fora do prazo", () => {
    expect(loans.map(devolveuAtrasado)).toEqual([true, false, true, false]);
    expect(topAtrasos(loans)).toEqual([expect.objectContaining({ label: "Ana", count: 2 })]);
  });

  it("agrupa por mês do ano", () => {
    const meses = porMes(loans, 2026);
    expect(meses).toHaveLength(12);
    expect(meses.slice(0, 3).map((m) => m.count)).toEqual([1, 2, 0]);
    expect(meses[0].label).toBe("jan");
  });

  it("agrupa obras pela classe principal da CDD", () => {
    expect(porClasseCdd([{ cdd: "869.3" }, { cdd: "823" }, { cdd: null }, { cdd: "100" }])).toEqual([
      { label: "100", count: 1 },
      { label: "800", count: 2 },
      { label: "Sem CDD", count: 1 },
    ]);
    expect(CLASSES_CDD["800"]).toBe("Literatura");
  });

  it("relatório de atrasos lista em aberto primeiro, por dias de atraso", () => {
    const linhas = relatorioAtrasos(loans, loans, d("2026-03-11"));
    expect(linhas.map((l) => [l.leitor.nome, l.emAberto, l.diasAtraso])).toEqual([
      ["Ana", true, 10],
      ["Ana", false, 6],
    ]);
  });
});

describe("palette", () => {
  it("o mesmo texto sempre recebe o mesmo tom", () => {
    expect(tomPara("Dom Casmurro")).toEqual(tomPara("Dom Casmurro"));
    expect(tomPara()).toHaveProperty("bg");
  });
});
