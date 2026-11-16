import nodemailer from "nodemailer";
import { aoMudar, obterSmtp } from "./configEmailService.js";
import { dataPrevistaDevolucao, formatarDataBR } from "../utils/dates.js";

let transporter = null;
aoMudar(() => (transporter = null));

// Caixa de teste do Ethereal: só quando pedida explicitamente (desenvolvimento).
const modoTeste = () => process.env.EMAIL_TESTE === "true";

/** Há como enviar e-mail? Sem servidor configurado (nem modo de teste), os envios são recusados com aviso. */
export const emailConfigurado = async () => Boolean(await obterSmtp()) || modoTeste();
export const EMAIL_NAO_CONFIGURADO = "O envio de e-mail não está configurado. Configure em Configurações › E-mail da biblioteca.";

const criarConexao = (smtp) =>
  nodemailer.createTransport({ host: smtp.host, port: smtp.porta, secure: smtp.seguro, auth: { user: smtp.usuario, pass: smtp.senha }, connectionTimeout: 15_000 });

async function criarTransporter() {
  const smtp = await obterSmtp();
  if (smtp) return { conexao: criarConexao(smtp), remetente: smtp.remetente };

  // EMAIL_TESTE=true: caixa de teste do Ethereal (apenas desenvolvimento).
  const conta = await nodemailer.createTestAccount();
  return {
    conexao: nodemailer.createTransport({ host: "smtp.ethereal.email", port: 587, auth: { user: conta.user, pass: conta.pass } }),
    remetente: '"Biblioteca Camugerê" <no-reply@camugere.org>',
  };
}

async function getTransporter() {
  transporter ??= await criarTransporter();
  return transporter;
}

async function despachar(mensagem) {
  const { conexao, remetente } = await getTransporter();
  const info = await conexao.sendMail({ from: remetente, ...mensagem });
  const previewUrl = nodemailer.getTestMessageUrl(info) || null;
  if (previewUrl) console.info(`[e-mail] Prévia: ${previewUrl}`);
  return previewUrl;
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
  if (!(await emailConfigurado())) return { enviado: false, motivo: EMAIL_NAO_CONFIGURADO };

  const dados = { ...dadosDoEmprestimo(emprestimo), titulo, intro };
  const { html, texto } = montarConteudo(dados);

  const previewUrl = await despachar({ to: usuario.email, subject: assunto(dados), text: texto, html });

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

/** E-mail com o link de redefinição de senha. Lança erro se o e-mail não estiver configurado. */
export async function enviarRedefinicaoSenha({ nome, email, link, validadeMin }) {
  if (!(await emailConfigurado())) throw new Error(EMAIL_NAO_CONFIGURADO);
  const html = `
  <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;color:#1f1d1a;border:1px solid #e4dfd4">
    <div style="background:#1f3a2e;color:#f6f2ea;padding:24px 28px">
      <div style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;opacity:.8">Biblioteca Camugerê</div>
      <div style="font-size:22px;margin-top:4px">Redefinição de senha</div>
    </div>
    <div style="padding:28px;font-family:Arial,sans-serif;font-size:15px;line-height:1.55">
      <p style="margin-top:0">Olá, <strong>${escapeHtml(nome)}</strong>.</p>
      <p>Recebemos um pedido para redefinir a sua senha de acesso ao sistema da biblioteca.</p>
      <p style="text-align:center;margin:28px 0"><a href="${escapeHtml(link)}" style="background:#1f3a2e;color:#f6f2ea;padding:12px 22px;border-radius:6px;text-decoration:none;font-weight:600">Criar nova senha</a></p>
      <p style="color:#6b6358;font-size:13px">O link vale por ${validadeMin} minutos e só pode ser usado uma vez. Se você não pediu a troca, ignore este e-mail: sua senha continua a mesma.</p>
    </div>
  </div>`;
  const text = `Olá, ${nome}.

Para criar uma nova senha de acesso ao sistema da biblioteca, abra o link abaixo (válido por ${validadeMin} minutos):
${link}

Se você não pediu a troca, ignore este e-mail.`;
  await despachar({ to: email, subject: "Biblioteca Camugerê — redefinição de senha", text, html });
}

/**
 * Testa a configuração informada (ou a atual) enviando um e-mail para `para`.
 * Devolve uma mensagem em linguagem simples quando o servidor recusa.
 */
export async function enviarTeste(para) {
  const smtp = await obterSmtp();
  if (!smtp) throw new Error(EMAIL_NAO_CONFIGURADO);
  const conexao = criarConexao(smtp);
  try {
    await conexao.verify();
    await conexao.sendMail({
      from: smtp.remetente,
      to: para,
      subject: "Biblioteca Camugerê — e-mail de teste",
      text: "Este é um e-mail de teste do sistema da biblioteca. Se você recebeu, o envio de comprovantes, lembretes e links de senha está funcionando.",
    });
  } catch (error) {
    throw new Error(explicarFalhaSmtp(error));
  } finally {
    conexao.close?.();
  }
  return { enviadoPara: para };
}

export function explicarFalhaSmtp(error) {
  const codigo = error?.code;
  if (codigo === "EAUTH" || error?.responseCode === 535) return "O servidor recusou o e-mail ou a senha. No Gmail e no Outlook, use uma senha de app, não a senha normal da conta.";
  if (["ENOTFOUND", "EDNS"].includes(codigo)) return "Servidor de e-mail não encontrado. Confira o endereço do servidor e a internet.";
  if (["ETIMEDOUT", "ECONNECTION", "ECONNREFUSED", "ESOCKET"].includes(codigo)) return "Não foi possível conectar ao servidor de e-mail. Confira o servidor, a porta e a internet.";
  return `O servidor de e-mail recusou o envio: ${error?.message ?? "erro desconhecido"}`;
}
