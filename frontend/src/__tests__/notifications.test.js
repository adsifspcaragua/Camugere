import { buildNotifications } from "../lib/notifications.js";
import { normalizeLoan } from "../lib/loans.js";

const hoje = new Date("2026-03-20T12:00:00");
const emp = (id, inicio, dias) =>
  normalizeLoan(
    { id, dataInicio: inicio, diasLocacao: dias, statusDevolucao: false, id_leitor: 1, id_exemplar: id, leitor: { usuario: { nome: "Joana", email: "j@x.com" } }, exemplar: { obra: { id: 1, titulo: "Torto Arado" } } },
    hoje,
  );

it("lista atrasos primeiro, depois vencimentos e suspensões terminando", () => {
  const loans = [emp(1, "2026-03-07T12:00:00", 14), emp(2, "2026-03-01T12:00:00", 14), emp(3, "2026-03-10T12:00:00", 30)];
  const leitores = [{ id: 9, nome: "Carlos", suspensao: { id: 5, dataFim: "2026-03-22T12:00:00" } }];
  const itens = buildNotifications(loans, leitores, hoje);
  expect(itens.map((n) => n.tone)).toEqual(["danger", "warn", "info"]);
  expect(itens[1].titulo).toContain("vence amanhã");
});
