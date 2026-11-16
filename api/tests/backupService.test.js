import { jest } from "@jest/globals";
import jwt from "jsonwebtoken";
import request from "supertest";

const PASTA = "D:\\Camugere\\backups";
let salvo = null;
const prismaMock = {
  bibliotecario: { findFirst: jest.fn().mockResolvedValue({ id: 1 }) },
  configuracaoBackup: {
    findUnique: jest.fn(async () => salvo),
    create: jest.fn(async ({ data }) => (salvo = { automatico: false, diasSemana: "5", horario: "17:00", manter: 10, ...data })),
    update: jest.fn(async ({ data }) => (salvo = { ...salvo, ...data })),
    upsert: jest.fn(async ({ update, create }) => (salvo = salvo ? { ...salvo, ...update } : { automatico: false, diasSemana: "5", horario: "17:00", manter: 10, ...create })),
  },
};
const cli = {
  PASTA_BACKUPS: PASTA,
  fazerBackup: jest.fn(),
  listarBackups: jest.fn(() => [
    { nome: "camugere-2026-11-14_17h00", bytes: 2048 },
    { nome: "camugere-2026-11-07_17h00", bytes: 1024 },
  ]),
};
jest.unstable_mockModule("../src/lib/prisma.js", () => ({ prisma: prismaMock }));
jest.unstable_mockModule("../src/cli/backup.js", () => cli);

const svc = await import("../src/services/backupService.js");
const { default: app } = await import("../src/app.js");
const auth = { Authorization: `Bearer ${jwt.sign({ id: 1, id_bibliotecario: 1, v: 0 }, "test-secret")}` };

// Sexta-feira, 13/11/2026, 18:30 (horário local)
const SEXTA_1830 = new Date(2026, 10, 13, 18, 30);
const agenda = (extra = {}) => ({ automatico: true, dias: [5], horario: "17:00", agendaDesde: new Date(2026, 10, 1), ...extra });

beforeEach(() => {
  jest.clearAllMocks();
  salvo = null;
  delete process.env.BACKUP_COPIA_PARA;
  delete process.env.BACKUP_MANTER;
  cli.fazerBackup.mockResolvedValue({ destino: `${PASTA}\\camugere-x`, copia: null, avisoCopia: null });
  jest.spyOn(console, "info").mockImplementation(() => {});
  jest.spyOn(console, "error").mockImplementation(() => {});
});

describe("agenda", () => {
  it("último horário agendado que já passou", () => {
    expect(svc.ultimoHorarioAgendado(agenda(), SEXTA_1830)).toEqual(new Date(2026, 10, 13, 17, 0));
    // Sexta 16h: o de hoje ainda não chegou, vale o da sexta anterior.
    expect(svc.ultimoHorarioAgendado(agenda(), new Date(2026, 10, 13, 16, 0))).toEqual(new Date(2026, 10, 6, 17, 0));
    expect(svc.ultimoHorarioAgendado(agenda({ dias: [] }), SEXTA_1830)).toBeNull();
  });

  it("horários de antes de salvar a agenda não contam", () => {
    expect(svc.ultimoHorarioAgendado(agenda({ agendaDesde: new Date(2026, 10, 13, 17, 30) }), SEXTA_1830)).toBeNull();
  });

  it("próximo horário", () => {
    expect(svc.proximoHorario(agenda({ dias: [1, 5] }), SEXTA_1830)).toEqual(new Date(2026, 10, 16, 17, 0));
    expect(svc.proximoHorario(agenda({ dias: [5] }), new Date(2026, 10, 13, 9, 0))).toEqual(new Date(2026, 10, 13, 17, 0));
    expect(svc.proximoHorario(agenda({ dias: [] }), SEXTA_1830)).toBeNull();
  });

  it.each([
    ["desligado", { automatico: false }, false],
    ["horário passou e não houve backup (computador desligado na hora)", {}, true],
    ["já feito depois do horário", { ultimoSucessoEm: new Date(2026, 10, 13, 17, 1) }, false],
    ["o último sucesso é da semana anterior", { ultimoSucessoEm: new Date(2026, 10, 6, 17, 1) }, true],
    ["falhou há 10 minutos: espera", { ultimoOk: false, ultimoEm: new Date(2026, 10, 13, 18, 20) }, false],
    ["falhou há 2 horas: tenta de novo", { ultimoOk: false, ultimoEm: new Date(2026, 10, 13, 16, 30) }, true],
  ])("deveExecutar: %s", (_nome, extra, esperado) => {
    expect(svc.deveExecutar(agenda(extra), SEXTA_1830)).toBe(esperado);
  });
});

