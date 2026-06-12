import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function createObraAutor(obraAutor){
    const result = await prisma.ObraAutor.create({
        data: obraAutor,
        select: {
            id_autor: true,
            id_obra: true
        }
    })

    return result
}

export async function listObraAutor(){
    const result = await prisma.ObraAutor.findMany({
        select: {
            id_autor: true,
            id_obra: true
        }
    })

    return result
}

export async function getObraAutorByIdObra(id_obra) {
    const result = await prisma.ObraAutor.findMany({
        where: {
            id_obra: id_obra
        }, 
        select: {
            id_autor: true,
            id_obra: true
        }
    })

    return result
}

export async function getObraAutorByIdAutor(id_autor) {
    const result = await prisma.ObraAutor.findMany({
        where: {
            id_autor: id_autor
        }, 
        select: {
            id_autor: true,
            id_obra: true
        }
    })

    return result
}

export async function deleteObraAutor(id_autor, id_obra) {
    const result = await prisma.ObraAutor.delete({
        where: {
            id_autor: id_autor,
            id_obra: id_obra
        },
        select: {
            id_autor: true,
            id_obra: true
        }
    })

    return result
}