import { listUsuario } from "../../Model/UsuarioModel.js";

export default async function listUsuarioController(req, res) {
    try {
        const result = await listUsuario()

        if(!result){
            throw new Error("Não foi possível listar Usuário!")
        }

        return res.status(200).json({
            message: "Usuário listado com sucesso!",
            data: result
        })
    } catch (e) {
        return res.status(500).json({
            message: "Erro!",
            error: e.message 
        })
    }
}