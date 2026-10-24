import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";
import { env } from "../config/env.js";
import { notFound, unauthorized, forbidden } from "../lib/httpError.js";
import { usuarioPublico } from "./selects.js";

const SALT_ROUNDS = 10;
export const hashSenha = (senha) => bcrypt.hash(senha, SALT_ROUNDS);

export const listar = () => prisma.usuario.findMany({ select: usuarioPublico, orderBy: { nome: "asc" } });

export async function buscarPorId(id) {
  const usuario = await prisma.usuario.findUnique({ where: { id }, select: usuarioPublico });
  if (!usuario) throw notFound("Usuário não encontrado.");
  return usuario;
}

export async function criar({ nome, email, senha }) {
  return prisma.usuario.create({
    data: { nome, email, hash: await hashSenha(senha) },
    select: usuarioPublico,
  });
}

export async function atualizar(id, { senha, ...dados }) {
  return prisma.usuario.update({
    where: { id },
    data: { ...dados, ...(senha && { hash: await hashSenha(senha) }) },
    select: usuarioPublico,
  });
}

export const remover = (id) => prisma.usuario.delete({ where: { id }, select: usuarioPublico });

// Mesma mensagem para e-mail inexistente e senha errada: não revela quais e-mails existem.
const CREDENCIAIS_INVALIDAS = "E-mail ou senha incorretos.";

export async function autenticar({ email, senha }) {
  const usuario = await prisma.usuario.findUnique({
    where: { email },
    include: { bibliotecarios: { select: { id: true }, take: 1 } },
  });
  if (!usuario || !(await bcrypt.compare(senha, usuario.hash))) throw unauthorized(CREDENCIAIS_INVALIDAS);

  const bibliotecario = usuario.bibliotecarios[0];
  if (!bibliotecario) throw forbidden("Este usuário não possui perfil de bibliotecário.");

  const token = jwt.sign({ id: usuario.id, id_bibliotecario: bibliotecario.id }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });

  return { token, usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email }, bibliotecario };
}

export function validarToken(token) {
  try {
    return jwt.verify(token, env.jwtSecret);
  } catch {
    throw unauthorized("Token inválido ou expirado.");
  }
}

export async function perfil({ id, id_bibliotecario }) {
  const usuario = await buscarPorId(id);
  return { usuario, bibliotecario: { id: id_bibliotecario, id_usuario: id } };
}
