import { PrismaClient } from "@prisma/client"
import z from "zod"

const prisma = new PrismaClient()

const exemplarSchema = new z.object({
    numeroInventario: z.string({
        invalid_type_error: "O número de inventário deve ser um valor tipo string",
        required_error: "O número de inventário deve ser obrigatorio"
    }),

    disponivel: z.boolean().default(true)
})

export const exemplarValidator = (exemplar, partial = null) => {
    if (partial) {
        return exemplarSchema.partial(partial).safeParse(exemplar)
    }

    return exemplarSchema.safeParse(exemplar)
}

export async function createExemplar(exemplar) {
    const result = await prisma.Exemplar.create({
        data: exemplar,
        select: {
            id: true,
            id_obra: true,
            numeroInventario: true,
            disponivel: true
        }
    })

    return result
}

export async function listExemplar() {
    const result = await prisma.Exemplar.findMany({
        select: {
            id: true,
            id_obra: true,
            numeroInventario: true,
            disponivel: true
        }
    })

    return result
}

export async function getExemplarById(id) {
    const result = await prisma.Exemplar.findUnique({
        where: {
            id: id
        }, select: {
            id: true,
            id_obra: true,
            numeroInventario: true,
            disponivel: true
        }
    })

    return result
}

export async function deleteExemplar(id) {
    const result = await prisma.Exemplar.delete({
        where: {
            id: id
        }, select: {
            id: true,
            id_obra: true,
            numeroInventario: true,
            disponivel: true
        }
    })

    return result
}

export async function updateExemplar(id, exemplar) {
    const result = await prisma.Exemplar.update({
        where: {
            id: id
        }, 
        data: exemplar,
        select: {
            id: true,
            id_obra: true,
            numeroInventario: true,
            disponivel: true
        }
    })

    return result
}