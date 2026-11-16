/**
 * Configurações › Backup. Só o `fetch` é simulado; página, contextos e services rodam como em produção.
 */
import { fireEvent, render, screen, within } from "@testing-library/react";
import { vi } from "vitest";
import App from "../App.jsx";
import { TOKEN_KEY } from "../lib/api.js";
import { descreverAgenda } from "../features/BackupPanel.jsx";
import { validateConfigBackup } from "../lib/validators.js";

let rotas;
let chamadas;
const json = (status, body) => Promise.resolve({ ok: status < 300, status, json: () => Promise.resolve(body) });

function backend(url, opts = {}) {
  const path = url.replace(/^https?:\/\/[^/]+/, "");
  const method = opts.method ?? "GET";
  const body = typeof opts.body === "string" ? JSON.parse(opts.body) : undefined;
  chamadas.push({ method, path, body });
  const rota = rotas[`${method} ${path}`];
  if (rota) return rota(body);
  if (method === "GET" && /\/list$/.test(path)) return json(200, { data: [] });
  return json(404, { message: "não simulada" });
}

const usuario = { id: 1, nome: "Maria Souza", email: "maria@bib.org" };
const BASE = {
  automatico: false,
  dias: [5],
  horario: "17:00",
  pastaCopia: null,
  origemPasta: null,
  pastaCopiaAcessivel: null,
  manter: 10,
  proximo: null,
  pastaBackups: "C:\\Camugere\\backups",
  guardados: [],
  totalGuardados: 0,
  emAndamento: false,
  ultimo: null,
};

beforeEach(() => {
  chamadas = [];
  localStorage.clear();
  localStorage.setItem(TOKEN_KEY, "tk");
  window.history.replaceState(null, "", "/");
  window.scrollTo = vi.fn();
  window.matchMedia ??= () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
  rotas = {
    "GET /primeiro-acesso": () => json(200, { data: { necessario: false } }),
    "GET /me": () => json(200, { data: { usuario } }),
    "GET /emprestimo/lembretes": () => json(200, { data: { diasAntes: 2, automatico: true, emailConfigurado: true, pendentes: 0 } }),
    "GET /configuracao/email": () => json(200, { data: { configurado: true, origem: "tela", host: "smtp.gmail.com", usuario: "b@gmail.com" } }),
    "GET /configuracao/backup": () => json(200, { data: BASE }),
  };
  globalThis.fetch = vi.fn(backend);
});

async function abrirBackup() {
  render(<App />);
  const nav = await screen.findByRole("navigation", { name: "Principal" });
  fireEvent.click(within(nav).getByRole("button", { name: /Configurações/ }));
  await screen.findByRole("heading", { name: "Backup" });
  return screen.getByRole("heading", { name: "Backup" }).closest("section, div[class*='rounded']") ?? document.body;
}

it("sem nenhum backup: avisa, sugere a cópia extra e faz o primeiro agora", async () => {
  rotas["POST /configuracao/backup/executar"] = () =>
    json(200, {
      message: "Backup concluído.",
      data: { ...BASE, totalGuardados: 1, guardados: [{ nome: "camugere-2026-11-15_21h41", bytes: 83000 }], ultimo: { em: "2026-11-15T21:41:00", ok: true, mensagem: null } },
    });
  await abrirBackup();
  expect(screen.getByText("Nenhum backup ainda")).toBeInTheDocument();
  expect(screen.getByText(/Sem cópia extra/)).toBeInTheDocument();
  expect(screen.getByText("Automático desligado")).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: /Fazer backup agora/ }));
  expect(await screen.findByText("Último backup ok")).toBeInTheDocument();
  expect(await screen.findByText("Backup concluído.")).toBeInTheDocument();
  expect(screen.getByText(/1 guardado\(s\) neste computador, até 10/)).toBeInTheDocument();
  expect(screen.getByText("15/11/2026 21:41")).toBeInTheDocument();
  expect(screen.getByText("82 KB")).toBeInTheDocument();
});

