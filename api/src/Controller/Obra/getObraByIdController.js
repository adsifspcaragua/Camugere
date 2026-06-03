import { getObraById } from "../../Model/ObraModel.js";

export default async function getObraByIdController(req, res) {
    try {
        const { id } = req.params

        const result = await getObraById(id)

        if(!result) {
            throw new Error("Não foi possível encontrar a obra!")
        }

        return res.status(200).json({
            message: "Obra encontrada com sucesso!",
            data: result
        })
    } catch (error) {
        return res.status(500).json({
            message: "Erro!",
            error: error.message
        })
    }
}