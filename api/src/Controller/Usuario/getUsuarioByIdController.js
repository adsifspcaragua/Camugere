import { getUsuarioById } from "../../Model/UsuarioModel.js";

export default async function getUsuarioByIdController(req, res) {
    try {
        const {id} = req.params

        const result = await getUsuarioById(+id)

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