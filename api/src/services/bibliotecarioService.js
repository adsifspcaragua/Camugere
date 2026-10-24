import { prisma } from "../lib/prisma.js";
import { conflict, notFound } from "../lib/httpError.js";
import { usuarioPublico } from "./selects.js";
import { hashSenha } from "./usuarioService.js";

const select = { id: true, id_usuario: true, usuario: { select: usuarioPublico } };

export const listar = () => prisma.bibliotecario.findMany({ select, orderBy: { usuario: { nome: "asc" } } });

export async function buscarPorId(id) {
  const bibliotecario = await prisma.bibliotecario.findUnique({ where: { id }, select });
  if (!bibliotecario) throw notFound("Bibliotecário não encontrado.");
  return bibliotecario;
}

/** Promove um usuário existente a bibliotecário. */
export async function criar({ id_usuario }) {
  const usuario = await prisma.usuario.findUnique({ where: { id: id_usuario }, select: { id: true } });
  if (!usuario) throw notFound("Usuário não encontrado.");

  const existente = await prisma.bibliotecario.findFirst({ where: { id_usuario } });
  if (existente) throw conflict("Este usuário já é bibliotecário.");

  return prisma.bibliotecario.create({ data: { id_usuario }, select });
}

/** Cria login + perfil de bibliotecário de uma vez (fluxo usado pela tela de Equipe). */
export async function cadastrar({ nome, email, senha }) {
  return prisma.bibliotecario.create({
    data: { usuario: { create: { nome, email, hash: await hashSenha(senha) } } },
    select,
  });
}

export async function remover(id, { id_bibliotecario: solicitante } = {}) {
  if (id === solicitante) throw conflict("Você não pode remover o seu próprio acesso.");
  const bibliotecario = await buscarPorId(id);
  if ((await prisma.bibliotecario.count()) <= 1) throw conflict("É preciso manter ao menos um bibliotecário.");

  // Remove o usuário inteiro se ele não for também leitor; senão, só o perfil de bibliotecário.
  const ehLeitor = await prisma.leitor.count({ where: { id_usuario: bibliotecario.id_usuario } });
  if (ehLeitor) await prisma.bibliotecario.delete({ where: { id } });
  else await prisma.usuario.delete({ where: { id: bibliotecario.id_usuario } });
  return bibliotecario;
}
