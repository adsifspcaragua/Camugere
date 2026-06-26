import { PrismaClient } from "@prisma/client";
import z from "zod";
import { id } from "zod/v4/locales";

const prisma = new PrismaClient();

const emprestimoSchema = z.object({
    dataInicio: z.date({
        invalid_type_error: "A data de início do empréstimo deve ser uma data válida!"
    })
        .default(() => new Date())
        .optional(),

    diasLocacao: z.number({
        required_error: "A quantidade de dias para locação é obrigatória!",
        invalid_type_error: "A quantidade de dias para locação deve ser um número!"
    })
        .positive("A quantidade de dias para locação deve ser um número positivo!")
})

export const emprestimoValidator = (emprestimo, partial = null) => {
    if (partial) {
        return emprestimoSchema.partial(partial).safeParse(emprestimo)
    }

    return emprestimoSchema.safeParse(emprestimo)
}

export async function createEmprestimo(emprestimo) {
    const { diasLocacao, id_leitor, id_exemplar, dataInicio } = emprestimo

    const result = await prisma.Emprestimo.create({
        data: {
            diasLocacao,
            id_leitor,
            id_exemplar,
            dataInicio: dataInicio ? new Date(dataInicio) : new Date()
        },
        select: {
            id: true,
            dataInicio: true,
            diasLocacao: true,
            id_leitor: true,
            id_exemplar: true
        }
    })

    return result
}

export async function listEmprestimo() {
    const result = await prisma.Emprestimo.findMany({
        select: {
            id: true,
            dataInicio: true,
            diasLocacao: true,
            id_leitor: true,
            id_exemplar: true
        }
    })

    return result
}

export async function listEmprestimosAtrasados() {
    const dataAtual = new Date()

    const emprestimos = await prisma.Emprestimo.findMany({
        select: {
            id: true,
            dataInicio: true,
            diasLocacao: true,
            id_leitor: true,
            id_exemplar: true
        }
    })

    const result = emprestimos.filter(e => {
        const dataDevolicao = new Date(e.dataInicio)
        dataDevolicao.setDate(dataDevolicao.getDate() + e.diasLocacao)
        return dataDevolicao.getTime() < dataAtual.getTime()
    })

    return result
}

export async function getEmprestimoById(id) {
    const result = await prisma.Emprestimo.findUnique({
        where: {
            id: id
        }, select: {
            id: true,
            dataInicio: true,
            diasLocacao: true,
            id_leitor: true,
            id_exemplar: true
        }
    })

    return result
}

export async function deleteEmprestimo(id) {
    const result = await prisma.Emprestimo.delete({
        where: {
            id: id
        }, select: {
            id: true,
            dataInicio: true,
            diasLocacao: true,
            id_leitor: true,
            id_exemplar: true
        }
    })

    return result
}

export async function updateEmprestimo(id, emprestimo) {
    const result = await prisma.Emprestimo.delete({
        where: {
            id: id
        },
        data: emprestimo,
        select: {
            id: true,
            dataInicio: true,
            diasLocacao: true,
            id_leitor: true,
            id_exemplar: true
        }
    })

    return result
}