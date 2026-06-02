import { updateCdd } from "../../Model/CddModel.js";
import { cddValidator } from "../../Model/CddModel.js";

export default async function updateCddController(req, res) {
    try {        
        const { id } = req.params;
        const cdd = req.body;

        const { success, data, error } = await cddValidator(cdd)

        if (!success) {
            throw new Error(`Não foi possível validar CDD, ${error}`)
        }

        const result = await updateCdd(id, cdd)
        
        if(!result) {
            throw new Error("Não foi possível atualizar o CDD!");
        }

        return res.status(200).json({
            message: "CDD atualizado com sucesso!",
            result
        })
    } catch (error) {
        return res.status(500).json({
            message: "Não foi possível atualizar o CDD!",
            error: error.message
        })
    }
}