import { PrismaClient } from "@prisma/client";
import z from "zod";

const prisma = new PrismaClient()

const usuarioSchema = new z.object({
    nome: z.string({
        invalid_type_error: "O nome deve ser um valor tipo texto",
        required_error: "O nome deve ser obrigatorio"
    }),
    
    email: z.string({
        invalid_type_error: "O nome deve ser um valor tipo texto",
        required_error: "O nome deve ser obrigatorio"
    })


})