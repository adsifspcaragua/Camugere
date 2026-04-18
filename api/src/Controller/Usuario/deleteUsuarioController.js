import { deleteUsuario } from "../../Model/UsuarioModel.js";

export default async function deleteUsuarioController(req, res) {
    try {
        const {id} = req.params
        
        const result = await deleteUsuario(+id)

        if(!result){
            throw new Error("Não foi possível deletar Usuário!")
        }

        return res.status(200).json({
            message: "Usuário deletado com sucesso!",
            data: result
        })
    } catch (e) {
        return res.status(500).json({
            message: "Erro!",
            error: e.message 
        })
    }
    
}