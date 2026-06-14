import { usuarioValidator } from "../../Model/UsuarioModel.js"
import { createUsuario } from "../../Model/UsuarioModel.js"

export default async function createUsuarioController(req, res) {
    try {
        const usuario = req.body
        const { success, data, error } = await usuarioValidator(usuario)

        if(!success){
            throw new Error(`Não foi possível validar usuário, ${error}`)
        }

        const result = createUsuario(usuario)

        if(!result){
            throw new Error("Não foi possível criar Usuário!")
        }

        return res.status(200).json({
            message: "Usuário criado com sucesso!",
            data: result
        })

    } catch (e) {
        return res.status(500).json({
            message: "Erro!",
            error: e.message 
        })
    }
    
}