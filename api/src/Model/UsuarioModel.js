import { PrismaClient } from "@prisma/client";
import z from "zod";

const prisma = new PrismaClient()

const usuarioSchema = new z.object({
    nome: z.string({
        invalid_type_error: "O nome deve ser um valor tipo texto",
        required_error: "O nome deve ser obrigatorio"
    })
    .max(20, "Nome deve ter no máximo 40 caracteres!")
    .min(4, "Nome deve ter no mínimo 20 caracteres!"),
    
    email: z.string({
        invalid_type_error: "O nome deve ser um valor tipo texto",
        required_error: "O nome deve ser obrigatorio"
    })

})

export const usuarioValidator = (usuario, partial = null) => {
    if(partial){
        return usuarioSchema.partial(partial).safeParse(usuario)
    }

    return usuarioSchema.safeParse(usuario)
}

export async function createUsuario(usuario) {
    const result = await prisma.Usuario.create({
        data: usuario,
        select: {
            id: true,
            nome: true,
            email: true,
            hash: false
        }
    })

    return result
}

export async function listUsuario() {
    const result = await prisma.Usuario.findMany({
        select: {
            id: true,
            nome: true,
            email: true,
            hash: false
        }
    })

    return result
}

export async function getUsuarioById(id){
    const result = await prisma.Usuario.findUnique({
        where: {
            id: id
        },
        select: {
            id: true,
            nome: true,
            email: true,
            hash: false
        }
    })

    return result
} 

export async function deleteUsuario(id) {
    const result = await prisma.Usuario.delete({
        where: {
            id: id
        },
        select: {
            id: true,
            nome: true,
            email: true,
            hash: false
        }
    })

    return result
}

export async function updateUsuario(usuario, id) {
    const result = await prisma.Usuario.update({
        data:{
            usuario
        },
        where: {
            id: id
        },
        select: {
            id: true,
            nome: true,
            email: true,
            hash: false
        }
    })
    
}