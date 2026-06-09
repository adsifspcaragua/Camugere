import { deleteBibliotecario } from "../../Model/BibliotecarioModel.js";

export default async function deleteBibliotecarioController(req, res) {
    try {
        const { id } = req.params

        const result = await deleteBibliotecario(id)

        if(!result){
            throw new Error("Não foi possível deletar o bibliotecário!")
        }

        return res.status(200).json({
            message: "Bibliotecario deletado com sucesso!",
            data: result
        })
    } catch (error) {
        return res.status(500).json({
            message: "Erro!",
            error: error.message
        })
    }
}