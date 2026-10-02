import { PrismaClient } from "@prisma/client"
import z from "zod"
import bcrypt from "bcrypt"
import { randomUUID } from "node:crypto"

const prisma = new PrismaClient()

const leitorSchema = new z.object({
  nome: z.string().min(4).max(20).optional(),
  contato: z.string().email().max(40).optional(),
  id_usuario: z.number().int().positive().optional(),
  cpf: z
    .string({
      invalid_type_error: "O CPF deve ser um valor tipo número",
      required_error: "O CPF deve ser obrigatorio",
    })
    .length(11, "O CPF deve ter 11 caracteres"),

  telefone: z
    .string({
      invalid_type_error: "O CPF deve ser um valor tipo número",
      required_error: "O CPF deve ser obrigatorio",
    })
    .max(11, "O telefone deve ter no máximo 11 caracteres")
    .min(10, "o telefone deve ter no mínimo 10 caracteres")
    .optional(),
})

export const leitorValidator = (leitor, partial = null) => {
  if (partial) {
    return leitorSchema.partial().safeParse(leitor)
  }

  return leitorSchema.safeParse(leitor)
}

export function validarCPF(cpf) {
  if (/^(\d)\1{10}$/.test(cpf)) return false

  const calcDigito = (cpf, tamanho) => {
    const soma = Array.from(
      { length: tamanho },
      (_, i) => parseInt(cpf[i]) * (tamanho + 1 - i),
    ).reduce((acc, val) => acc + val, 0)
    const resto = soma % 11
    return resto < 2 ? 0 : 11 - resto
  }

  const dig1Valido = calcDigito(cpf, 9) === parseInt(cpf[9])
  const dig2Valido = calcDigito(cpf, 10) === parseInt(cpf[10])

  return dig1Valido && dig2Valido
}

export async function createLeitor(leitor) {
  const { nome, contato, id_usuario, ...dadosLeitor } = leitor
  const data = id_usuario
    ? { ...dadosLeitor, id_usuario }
    : {
        ...dadosLeitor,
        usuario: {
          create: {
            nome,
            email: contato,
            hash: await bcrypt.hash(randomUUID(), 10),
          },
        },
      }

  const result = await prisma.Leitor.create({
    data,
    select: {
      id: true,
      id_usuario: true,
      cpf: true,
      telefone: true,
      usuario: {
        select: {
          nome: true,
          email: true,
        },
      },
    },
  })

  return result
}

export async function listLeitor() {
  const result = await prisma.Leitor.findMany({
    select: {
      id: true,
      id_usuario: true,
      cpf: true,
      telefone: true,
      usuario: {
        select: {
          nome: true,
          email: true,
        },
      },
    },
  })

  return result
}

export async function getLeitorById(id) {
  const result = await prisma.Leitor.findUnique({
    where: {
      id: id,
    },
    select: {
      id: true,
      id_usuario: true,
      cpf: true,
      telefone: true,
    },
  })

  return result
}

export async function deleteLeitor(id) {
  const result = await prisma.Leitor.delete({
    where: {
      id: id,
    },
    select: {
      id: true,
      id_usuario: true,
      cpf: false,
      telefone: true,
    },
  })

  return result
}

export async function updateLeitor(leitor, id) {
  const { idLeitor, nome, contato, ...dadosLeitor } = leitor

  return prisma.$transaction(async (transaction) => {
    const atualizacao = await transaction.Leitor.update({
      where: { id },
      data: dadosLeitor,
    })

    if (nome || contato) {
      await transaction.Usuario.update({
        where: { id: atualizacao.id_usuario },
        data: {
          ...(nome ? { nome } : {}),
          ...(contato ? { email: contato } : {}),
        },
      })
    }

    return transaction.Leitor.findUnique({
      where: { id },
      select: {
        id: true,
        id_usuario: true,
        cpf: true,
        telefone: true,
        usuario: {
          select: {
            nome: true,
            email: true,
          },
        },
      },
    })
  })
}
