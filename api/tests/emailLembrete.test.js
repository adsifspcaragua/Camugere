import { jest } from "@jest/globals";

const sendMail = jest.fn();
const nodemailerMock = {
  createTransport: jest.fn(() => ({ sendMail })),
  createTestAccount: jest.fn(),
  getTestMessageUrl: jest.fn(() => false),
};
const prismaMock = { emprestimo: { findMany: jest.fn(), update: jest.fn() } };
jest.unstable_mockModule("nodemailer", () => ({ default: nodemailerMock }));
jest.unstable_mockModule("../src/lib/prisma.js", () => ({ prisma: prismaMock }));

process.env.SMTP_HOST = "smtp.teste.local";
process.env.SMTP_USER = "user";
process.env.SMTP_PASS = "pass";
process.env.SMTP_PORT = "465";

const email = await import("../src/services/emailService.js");
const lembretes = await import("../src/services/lembreteService.js");

const emprestimo = (extra = {}) => ({
  id: 1,
  dataInicio: new Date("2026-05-01T15:00:00Z"),
  diasLocacao: 14,
  statusDevolucao: false,
  lembreteEnviadoEm: null,
  leitor: { usuario: { nome: "Ana <b>", email: "ana@x.com" } },
  exemplar: { numeroInventario: "INV-1", obra: { titulo: 'O "Livro" & cia' } },
  ...extra,
});

beforeEach(() => {
  jest.clearAllMocks();
  sendMail.mockResolvedValue({ messageId: "1" });
});

describe("emailService", () => {
  it("usa o SMTP configurado (porta 465 = conexão segura)", async () => {
    await email.enviarEmailEmprestimo(emprestimo());
    expect(nodemailerMock.createTransport).toHaveBeenCalledWith(
      expect.objectContaining({ host: "smtp.teste.local", port: 465, secure: true, auth: { user: "user", pass: "pass" } }),
    );
    expect(nodemailerMock.createTestAccount).not.toHaveBeenCalled();
  });

  it("monta o comprovante com data prevista e escapa HTML", async () => {
    const r = await email.enviarEmailEmprestimo(emprestimo());
    const msg = sendMail.mock.calls[0][0];
    expect(msg.to).toBe("ana@x.com");
    expect(msg.subject).toBe('Empréstimo confirmado: "O "Livro" & cia" — devolver até 15/05/2026');
    expect(msg.html).toContain("Ana &lt;b&gt;");
    expect(msg.html).toContain("O &quot;Livro&quot; &amp; cia");
    expect(msg.html).not.toContain("<b>");
    expect(msg.text).toContain("Devolver até: 15/05/2026");
    expect(r).toMatchObject({ enviado: true, emailDestino: "ana@x.com", dataDevolucaoPrevista: "15/05/2026", previewUrl: null });
  });

  it("sem SMTP nem modo de teste, não envia e explica o motivo", async () => {
    const host = process.env.SMTP_HOST;
    delete process.env.SMTP_HOST;
    try {
      expect(email.emailConfigurado()).toBe(false);
      await expect(email.enviarEmailEmprestimo(emprestimo())).resolves.toEqual({ enviado: false, motivo: email.EMAIL_NAO_CONFIGURADO });
      await expect(email.enviarRedefinicaoSenha({ nome: "A", email: "a@x.com", link: "http://x", validadeMin: 30 })).rejects.toThrow(/não está configurado/);
      expect(lembretes.agendarLembretes()).toBeNull();
      process.env.EMAIL_TESTE = "true";
      expect(email.emailConfigurado()).toBe(true);
    } finally {
      process.env.SMTP_HOST = host;
      delete process.env.EMAIL_TESTE;
    }
    expect(sendMail).not.toHaveBeenCalled();
  });

  it("e-mail de redefinição traz o link e escapa o nome", async () => {
    await email.enviarRedefinicaoSenha({ nome: "Ana <i>", email: "ana@x.com", link: "http://localhost:3000/?redefinir=abc", validadeMin: 30 });
    const msg = sendMail.mock.calls[0][0];
    expect(msg.to).toBe("ana@x.com");
    expect(msg.html).toContain("http://localhost:3000/?redefinir=abc");
    expect(msg.html).toContain("Ana &lt;i&gt;");
    expect(msg.text).toContain("30 minutos");
  });

  it("não envia para leitor sem e-mail", async () => {
    const r = await email.enviarLembreteDevolucao(emprestimo({ leitor: { usuario: { nome: "Ana", email: null } } }));
    expect(r).toEqual({ enviado: false, motivo: "Leitor sem e-mail cadastrado." });
    expect(sendMail).not.toHaveBeenCalled();
  });

  it("usa valores padrão quando o exemplar não traz obra", async () => {
    await email.enviarLembreteDevolucao(emprestimo({ exemplar: null }));
    const msg = sendMail.mock.calls[0][0];
    expect(msg.subject).toMatch(/^Lembrete: devolva "Obra do acervo"/);
    expect(msg.text).toContain("Exemplar: —");
  });
});

describe("lembreteService", () => {
  it("envia lembretes pendentes e marca a data de envio", async () => {
    const vence = new Date();
    vence.setDate(vence.getDate() - 13); // vence amanhã com 14 dias
    prismaMock.emprestimo.findMany.mockResolvedValue([emprestimo({ id: 1, dataInicio: vence })]);
    const r = await lembretes.enviarLembretes(2);
    expect(r).toMatchObject({ diasAntes: 2, verificados: 1, enviados: 1, falhas: [] });
    expect(prismaMock.emprestimo.update).toHaveBeenCalledWith({ where: { id: 1 }, data: { lembreteEnviadoEm: expect.any(Date) } });
  });

  it("registra falha sem marcar como enviado", async () => {
    const vence = new Date();
    vence.setDate(vence.getDate() - 13);
    prismaMock.emprestimo.findMany.mockResolvedValue([
      emprestimo({ id: 2, dataInicio: vence, leitor: { usuario: { nome: "X", email: null } } }),
      emprestimo({ id: 3, dataInicio: vence }),
    ]);
    sendMail.mockRejectedValueOnce(new Error("SMTP fora"));
    const r = await lembretes.enviarLembretes(2);
    expect(r.enviados).toBe(0);
    expect(r.falhas).toEqual([
      { id: 2, erro: "Leitor sem e-mail cadastrado." },
      { id: 3, erro: "SMTP fora" },
    ]);
    expect(prismaMock.emprestimo.update).not.toHaveBeenCalled();
  });

  it("não agenda nada com LEMBRETES_AUTOMATICOS=false", () => {
    process.env.LEMBRETES_AUTOMATICOS = "false";
    expect(lembretes.agendarLembretes()).toBeNull();
    delete process.env.LEMBRETES_AUTOMATICOS;
  });

  it("agenda verificação inicial e de hora em hora", () => {
    jest.useFakeTimers();
    const timeout = jest.spyOn(global, "setTimeout");
    const interval = jest.spyOn(global, "setInterval");
    const id = lembretes.agendarLembretes();
    expect(timeout).toHaveBeenCalledWith(expect.any(Function), 10_000);
    expect(interval).toHaveBeenCalledWith(expect.any(Function), 3_600_000);
    clearInterval(id);
    jest.clearAllTimers();
    jest.useRealTimers();
  });
});
