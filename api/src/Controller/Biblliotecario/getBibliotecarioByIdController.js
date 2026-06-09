import { getBibliotecarioById } from "../../Model/BibliotecarioModel.js";

export default async function getBibliotecarioByIdController(req, res) {
    try {
        const { id } = req.params

        const result = await getBibliotecarioById(+id)

        if(!result){
            throw new Error("Não foi possível encontrar o bibliotecário!")
        }

        return res.status(200).json({
            message: "Bibliotecario encontrado com sucesso!",
            data: result
        })
    } catch (error) {
        return res.status(500).json({
            message: "Erro!",
            error: error.message
        })
    }
}