import { getBibliotecarioById } from "../../Model/BibliotecarioModel.js";
import { getUsuarioById } from "../../Model/UsuarioModel.js";

export default async function getBibliotecarioByIdController(req, res) {
    try {
        const { id } = req.params

        const bibliotecario = await getBibliotecarioById(+id)

        if(!bibliotecario){
            throw new Error("Não foi possível encontrar o bibliotecário!")
        }

        const usuario = await getUsuarioById(bibliotecario.id_usuario)

        if(!usuario){
            throw new Error("Não foi possível encontrar o usuário!")
        }

        return res.status(200).json({
            message: "Bibliotecario encontrado com sucesso!",
            bibliotecario,
            usuario
        })
    } catch (error) {
        return res.status(500).json({
            message: "Erro!",
            error: error.message
        })
    }
}