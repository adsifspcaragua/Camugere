import { getLeitorById } from "../../Model/LeitorModel.js";
import { getUsuarioById } from "../../Model/UsuarioModel.js";

export default async function getLeitorByIdController(req, res) {
    try {
        const { id } = req.params

        const leitor = await getLeitorById(+id)

        if(!leitor){
            throw new Error("Leitor não encontrado!")
        }

        const usuario = await getUsuarioById(leitor.id_usuario)

        if(!usuario){
            throw new Error("Usuário do leitor não encontrado!")
        }

        return res.status(200).json({
            message: "Leitor encontrado com sucesso!",
            leitor,
            usuario
        })
    } catch (e) {
        return res.status(500).json({
            message: "Não foi possível encontrar o leitor!",
            error: e.message
        })
    }
}