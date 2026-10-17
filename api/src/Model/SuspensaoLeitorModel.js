import { PrismaClient } from "@prisma/client"
import z from "zod"

const prisma = new PrismaClient()

const suspensaoSchema = z.object({
  motivo: z.string().min(1).max(255),
  dataInicio: z.coerce.date().optional(),
  dataFim: z.coerce.date().nullable().optional(),
})

export const suspensaoValidator = (suspensao) =>
  suspensaoSchema.safeParse(suspensao)

const suspensaoSelect = {
  id: true,
  id_leitor: true,
  id_bibliotecario: true,
  motivo: true,
  dataInicio: true,
  dataFim: true,
  dataReativacao: true,
  createdAt: true,
}

export async function listSuspensoesLeitor(id_leitor) {
  return prisma.SuspensaoLeitor.findMany({
    where: { id_leitor },
    select: suspensaoSelect,
    orderBy: { dataInicio: "desc" },
  })
}

export async function createSuspensaoLeitor(
  id_leitor,
  suspensao,
  id_bibliotecario,
) {
  return prisma.$transaction(async (transaction) => {
    const dataInicio = suspensao.dataInicio || new Date()
    const ativa = await transaction.SuspensaoLeitor.findFirst({
      where: {
        id_leitor,
        dataReativacao: null,
        OR: [{ dataFim: null }, { dataFim: { gt: new Date() } }],
      },
    })

    if (ativa) {
      const error = new Error("O leitor já possui uma suspensão ativa!")
      error.code = "ACTIVE_SUSPENSION"
      throw error
    }

    const result = await transaction.SuspensaoLeitor.create({
      data: {
        id_leitor,
        id_bibliotecario: id_bibliotecario || null,
        motivo: suspensao.motivo,
        dataInicio,
        dataFim: suspensao.dataFim || null,
      },
      select: suspensaoSelect,
    })

    await transaction.Leitor.update({
      where: { id: id_leitor },
      data: {
        podeEmprestar: false,
        suspensoAte: result.dataFim,
        motivoSuspensao: result.motivo,
      },
    })

    return result
  })
}

export async function reativarSuspensaoLeitor(
  id_leitor,
  id,
  dataReativacao = new Date(),
) {
  return prisma.$transaction(async (transaction) => {
    const suspensao = await transaction.SuspensaoLeitor.findFirst({
      where: { id, id_leitor },
      select: suspensaoSelect,
    })

    if (!suspensao) return null

    const result = await transaction.SuspensaoLeitor.update({
      where: { id },
      data: { dataReativacao },
      select: suspensaoSelect,
    })

    await transaction.Leitor.update({
      where: { id: id_leitor },
      data: { podeEmprestar: true, suspensoAte: null, motivoSuspensao: null },
    })

    return result
  })
}
