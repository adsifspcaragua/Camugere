import { PrismaClient } from "@prisma/client"
import z from "zod"
import { id } from "zod/v4/locales"

const prisma = new PrismaClient()

const emprestimoSchema = z.object({
  dataInicio: z
    .date({
      invalid_type_error:
        "A data de início do empréstimo deve ser uma data válida!",
    })
    .default(() => new Date())
    .optional(),

  diasLocacao: z
    .number({
      required_error: "A quantidade de dias para locação é obrigatória!",
      invalid_type_error:
        "A quantidade de dias para locação deve ser um número!",
    })
    .positive("A quantidade de dias para locação deve ser um número positivo!"),
})

export const emprestimoValidator = (emprestimo, partial = null) => {
  if (partial) {
    return emprestimoSchema.partial(partial).safeParse(emprestimo)
  }

  return emprestimoSchema.safeParse(emprestimo)
}

const emprestimoSelect = {
  id: true,
  dataInicio: true,
  diasLocacao: true,
  id_leitor: true,
  id_exemplar: true,
  statusDevolucao: true,
  dataDevolucao: true,
  leitor: {
    select: {
      id: true,
      id_usuario: true,
      telefone: true,
      usuario: {
        select: {
          id: true,
          nome: true,
          email: true,
        },
      },
    },
  },
  exemplar: {
    select: {
      id: true,
      id_obra: true,
      numeroInventario: true,
      disponivel: true,
      obra: {
        select: {
          id: true,
          titulo: true,
          capa: true,
          capaUrl: true,
        },
      },
    },
  },
}

export async function createEmprestimo(emprestimo) {
  const { diasLocacao, id_leitor, id_exemplar, dataInicio } = emprestimo

  const result = await prisma.Emprestimo.create({
    data: {
      diasLocacao,
      id_leitor,
      id_exemplar,
      dataInicio: dataInicio ? new Date(dataInicio) : new Date(),
    },
    select: emprestimoSelect,
  })

  return result
}

export async function listEmprestimo() {
  const result = await prisma.Emprestimo.findMany({
    select: emprestimoSelect,
    orderBy: {
      dataInicio: "desc",
    },
  })

  return result
}

export async function listEmprestimosAtivos() {
  const result = await prisma.Emprestimo.findMany({
    where: {
      statusDevolucao: false,
    },
    select: emprestimoSelect,
    orderBy: {
      dataInicio: "desc",
    },
  })

  return result
}

export async function listEmprestimosAtrasados() {
  const dataAtual = new Date()

  const emprestimos = await prisma.Emprestimo.findMany({
    select: emprestimoSelect,
  })

  const result = emprestimos.filter((e) => {
    const dataDevolicao = new Date(e.dataInicio)
    dataDevolicao.setDate(dataDevolicao.getDate() + e.diasLocacao)
    return dataDevolicao.getTime() < dataAtual.getTime()
  })
  return result
}

export async function getEmprestimoById(id) {
  const result = await prisma.Emprestimo.findUnique({
    where: {
      id: id,
    },
    select: {
      id: true,
      dataInicio: true,
      diasLocacao: true,
      id_leitor: true,
      id_exemplar: true,
      statusDevolucao: true,
      dataDevolucao: true,
    },
  })

  return result
}

export async function getEmprestimoByIdExemplar(id) {
  const result = await prisma.Emprestimo.findFirst({
    where: {
      id_exemplar: id,
    },
    select: {
      id: true,
      dataInicio: true,
      diasLocacao: true,
      id_leitor: true,
      id_exemplar: true,
      statusDevolucao: true,
      dataDevolucao: true,
    },
  })

  return result
}

export async function deleteEmprestimo(id) {
  const result = await prisma.Emprestimo.delete({
    where: {
      id: id,
    },
    select: {
      id: true,
      dataInicio: true,
      diasLocacao: true,
      id_leitor: true,
      id_exemplar: true,
      statusDevolucao: true,
      dataDevolucao: true,
    },
  })

  return result
}

export async function updateEmprestimo(id, emprestimo) {
  const result = await prisma.Emprestimo.update({
    where: {
      id: id,
    },
    data: emprestimo,
    select: {
      id: true,
      dataInicio: true,
      diasLocacao: true,
      id_leitor: true,
      id_exemplar: true,
      statusDevolucao: true,
      dataDevolucao: true,
    },
  })

  return result
}

export async function changeStatusDevolucaoEmprestimo(id, status) {
  const result = await prisma.Emprestimo.update({
    where: {
      id: id,
    },
    data: {
      ...status,
      dataDevolucao: new Date(),
    },
    select: {
      id: true,
      dataInicio: true,
      diasLocacao: true,
      id_leitor: true,
      id_exemplar: true,
      statusDevolucao: true,
      dataDevolucao: true,
    },
  })

  return result
}

export async function listEmprestimosByLeitor(id_leitor) {
  return prisma.Emprestimo.findMany({
    where: { id_leitor },
    select: emprestimoSelect,
    orderBy: { dataInicio: "desc" },
  })
}

export async function listEmprestimosAtivosByLeitor(id_leitor) {
  return prisma.Emprestimo.findMany({
    where: { id_leitor, statusDevolucao: false },
    select: emprestimoSelect,
    orderBy: { dataInicio: "desc" },
  })
}
