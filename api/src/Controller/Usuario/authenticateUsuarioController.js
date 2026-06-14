import { getUsuarioByEmail } from "../../Model/UsuarioModel.js"
import { usuarioValidator } from "../../Model/UsuarioModel.js"
import { getBibliotecarioByUsuarioId } from "../../Model/UsuarioModel.js"
import bcrypt from "bcrypt" 
import jwt from "jsonwebtoken"

export default async function authenticateUsuarioBibliotecarioController(req, res){
    try {
        const { email, hash } = req.body 

        const { success, data, error } = usuarioValidator({email, hash}, {nome: true})

        if(!success){
            throw new Error("Email ou senha inválidos!")
        }

        const usuario = await getUsuarioByEmail(email)

        if(!usuario){
            throw new Error("Não foi possível achar um usuário com este email")
        }

        const isValidPass = await bcrypt.compare(hash, usuario.hash)
        if(!isValidPass){
            throw new Error("Email ou senha estão errados!")
        }
        
        const bibliotecario = await getBibliotecarioByUsuarioId(usuario.id)

        if(!bibliotecario){
            throw new Error("O usuário não tem perfil de bibliotecario")
        }

        const accessToken = jwt.sign({
            id: usuario.id,
            id_bibliotecario: bibliotecario.id
        }, process.env.JWT_SECRET, {expiresIn: "24h"})

        return res.status(200).json({
            message: "Login Efetuado com sucesso!",
            data: accessToken
        })

    } catch (error) {
        return res.status(500).json({
            message: "Erro!",
            error: error.message
        })
    }
}