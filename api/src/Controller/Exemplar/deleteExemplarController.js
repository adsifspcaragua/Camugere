import { deleteExemplar } from "../../Model/ExemplarModel.js";

export default async function getExemplarByIdController(req, res) {
    try {
        const { id } = req.params

        const result = await deleteExemplar(+id)

        if (!result) {
            throw new Error("Não foi possível deletar o exemplar!")
        }

        return res.status(200).json({
            message: "Exemplar deletado com sucesso!",
            data: result
        })
    } catch (error) {
        return res.status(500).json({
            message: "Erro!",
            error: error.message
        })
    }
}