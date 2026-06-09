import { getExemplarById } from "../../Model/ExemplarModel.js";

export default async function getExemplarByIdController(req, res) {
    try {
        const { id } = req.params

        const result = await getExemplarById(+id)

        if (!result) {
            throw new Error("Não foi possível encontrar o exemplar!")
        }

        return res.status(200).json({
            message: "Exemplar encontrado com sucesso!",
            data: result
        })
    } catch (error) {
        return res.status(500).json({
            message: "Erro!",
            error: error.message
        })
    }
}