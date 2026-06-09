import { updateExemplar } from "../../Model/ExemplarModel.js";
import { exemplarValidator } from "../../Model/ExemplarModel.js";

export default async function updateExemplarController(req, res) {
    try {
        const { id } = req.params
        const exemplar = req.body

        const { success, data, error } = exemplarValidator(exemplar)

        if (!success) {
            throw new Error("Não foi possível validar o exemplar!", error)
        }

        const result = await updateExemplar(+id, exemplar)

        if (!result) {
            throw new Error("Não foi possível atualizar o exemplar!")
        }

        return res.status(200).json({
            message: "Exemplar atualizado com sucesso!",
            data: result
        })
    } catch (error) {
        return res.status(500).json({
            message: "Erro!",
            error: error.message
        })
    }
}