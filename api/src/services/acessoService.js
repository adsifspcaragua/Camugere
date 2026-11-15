// Primeiro acesso, troca e recuperação de senha dos bibliotecários.
import crypto from "node:crypto";
import bcrypt from "bcrypt";
import { prisma } from "../lib/prisma.js";
import { env } from "../config/env.js";
import { badRequest, conflict, notFound, unauthorized } from "../lib/httpError.js";
import { emitirToken, hashSenha } from "./usuarioService.js";
import { emailConfigurado, enviarRedefinicaoSenha } from "./emailService.js";

export const VALIDADE_LINK_MIN = 30;
const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

// ---------- Primeiro acesso ----------

/** O sistema ainda não tem nenhum bibliotecário? Então a tela de primeiro acesso é exibida. */
export async function precisaPrimeiroAcesso() {
  return (await prisma.bibliotecario.count()) === 0;
}

/**
 * Cria a primeira conta de bibliotecário. Só funciona com o sistema vazio: depois disso,
 * novas contas são criadas por quem já tem acesso (Configurações › Equipe).
 */
export async function configurarPrimeiroAcesso({ nome, email, senha }) {
  const hash = await hashSenha(senha);
  const { usuario, bibliotecario } = await prisma.$transaction(
    async (tx) => {
      if ((await tx.bibliotecario.count()) > 0) throw conflict("O primeiro acesso já foi configurado. Entre com seu e-mail e senha.");
      if (await tx.usuario.findUnique({ where: { email }, select: { id: true } })) throw conflict("Este e-mail já está cadastrado.");
      const usuario = await tx.usuario.create({ data: { nome, email, hash } });
      const bibliotecario = await tx.bibliotecario.create({ data: { id_usuario: usuario.id } });
      return { usuario, bibliotecario };
    },
    { isolationLevel: "Serializable" },
  );
  return {
    token: emitirToken(usuario, bibliotecario),
    usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email },
  };
}

// ---------- Troca de senha ----------

async function gravarSenha(tx, id_usuario, novaSenha) {
  return tx.usuario.update({
    where: { id: id_usuario },
    data: { hash: await hashSenha(novaSenha), versaoToken: { increment: 1 } },
  });
}

/** O próprio bibliotecário troca a senha. As outras sessões dele são encerradas; esta recebe um token novo. */
export async function alterarPropriaSenha({ id, id_bibliotecario }, { senhaAtual, novaSenha }) {
  const usuario = await prisma.usuario.findUnique({ where: { id } });
  if (!usuario) throw unauthorized("Sessão inválida. Entre novamente.");
  if (!(await bcrypt.compare(senhaAtual, usuario.hash))) throw badRequest("A senha atual está incorreta.", ["senhaAtual: a senha atual está incorreta"]);
  if (senhaAtual === novaSenha) throw badRequest("A nova senha precisa ser diferente da atual.", ["novaSenha: a nova senha precisa ser diferente da atual"]);
  const atualizado = await gravarSenha(prisma, id, novaSenha);
  return { token: emitirToken(atualizado, { id: id_bibliotecario }) };
}

/** Um colega da equipe define uma nova senha para outro bibliotecário (ex.: esqueceu e o e-mail não está configurado). */
export async function redefinirSenhaDeColega(id_bibliotecario, { novaSenha }, { id_bibliotecario: solicitante } = {}) {
  if (id_bibliotecario === solicitante) throw badRequest("Para trocar a sua própria senha, use \"Alterar minha senha\".");
  const bibliotecario = await prisma.bibliotecario.findUnique({ where: { id: id_bibliotecario }, select: { id_usuario: true } });
  if (!bibliotecario) throw notFound("Bibliotecário não encontrado.");
  await gravarSenha(prisma, bibliotecario.id_usuario, novaSenha);
  return { id: id_bibliotecario };
}

// ---------- Esqueci minha senha ----------

/**
 * Envia o link de redefinição. A resposta é a mesma exista ou não a conta, para não revelar
 * quais e-mails têm acesso. Sem e-mail configurado, avisa para pedir ajuda a um colega.
 */
export async function solicitarRedefinicao({ email }) {
  if (!emailConfigurado()) return { emailConfigurado: false };

  const usuario = await prisma.usuario.findUnique({
    where: { email },
    select: { id: true, nome: true, email: true, bibliotecarios: { select: { id: true }, take: 1 } },
  });
  if (!usuario?.bibliotecarios.length) return { emailConfigurado: true };

  const token = crypto.randomBytes(32).toString("base64url");
  await prisma.$transaction([
    // Só o link mais recente vale.
    prisma.redefinicaoSenha.deleteMany({ where: { id_usuario: usuario.id, usadoEm: null } }),
    prisma.redefinicaoSenha.create({
      data: { id_usuario: usuario.id, tokenHash: hashToken(token), expiraEm: new Date(Date.now() + VALIDADE_LINK_MIN * 60_000) },
    }),
  ]);

  try {
    await enviarRedefinicaoSenha({ nome: usuario.nome, email: usuario.email, link: `${env.appUrl}/?redefinir=${token}`, validadeMin: VALIDADE_LINK_MIN });
  } catch (error) {
    console.error("[senha] falha ao enviar o link de redefinição:", error.message);
  }
  return { emailConfigurado: true };
}

const LINK_INVALIDO = "Este link de redefinição é inválido ou expirou. Peça um novo em \"Esqueci minha senha\".";

/** Confere o link sem usá-lo (a tela mostra o formulário só se ele ainda vale). */
export async function validarLink(token) {
  const pedido = await buscarPedidoValido(token);
  return { valido: Boolean(pedido) };
}

async function buscarPedidoValido(token) {
  if (typeof token !== "string" || token.length < 20) return null;
  const pedido = await prisma.redefinicaoSenha.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!pedido || pedido.usadoEm || pedido.expiraEm < new Date()) return null;
  return pedido;
}

export async function redefinirComLink({ token, novaSenha }) {
  const pedido = await buscarPedidoValido(token);
  if (!pedido) throw badRequest(LINK_INVALIDO);
  await prisma.$transaction(async (tx) => {
    // Marca como usado só se ninguém usou antes (dois cliques simultâneos não trocam a senha duas vezes).
    const { count } = await tx.redefinicaoSenha.updateMany({ where: { id: pedido.id, usadoEm: null }, data: { usadoEm: new Date() } });
    if (!count) throw badRequest(LINK_INVALIDO);
    await gravarSenha(tx, pedido.id_usuario, novaSenha);
  });
  return { redefinida: true };
}