it("liga o automático escolhendo dias, horário e a pasta do pen drive", async () => {
  rotas["PUT /configuracao/backup"] = (body) => json(200, { data: { ...BASE, ...body, origemPasta: "tela" } });
  await abrirBackup();
  fireEvent.click(screen.getByRole("button", { name: "Configurar" }));
  const drawer = await screen.findByRole("dialog");

  fireEvent.click(within(drawer).getByRole("switch", { name: "Backup automático" }));
  fireEvent.click(within(drawer).getByRole("button", { name: "sexta" })); // desmarca o padrão
  fireEvent.click(within(drawer).getByRole("button", { name: "Salvar" }));
  expect(await within(drawer).findByText("Escolha pelo menos um dia da semana.")).toBeInTheDocument();

  fireEvent.click(within(drawer).getByRole("button", { name: "segunda" }));
  fireEvent.click(within(drawer).getByRole("button", { name: "quinta" }));
  fireEvent.change(within(drawer).getByLabelText("Horário"), { target: { value: "18:30" } });
  fireEvent.change(within(drawer).getByLabelText(/Copiar também para/), { target: { value: "backup" } });
  fireEvent.click(within(drawer).getByRole("button", { name: "Salvar" }));
  expect(await within(drawer).findByText(/caminho completo da pasta/)).toBeInTheDocument();

  fireEvent.change(within(drawer).getByLabelText(/Copiar também para/), { target: { value: "E:\\Backup Camugere" } });
  fireEvent.change(within(drawer).getByLabelText(/Quantos backups/), { target: { value: "15" } });
  fireEvent.click(within(drawer).getByRole("button", { name: "Salvar" }));

  expect(await screen.findByText("Backup automático: segunda e quinta às 18:30.")).toBeInTheDocument();
  expect(chamadas.find((c) => c.method === "PUT").body).toEqual({ automatico: true, dias: [1, 4], horario: "18:30", pastaCopia: "E:\\Backup Camugere", manter: 15 });
});

it("mostra a falha do último backup e a pasta extra ausente", async () => {
  rotas["GET /configuracao/backup"] = () =>
    json(200, {
      data: {
        ...BASE,
        automatico: true,
        dias: [1, 5],
        proximo: "2026-11-16T17:00:00",
        pastaCopia: "E:\\Backup",
        origemPasta: "tela",
        pastaCopiaAcessivel: false,
        ultimo: { em: "2026-11-13T17:00:00", ok: false, mensagem: "mysqldump não encontrado.", sucessoEm: "2026-11-09T17:00:00" },
      },
    });
  rotas["POST /configuracao/backup/executar"] = () => json(400, { message: "O backup não foi feito: Access denied" });
  await abrirBackup();
  expect(screen.getByText("Último backup falhou")).toBeInTheDocument();
  expect(screen.getByText("mysqldump não encontrado.")).toBeInTheDocument();
  expect(screen.getByText(/Último backup bem-sucedido/)).toBeInTheDocument();
  expect(screen.getByText(/pasta não encontrada agora/)).toBeInTheDocument();
  expect(screen.getByText(/segunda e sexta às 17:00. Próximo:/)).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: /Fazer backup agora/ }));
  expect(await screen.findByText("O backup não foi feito: Access denied")).toBeInTheDocument();
});

it("backup feito sem a cópia extra vira aviso", async () => {
  rotas["POST /configuracao/backup/executar"] = () =>
    json(200, { message: "Backup feito, mas sem a cópia extra. Não deu para copiar para E:\\ (ENOENT).", data: { ...BASE, ultimo: { em: "2026-11-15T21:00:00", ok: true, mensagem: "Não deu para copiar para E:\\ (ENOENT)." } } });
  await abrirBackup();
  fireEvent.click(screen.getByRole("button", { name: /Fazer backup agora/ }));
  expect(await screen.findByText(/^Backup feito, mas sem a cópia extra/)).toBeInTheDocument();
  expect(screen.getByText("Feito, sem a cópia extra")).toBeInTheDocument();
});

describe("regras", () => {
  it("descreverAgenda", () => {
    expect(descreverAgenda([5], "17:00")).toBe("sexta às 17:00");
    expect(descreverAgenda([1, 3, 5], "08:00")).toBe("segunda, quarta e sexta às 08:00");
    expect(descreverAgenda([0, 1, 2, 3, 4, 5, 6], "12:00")).toBe("todos os dias às 12:00");
  });

  it("validateConfigBackup", () => {
    const ok = { automatico: true, dias: [5], horario: "17:00", pastaCopia: "", manter: "10" };
    expect(validateConfigBackup(ok)).toEqual({});
    expect(validateConfigBackup({ ...ok, pastaCopia: "\\\\servidor\\backup" })).toEqual({});
    expect(validateConfigBackup({ ...ok, automatico: false, dias: [] })).toEqual({});
    expect(Object.keys(validateConfigBackup({ automatico: true, dias: [], horario: "7h", pastaCopia: "pasta", manter: "0" })).sort()).toEqual(["dias", "horario", "manter", "pastaCopia"]);
  });
});
