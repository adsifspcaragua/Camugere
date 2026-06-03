import { PrismaClient } from "@prisma/client";
import z from "zod";

const prisma = new PrismaClient()

const obraSchema = new z.object({
    titulo: z.string({
        invalid_type_error: "O titulo deve ser um valor tipo texto",
        required_error: "O titulo deve ser obrigatorio"
    }),

    subtitulo: new z.string({
        invalid_type_error: "O subtitulo deve ser um valor tipo texto"
    }).optional(),

    editora: new z.string({
        invalid_type_error: "A editora deve ser um valor tipo texto"
    }).optional(),

    numeroPaginas: new z.number({
        invalid_type_error: "O número de páginas deve ser um valor numérico",
        required_error: "O número de páginas deve ser obrigatorio"
    }),

    ativo: z.boolean().default(true)
})

export const obraValidator = (obra, partial = null) => {
    if (partial) {
        return obraSchema.partial(partial).safeParse(obra)
    }

    return obraSchema.safeParse(obra)
}

export async function createObra(obra) {
    const result = await prisma.Obra.create({
        data: obra,
        select: {
            id: true,
            id_cdd: true,
            titulo: true,
            subtitulo: true,
            editora: true,
            numeroPaginas: true,
            capa: true,
            ativo: true,
            notaMedia: true
        }
    })

    return result
}

export async function listObra() {
    const result = await prisma.Obra.findMany({
        select: {
            id: true,
            id_cdd: true,
            titulo: true,
            subtitulo: true,
            editora: true,
            numeroPaginas: true,
            capa: true,
            ativo: true,
            notaMedia: true
        }
    })

    return result
}

export async function getObraById(id) {
    const result = await prisma.Obra.findUnique({
        where: {
            id: id
        },
        select: {
            id: true,
            id_cdd: true,
            titulo: true,
            subtitulo: true,
            editora: true,
            numeroPaginas: true,
            capa: true,
            ativo: true,
            notaMedia: true
        }
    })

    return result

}

export async function deleteObra(id) {
    const result = await prisma.Obra.delete({
        where: {
            id: id
        },
        select: {
            id: true,
            id_cdd: true,
            titulo: true,
            subtitulo: true,
            editora: true,
            numeroPaginas: true,
            capa: true,
            ativo: true,
            notaMedia: true
        }
    })

    return result
}

export async function updateObra(id, obra) {
    const result = await prisma.Obra.update({
        where: {
            id: id
        },
        data: obra,
        select: {
            id: true,
            id_cdd: true,
            titulo: true,
            subtitulo: true,
            editora: true,
            numeroPaginas: true,
            capa: true,
            ativo: true,
            notaMedia: true
        }
    })

    return result
}
