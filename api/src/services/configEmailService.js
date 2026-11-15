// Configuração do servidor de e-mail (SMTP): feita pela tela de Configurações ou, como alternativa, pelo .env.
import { prisma } from "../lib/prisma.js";
import { cifrar, decifrar } from "../lib/cripto.js";
import { badRequest } from "../lib/httpError.js";

const NOME_PADRAO = "Biblioteca Camugerê";
let cache; // undefined = ainda não carregado
const ouvintes = new Set();

/** Avisado sempre que a configuração muda (o emailService descarta a conexão antiga). */
export const aoMudar = (fn) => ouvintes.add(fn);
function invalidar() {
  cache = undefined;
  ouvintes.forEach((fn) => fn());
}

const doEnv = () => {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE, SMTP_FROM } = process.env;
  if (!(SMTP_HOST && SMTP_USER && SMTP_PASS)) return null;
  const porta = Number(SMTP_PORT || 587);
  return { origem: "env", host: SMTP_HOST, porta, seguro: SMTP_SECURE === "true" || porta === 465, usuario: SMTP_USER, senha: SMTP_PASS, remetente: SMTP_FROM || SMTP_USER };
};

const remetente = (nome, usuario) => `"${(nome || NOME_PADRAO).replace(/"/g, "")}" <${usuario}>`;

/**
 * Servidor de e-mail em uso: o da tela tem prioridade; senão, o do .env; senão, null.
 * Fica em memória até a configuração mudar.
 */
export async function obterSmtp() {
  if (cache !== undefined) return cache;
  const salvo = await prisma.configuracaoEmail.findUnique({ where: { id: 1 } });
  if (salvo) {
    const senha = decifrar(salvo.senhaCifrada);
    // Senha cifrada com outro JWT_SECRET (ex.: .env trocado): trata como não configurado.
    cache = senha === null ? null : { origem: "tela", host: salvo.host, porta: salvo.porta, seguro: salvo.seguro, usuario: salvo.usuario, senha, remetente: remetente(salvo.nomeRemetente, salvo.usuario) };
  } else {
    cache = doEnv();
  }
  return cache;
}

/** O que a tela mostra. A senha nunca sai da API: só se ela está definida. */
export async function obterParaTela() {
  const salvo = await prisma.configuracaoEmail.findUnique({ where: { id: 1 } });
  if (salvo) {
    const senhaValida = decifrar(salvo.senhaCifrada) !== null;
    return {
      configurado: senhaValida,
      origem: "tela",
      host: salvo.host,
      porta: salvo.porta,
      seguro: salvo.seguro,
      usuario: salvo.usuario,
      nomeRemetente: salvo.nomeRemetente ?? NOME_PADRAO,
      senhaDefinida: senhaValida,
      atualizadoEm: salvo.atualizadoEm,
    };
  }
  const env = doEnv();
  if (env) return { configurado: true, origem: "env", host: env.host, porta: env.porta, seguro: env.seguro, usuario: env.usuario, nomeRemetente: NOME_PADRAO, senhaDefinida: true };
  return { configurado: false, origem: null, nomeRemetente: NOME_PADRAO, senhaDefinida: false };
}

/** Só para os testes: força recarregar a configuração. */
export const invalidarParaTeste = invalidar;

export async function salvar({ host, porta, seguro, usuario, senha, nomeRemetente }) {
  const atual = await prisma.configuracaoEmail.findUnique({ where: { id: 1 } });
  // Senha em branco ao editar = manter a atual.
  if (!senha && !(atual && decifrar(atual.senhaCifrada) !== null)) {
    throw badRequest("Informe a senha do e-mail.", ["senha: informe a senha do e-mail"]);
  }
  const dados = {
    host,
    porta,
    seguro: seguro ?? porta === 465,
    usuario,
    nomeRemetente: nomeRemetente || null,
    ...(senha && { senhaCifrada: cifrar(senha) }),
  };
  // Editar sem trocar a senha só funciona como update: o create exigiria a senha cifrada.
  if (atual) await prisma.configuracaoEmail.update({ where: { id: 1 }, data: dados });
  else await prisma.configuracaoEmail.create({ data: { id: 1, ...dados } });
  invalidar();
  return obterParaTela();
}

export async function remover() {
  await prisma.configuracaoEmail.deleteMany({});
  invalidar();
  return obterParaTela();
}
