import { loanStatus, normalizeLoan, summarize } from "../lib/loans.js";
import { topObras, porClasseCdd } from "../lib/reports.js";

const today = new Date("2026-03-20T12:00:00");
const raw = (id, inicio, dias, devolvido = false) => ({
  id,
  dataInicio: inicio,
  diasLocacao: dias,
  statusDevolucao: devolvido,
  dataDevolucao: devolvido ? "2026-03-10T12:00:00" : null,
  id_leitor: 1,
  id_exemplar: id,
  leitor: { usuario: { nome: "Joana", email: "j@x.com" } },
  exemplar: { numeroInventario: `0001-0${id}`, obra: { id: 1, titulo: "Torto Arado" } },
});

describe("empréstimos", () => {
  it("calcula prazo e atraso", () => {
    const atrasado = normalizeLoan(raw(1, "2026-03-01T12:00:00", 14), today);
    expect(atrasado.atrasado).toBe(true);
    expect(loanStatus(atrasado)).toEqual({ tone: "danger", label: "5d de atraso" });

    const emDia = normalizeLoan(raw(2, "2026-03-19T12:00:00", 14), today);
    expect(emDia.atrasado).toBe(false);
    expect(loanStatus(emDia).tone).toBe("ok");
  });

  it("resume acervo e circulação", () => {
    const loans = [normalizeLoan(raw(1, "2026-03-01T12:00:00", 14), today), normalizeLoan(raw(2, "2026-03-01T12:00:00", 5, true), today)];
    const obras = [{ exemplares: [{ disponivel: false }, { disponivel: true }] }];
    expect(summarize(obras, loans)).toMatchObject({ obras: 1, exemplares: 2, disponiveis: 1, ativos: 1, atrasados: 1 });
    expect(topObras(loans)[0]).toMatchObject({ label: "Torto Arado", count: 2 });
  });

  it("agrupa CDD pela centena", () => {
    expect(porClasseCdd([{ cdd: "869.3" }, { cdd: "813" }, { cdd: null }])).toEqual([
      { label: "800", count: 2 },
      { label: "Sem CDD", count: 1 },
    ]);
  });
});

import { relatorioAtrasos } from "../lib/reports.js";
import { formatCep, formatEndereco } from "../lib/format.js";

describe("relatório de atrasos", () => {
  it("lista abertos primeiro e calcula dias de atraso", () => {
    const aberto = normalizeLoan(raw(1, "2026-03-01T12:00:00", 14), today);
    const devolvido = { ...normalizeLoan(raw(2, "2026-02-01T12:00:00", 5, true), today) };
    const linhas = relatorioAtrasos([aberto, devolvido], [aberto, devolvido], today);
    expect(linhas.map((l) => [l.id, l.emAberto])).toEqual([[1, true], [2, false]]);
    expect(linhas[0].diasAtraso).toBe(5);
  });
});

describe("endereço", () => {
  it("formata CEP e monta endereço em uma linha", () => {
    expect(formatCep("20040002")).toBe("20040-002");
    expect(formatEndereco({ logradouro: "Rua A", numero: "10", bairro: "Centro", cidade: "Rio", uf: "RJ", cep: "20040002" })).toBe("Rua A, 10 · Centro, Rio/RJ · CEP 20040-002");
  });
});
