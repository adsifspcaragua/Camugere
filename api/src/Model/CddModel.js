import { PrismaClient } from "@prisma/client";
import z from "zod";

const prisma = new PrismaClient()

const cddSchema = new z.object({
    descricao: z.string({
        invalid_type_error: "A descrição deve ser um valor tipo texto",
        required_error: "A descrição deve ser obrigatoria"
    })
})

export const cddValidator = (cdd, partial = null) => {
    if (partial) {
        return cddSchema.partial(partial).safeParse(cdd)
    }

    return cddSchema.safeParse(cdd)
}

export async function createCdd(cdd) {
    const result = await prisma.Cdd.create({
        data: cdd,
        select: {
            id: true,
            descricao: true
        }
    })

    return result
}

export async function listCdd() {
    const result = await prisma.Cdd.findMany({
        select: {
            id: true,
            descricao: true
        }
    })

    return result
}

export async function getCddById(id) {
    const result = await prisma.Cdd.findUnique({
        where: {
            id: id
        },
        select: {
            id: true,
            descricao: true
        }
    })

    return result
}

export async function deleteCdd(id) {
    const result = await prisma.Cdd.delete({
        where: {
            id: id
        },
        select: {
            id: true,
            descricao: true
        }
    })

    return result
}  

export async function updateCdd(id, cdd) {
    const result = await prisma.Cdd.update({
        where: {
            id: id
        },
        data: cdd,
        select: {
            id: true,
            descricao: true
        }
    })

    return result
}
