import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function createBibliotecario(id_usuario){
    const result = await prisma.Bibliotecario.create({
        data: id_usuario,
        select: {
            id: true,
            id_usuario: true
        }
    })

    return result
}

export async function listBibliotecario() {
    const result = await prisma.Bibliotecario.findMany({
        select: {
            id: true,
            id_usuario: true
        }
    })

    return result
}

export async function getBibliotecarioById(id) {
    const result = await prisma.Bibliotecario.findUnique({
        where: {
            id: id
        }, select: {
            id: true,
            id_usuario: true
        }
    })

    return result
}

export async function deleteBibliotecario(id) {
    const result = await prisma.Bibliotecario.delete({
        where: {
            id: id
        }, select: {
            id: true,
            id_usuario: true
        }
    })

    return result
}
