import { jest } from "@jest/globals";

jest.unstable_mockModule("../src/lib/prisma.js", () => ({ prisma: {} }));
const { isAtiva, situacao } = await import("../src/services/suspensaoService.js");
const { filtrarPendentes } = await import("../src/services/lembreteService.js");

const agora = new Date("2026-05-10T12:00:00Z");

describe("suspensões", () => {
  it("classifica ativa, cumprida e encerrada", () => {
    expect(isAtiva({ dataFim: null, dataEncerramento: null }, agora)).toBe(true);
    expect(situacao({ dataFim: "2026-05-20T00:00:00Z", dataEncerramento: null }, agora)).toBe("ativa");
    expect(situacao({ dataFim: "2026-05-01T00:00:00Z", dataEncerramento: null }, agora)).toBe("cumprida");
    expect(situacao({ dataFim: null, dataEncerramento: "2026-05-09T00:00:00Z" }, agora)).toBe("encerrada");
  });
});

describe("lembretes", () => {
  const emp = (id, inicio, dias, extra = {}) => ({ id, dataInicio: new Date(inicio), diasLocacao: dias, statusDevolucao: false, lembreteEnviadoEm: null, ...extra });

  it("seleciona só quem vence dentro da janela e ainda não foi avisado", () => {
    const lista = [
      emp(1, "2026-04-28T12:00:00Z", 14), // vence 12/05 -> dentro de 2 dias
      emp(2, "2026-04-20T12:00:00Z", 14), // venceu 04/05 -> atrasado, fora
      emp(3, "2026-05-09T12:00:00Z", 14), // vence 23/05 -> longe
      emp(4, "2026-04-28T12:00:00Z", 14, { lembreteEnviadoEm: new Date() }),
      emp(5, "2026-04-28T12:00:00Z", 14, { statusDevolucao: true }),
    ];
    expect(filtrarPendentes(lista, 2, agora).map((e) => e.id)).toEqual([1]);
  });
});
