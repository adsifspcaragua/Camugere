import { createExemplar } from "../../Model/ExemplarModel.js";
import { exemplarValidator } from "../../Model/ExemplarModel.js";

export default async function createExemplarController(req, res) {
    try {
        const exemplar = req.body

        const { success, data, error } = exemplarValidator(exemplar)

        if (!success) {
            throw new Error(`Não foi possível validar o exemplar! ${error}`)
        }

        const result = await createExemplar(exemplar)

        if (!result) {
            throw new Error("Não foi possível criar o exemplar!")
        }

        return res.status(200).json({
            message: "Exemplar criado com sucesso!",
            data: result
        })
    } catch (error) {
        return res.status(500).json({
            message: "Erro!",
            error: error.message
        })
    }
}