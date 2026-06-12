import { createCdd } from "../../Model/CddModel.js";
import { cddValidator } from "../../Model/CddModel.js";

export default async function createCddController(req, res) {
    try {
        const cdd = req.body

        const { success, data, error } = cddValidator(cdd)

        if (!success) {
            throw new Error(`Não foi possível validar o cdd, ${error}`)
        }

        const result = await createCdd(cdd)

        if (!result) {
            throw new Error("Não foi possível criar o cdd!")
        }

        return res.status(200).json({
            message: "Cdd criado com sucesso!",
            cdd: result
        })
    } catch (error) {
        return res.status(500).json({
            message: "Não foi possível criar o cdd!",
            error: error.message
        })
    }
}