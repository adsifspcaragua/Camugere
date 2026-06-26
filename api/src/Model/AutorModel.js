import { PrismaClient } from "@prisma/client"
import z from "zod";

const prisma = new PrismaClient()

const autorSchema = z.object({
    nome: z.string({
        required_error: "O nome é obrigatório",
        invalid_type_error: "O nome deve ser uma string"
    }),
    
    sobrenome: z.string({
        required_error: "O nome é obrigatório",
        invalid_type_error: "O nome deve ser uma string"
    })
})

export const autorValidator = (autor, partial = null) => {
    if (partial) {
        return autorSchema.partial(partial).safeParse(autor)
    }

    return autorSchema.safeParse(autor)
}

export async function createAutor(autor) {
    const result = await prisma.Autor.create({
        data: autor,
        select: {
            id: true,
            nome: true,
            sobrenome: true
        }
    })
    
    return result
}

export async function listAutor() {
    const result = await prisma.Autor.findMany({
        select: {
            id: true,
            nome: true,
            sobrenome: true
        }
    })

    return result
}

export async function getAutorById(id) {
    const result = await prisma.Autor.findUnique({
        where: {
            id: id
        },
        select: {
            id: true,
            nome: true,
            sobrenome: true
        }
    })
    
    return result
}

export async function deleteAutor(id) {
    const result = await prisma.Autor.delete({
        where: {
            id: id
        }, select: {
            id: true,
            nome: true,
            sobrenome: true
        }
    })

    return result
}

export async function updateAutor(id, autor) {
    const result = await prisma.Autor.update({
        where: {
            id: id
        },
        data: autor,
        select: {
            id: true,
            nome: true,
            sobrenome: true
        }
    })

    return result
}