describe("configuração", () => {
  it("sem nada salvo, usa a pasta e a quantidade do .env", async () => {
    process.env.BACKUP_COPIA_PARA = "E:\\Backup";
    process.env.BACKUP_MANTER = "4";
    await expect(svc.obterConfig()).resolves.toMatchObject({ automatico: false, pastaCopia: "E:\\Backup", origemPasta: "env", manter: 4 });
    const tela = await svc.obterParaTela();
    expect(tela).toMatchObject({ pastaBackups: PASTA, totalGuardados: 2, ultimo: null, emAndamento: false, proximo: null, pastaCopiaAcessivel: false });
  });

  it("salva; a agenda só reinicia quando muda", async () => {
    const dados = { automatico: true, dias: [5, 1, 5], horario: "18:00", pastaCopia: "", manter: 8 };
    const tela = await svc.salvar(dados);
    expect(salvo).toMatchObject({ diasSemana: "1,5", pastaCopia: null, manter: 8 });
    expect(salvo.agendaDesde).toBeInstanceOf(Date);
    expect(tela).toMatchObject({ automatico: true, dias: [1, 5], horario: "18:00" });
    expect(tela.proximo).toBeInstanceOf(Date);

    const antes = salvo.agendaDesde;
    await svc.salvar({ ...dados, manter: 12 });
    expect(prismaMock.configuracaoBackup.update.mock.calls[0][0].data).not.toHaveProperty("agendaDesde");
    expect(salvo.agendaDesde).toBe(antes);
    await svc.salvar({ ...dados, horario: "19:00" });
    expect(prismaMock.configuracaoBackup.update.mock.calls[1][0].data).toHaveProperty("agendaDesde");
  });

  it.each([
    ["backups", /caminho completo/],
    [`${PASTA}\\copia`, /fora da pasta de backups/],
  ])("recusa a pasta %p", async (pastaCopia, msg) => {
    await expect(svc.salvar({ automatico: false, dias: [], horario: "17:00", pastaCopia, manter: 10 })).rejects.toMatchObject({ status: 400, message: expect.stringMatching(msg) });
  });
});

describe("executarBackup", () => {
  it("usa a configuração da tela e registra o sucesso", async () => {
    salvo = { automatico: false, diasSemana: "5", horario: "17:00", pastaCopia: "E:\\Backup", manter: 3 };
    cli.fazerBackup.mockResolvedValue({ destino: `${PASTA}\\camugere-x`, copia: "E:\\Backup\\camugere-x", avisoCopia: null });
    await svc.executarBackup();
    expect(cli.fazerBackup).toHaveBeenCalledWith(expect.objectContaining({ pastaCopia: "E:\\Backup", manter: 3 }));
    expect(salvo).toMatchObject({ ultimoOk: true, ultimoDestino: `${PASTA}\\camugere-x`, ultimaMensagem: "Cópia extra em E:\\Backup\\camugere-x." });
    expect(salvo.ultimoSucessoEm).toBeInstanceOf(Date);
    const tela = await svc.obterParaTela();
    expect(tela.ultimo).toMatchObject({ ok: true });
  });

  it("falha: registra o motivo e devolve 400", async () => {
    cli.fazerBackup.mockRejectedValue(new Error("mysqldump não encontrado."));
    await expect(svc.executarBackup()).rejects.toMatchObject({ status: 400, message: "O backup não foi feito: mysqldump não encontrado." });
    expect(salvo).toMatchObject({ ultimoOk: false, ultimaMensagem: "mysqldump não encontrado.", ultimoDestino: null });
  });

  it("sem acesso ao banco para ler a configuração, segue com o .env", async () => {
    process.env.BACKUP_COPIA_PARA = "F:\\Pen";
    prismaMock.configuracaoBackup.findUnique.mockRejectedValueOnce(new Error("banco fora do ar"));
    await svc.executarBackup();
    expect(cli.fazerBackup).toHaveBeenCalledWith(expect.objectContaining({ pastaCopia: "F:\\Pen" }));
  });

  it("um de cada vez", async () => {
    let terminar;
    cli.fazerBackup.mockReturnValue(new Promise((r) => (terminar = r)));
    const primeiro = svc.executarBackup();
    await expect(svc.executarBackup()).rejects.toMatchObject({ status: 409 });
    expect((await svc.obterParaTela()).emAndamento).toBe(true);
    terminar({ destino: "x", copia: null, avisoCopia: null });
    await primeiro;
    expect((await svc.obterParaTela()).emAndamento).toBe(false);
  });
});

it("agendarBackup faz o backup quando o horário passou", async () => {
  jest.useFakeTimers({ now: SEXTA_1830, doNotFake: ["nextTick", "setImmediate"] });
  try {
    salvo = { automatico: true, diasSemana: "5", horario: "17:00", agendaDesde: new Date(2026, 10, 1), manter: 10 };
    const timer = svc.agendarBackup();
    await jest.advanceTimersByTimeAsync(15_000);
    expect(cli.fazerBackup).toHaveBeenCalledTimes(1);
    await jest.advanceTimersByTimeAsync(60_000);
    expect(cli.fazerBackup).toHaveBeenCalledTimes(1);
    clearInterval(timer);
  } finally {
    jest.useRealTimers();
  }
});

describe("rotas /configuracao/backup", () => {
  it("exigem login", async () => {
    expect((await request(app).get("/configuracao/backup")).status).toBe(401);
  });

  it("PUT valida", async () => {
    const base = { automatico: true, dias: [5], horario: "17:00", pastaCopia: "", manter: 10 };
    for (const errado of [{ dias: [] }, { horario: "25:00" }, { manter: 0 }, { dias: [7] }]) {
      expect((await request(app).put("/configuracao/backup").set(auth).send({ ...base, ...errado })).status).toBe(400);
    }
    const res = await request(app).put("/configuracao/backup").set(auth).send(base);
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ automatico: true, dias: [5] });
  });

  it("POST executar avisa quando a cópia extra falhou", async () => {
    cli.fazerBackup.mockResolvedValue({ destino: "x", copia: null, avisoCopia: "Não deu para copiar para E:\\ (ENOENT). O pen drive está conectado?" });
    const res = await request(app).post("/configuracao/backup/executar").set(auth);
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/^Backup feito, mas sem a cópia extra/);
    cli.fazerBackup.mockRejectedValue(new Error("Access denied"));
    const falha = await request(app).post("/configuracao/backup/executar").set(auth);
    expect(falha.status).toBe(400);
    expect(falha.body.message).toMatch(/Access denied/);
  });
});
