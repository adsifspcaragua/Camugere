import { obraValidator } from "../../Model/ObraModel.js";
import { updateObra } from "../../Model/ObraModel.js";

export default async function updateObraController(req, res) {
    try {
        const { id } = req.params
        const obra = req.body

        const { success, data, error } = await obraValidator(obra)

        if(!success){
            throw new Error(`Não foi possível validar a obra, ${error}`)
        }

        const result = await updateObra(+id, data)

        if(!result){
            throw new Error("Não foi possível atualizar a Obra!")
        }

        return res.status(200).json({
            message: "Obra atualizada com sucesso!",
            data: result
        })
    } catch (error) {
        return res.status(500).json({
            message: "Erro!",
            error: error.message
        })
    }
}