import { PrismaClient } from "@prisma/client"
import bcrypt from "bcrypt" 
import z, { hash } from "zod";

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
    const data = {
        nome: usuario.nome,
        email: usuario.email,
        hash: await bcrypt.hash(usuario.hash, 10)
    }
    
    const result = await prisma.Usuario.create({
        data: data,
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