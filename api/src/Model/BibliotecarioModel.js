import { PrismaClient } from "@prisma/client"
import bcrypt from "bcrypt"
import z from "zod"

const prisma = new PrismaClient()

const registroBibliotecarioSchema = z.object({
  nome: z.string().trim().min(2).max(20),
  email: z.string().trim().email().max(40),
  senha: z.string().min(6).optional(),
  hash: z.string().min(6).optional(),
  confirmacao: z.string().min(6).optional(),
})

export const registroBibliotecarioValidator = (dados) => {
  const validation = registroBibliotecarioSchema.safeParse(dados)
  if (!validation.success) return validation

  const senha = validation.data.senha || validation.data.hash
  if (!senha) {
    return { success: false, error: { message: "A senha é obrigatória" } }
  }
  if (
    validation.data.confirmacao !== undefined &&
    validation.data.confirmacao !== senha
  ) {
    return {
      success: false,
      error: { message: "A confirmação de senha não confere" },
    }
  }

  return { success: true, data: { ...validation.data, senha } }
}

export async function registrarBibliotecario(dados) {
  const senhaHash = await bcrypt.hash(dados.senha, 10)

  try {
    return await prisma.$transaction(async (transaction) => {
      const usuarioExistente = await transaction.Usuario.findUnique({
        where: { email: dados.email },
        select: { id: true },
      })

      if (usuarioExistente) {
        const roleExistente = await transaction.Bibliotecario.findFirst({
          where: { id_usuario: usuarioExistente.id },
          select: { id: true },
        })
        const error = new Error(
          roleExistente
            ? "Este usuário já possui perfil de bibliotecário"
            : "Este e-mail já está cadastrado",
        )
        error.code = roleExistente ? "DUPLICATE_LIBRARIAN" : "DUPLICATE_EMAIL"
        throw error
      }

      const usuario = await transaction.Usuario.create({
        data: { nome: dados.nome, email: dados.email, hash: senhaHash },
        select: { id: true, nome: true, email: true },
      })
      const bibliotecario = await transaction.Bibliotecario.create({
        data: { id_usuario: usuario.id },
        select: { id: true, id_usuario: true },
      })

      return { usuario, bibliotecario }
    })
  } catch (error) {
    if (error.code === "P2002") {
      error.code = "DUPLICATE_EMAIL"
    }
    throw error
  }
}

export async function createBibliotecario(id_usuario) {
  const result = await prisma.Bibliotecario.create({
    data: id_usuario,
    select: {
      id: true,
      id_usuario: true,
    },
  })

  return result
}

export async function listBibliotecario() {
  const result = await prisma.Bibliotecario.findMany({
    select: {
      id: true,
      id_usuario: true,
    },
  })

  return result
}

export async function getBibliotecarioById(id) {
  const result = await prisma.Bibliotecario.findUnique({
    where: {
      id: id,
    },
    select: {
      id: true,
      id_usuario: true,
    },
  })

  return result
}

export async function deleteBibliotecario(id) {
  const result = await prisma.Bibliotecario.delete({
    where: {
      id: id,
    },
    select: {
      id: true,
      id_usuario: true,
    },
  })

  return result
}
