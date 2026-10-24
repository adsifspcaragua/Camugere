import nodemailer from "nodemailer";
import { dataPrevistaDevolucao, formatarDataBR } from "../utils/dates.js";

let transporter = null;

async function criarTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE } = process.env;

  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    const port = Number(SMTP_PORT || 587);
    return nodemailer.createTransport({
      host: SMTP_HOST,
      port,
      secure: SMTP_SECURE === "true" || port === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
  }

  // Sem SMTP configurado, usa uma caixa de teste do Ethereal (apenas desenvolvimento).
  const conta = await nodemailer.createTestAccount();
  return nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    auth: { user: conta.user, pass: conta.pass },
  });
}

async function getTransporter() {
  transporter ??= await criarTransporter();
  return transporter;
}

const escapeHtml = (valor) =>
  String(valor).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

function montarConteudo({ titulo: cabecalho, intro, nomeLeitor, tituloObra, numeroExemplar, dataInicio, diasLocacao, dataPrevista }) {
  const [nome, titulo, exemplar] = [nomeLeitor, tituloObra, numeroExemplar].map(escapeHtml);

  const linha = (rotulo, valor) =>
    `<tr><td style="padding:6px 0;color:#6b6358">${rotulo}</td><td style="padding:6px 0;text-align:right;font-weight:600">${valor}</td></tr>`;

  const html = `
  <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;color:#1f1d1a;border:1px solid #e4dfd4">
    <div style="background:#1f3a2e;color:#f6f2ea;padding:24px 28px">
      <div style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;opacity:.8">Biblioteca Camugerê</div>
      <div style="font-size:22px;margin-top:4px">${escapeHtml(cabecalho)}</div>
    </div>
    <div style="padding:28px;font-family:Arial,sans-serif;font-size:15px;line-height:1.55">
      <p style="margin-top:0">Olá, <strong>${nome}</strong>.</p>
      <p>${escapeHtml(intro)}</p>
      <table style="width:100%;border-collapse:collapse;border-top:1px solid #e4dfd4;border-bottom:1px solid #e4dfd4;margin:16px 0">
        ${linha("Obra", titulo)}
        ${linha("Exemplar", exemplar)}
        ${linha("Retirada", dataInicio)}
        ${linha("Prazo", `${diasLocacao} dia(s)`)}
        ${linha("Devolver até", `<span style="color:#b4532a">${dataPrevista}</span>`)}
      </table>
      <p style="color:#6b6358;font-size:13px;margin-bottom:0">Boa leitura!</p>
    </div>
  </div>`;

  const texto = `Olá, ${nomeLeitor}.\n\n${intro}\n- Obra: ${tituloObra}\n- Exemplar: ${numeroExemplar}\n- Retirada: ${dataInicio}\n- Devolver até: ${dataPrevista}\n\nBoa leitura!`;

  return { html, texto };
}

function dadosDoEmprestimo(emprestimo) {
  return {
    nomeLeitor: emprestimo.leitor.usuario.nome,
    tituloObra: emprestimo.exemplar?.obra?.titulo ?? "Obra do acervo",
    numeroExemplar: emprestimo.exemplar?.numeroInventario ?? "—",
    dataInicio: formatarDataBR(emprestimo.dataInicio),
    diasLocacao: emprestimo.diasLocacao,
    dataPrevista: formatarDataBR(dataPrevistaDevolucao(emprestimo)),
  };
}

async function enviar(emprestimo, { titulo, intro, assunto }) {
  const usuario = emprestimo.leitor?.usuario;
  if (!usuario?.email) return { enviado: false, motivo: "Leitor sem e-mail cadastrado." };

  const dados = { ...dadosDoEmprestimo(emprestimo), titulo, intro };
  const { html, texto } = montarConteudo(dados);

  const info = await (await getTransporter()).sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER || '"Biblioteca Camugerê" <no-reply@camugere.org>',
    to: usuario.email,
    subject: assunto(dados),
    text: texto,
    html,
  });

  const previewUrl = nodemailer.getTestMessageUrl(info) || null;
  if (previewUrl) console.info(`[e-mail] Prévia: ${previewUrl}`);

  return { enviado: true, emailDestino: usuario.email, dataDevolucaoPrevista: dados.dataPrevista, previewUrl };
}

export const enviarEmailEmprestimo = (emprestimo) =>
  enviar(emprestimo, {
    titulo: "Comprovante de empréstimo",
    intro: "Seu empréstimo foi registrado. Confira os detalhes:",
    assunto: (d) => `Empréstimo confirmado: "${d.tituloObra}" — devolver até ${d.dataPrevista}`,
  });

export const enviarLembreteDevolucao = (emprestimo) =>
  enviar(emprestimo, {
    titulo: "Lembrete de devolução",
    intro: "O prazo do seu empréstimo está chegando ao fim. Se precisar de mais tempo, fale com a biblioteca para renovar.",
    assunto: (d) => `Lembrete: devolva "${d.tituloObra}" até ${d.dataPrevista}`,
  });
