import { usuarioValidator } from "../../Model/UsuarioModel.js"
import { updateUsuario } from "../../Model/UsuarioModel.js"

export default async function updateUsuarioController(req, res) {
    try {
        const {id} = req.params
        const usuario = req.body

        const { success, data, error } = usuarioValidator(usuario)

        if(!success){
            throw new Error(`Não foi possível validar usuário, ${error}`)
        }

        const result = await updateUsuario(usuario, +id)

        if(!result){
            throw new Error("Não foi possível atualizar Usuário!")
        }

        return res.status(200).json({
            message: "Usuário atualizado com sucesso",
            data: result
        })

    } catch (e) {
        return res.status(500).json({
            message: "Erro!",
            error: e.message 
        })
    }
}