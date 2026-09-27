import { PrismaClient } from "@prisma/client";
import z from "zod";

const prisma = new PrismaClient();

const exemplarSchema = z.object({
    id_obra: z.coerce.number({
        invalid_type_error: "O id_obra deve ser um valor numérico",
        required_error: "O id_obra é obrigatório"
    }).int(),

    numeroInventario: z.string({
        invalid_type_error: "O número de inventário deve ser um valor tipo string",
        required_error: "O número de inventário deve ser obrigatorio"
    }),

    disponivel: z.boolean().default(true)
});

export const exemplarValidator = (exemplar, partial = null) => {
    if (partial) {
        return exemplarSchema.partial().safeParse(exemplar);
    }

    return exemplarSchema.safeParse(exemplar);
};

// Formata o retorno do banco adicionando idExemplar e idObra usados no React
function formatarExemplar(ex) {
    if (!ex) return null;
    return {
        ...ex,
        idExemplar: ex.id,
        idObra: ex.id_obra
    };
}

export async function createExemplar(exemplar) {
    const result = await prisma.exemplar.create({
        data: {
            id_obra: Number(exemplar.id_obra || exemplar.idObra),
            numeroInventario: String(exemplar.numeroInventario),
            disponivel: exemplar.disponivel ?? true
        },
        select: {
            id: true,
            id_obra: true,
            numeroInventario: true,
            disponivel: true
        }
    });

    return formatarExemplar(result);
}

export async function listExemplar() {
    const result = await prisma.exemplar.findMany({
        select: {
            id: true,
            id_obra: true,
            numeroInventario: true,
            disponivel: true
        }
    });

    return result.map(formatarExemplar);
}

export async function listExemplarIndisponivel() {
    const result = await prisma.exemplar.findMany({
        where: {
            disponivel: false
        },
        select: {
            id: true,
            id_obra: true,
            numeroInventario: true,
            disponivel: true
        }
    });

    return result.map(formatarExemplar);
}

export async function listExemplarDisponivel() {
    const result = await prisma.exemplar.findMany({
        where: {
            disponivel: true
        },
        select: {
            id: true,
            id_obra: true,
            numeroInventario: true,
            disponivel: true
        }
    });

    return result.map(formatarExemplar);
}

export async function getExemplarById(id) {
    const result = await prisma.exemplar.findUnique({
        where: {
            id: Number(id)
        },
        select: {
            id: true,
            id_obra: true,
            numeroInventario: true,
            disponivel: true
        }
    });

    return formatarExemplar(result);
}

export async function deleteExemplar(id) {
    const result = await prisma.exemplar.delete({
        where: {
            id: Number(id)
        },
        select: {
            id: true,
            id_obra: true,
            numeroInventario: true,
            disponivel: true
        }
    });

    return formatarExemplar(result);
}

export async function updateExemplar(id, exemplar) {
    const result = await prisma.exemplar.update({
        where: {
            id: Number(id)
        },
        data: exemplar,
        select: {
            id: true,
            id_obra: true,
            numeroInventario: true,
            disponivel: true
        }
    });

    return formatarExemplar(result);
}