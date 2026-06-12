import { createObra } from "../../Model/ObraModel.js";
import { obraValidator } from "../../Model/ObraModel.js";

export default async function createObraController(req, res) {
    try {
        const obra = req.body

        const { success, data, error } = await obraValidator(obra)

        if (!success) {
            throw new Error(`Não foi possível validar os dados da obra! Erro: ${error}`)
        }

        const result = await createObra(obra)

        if(!result) {
            throw new Error("Não foi possível criar a obra!")
        }

        return res.status(200).json({
            message: "Obra criada com sucesso!",
            data: result
        })
    } catch (error) {
        return res.status(500).json({
            message: "Erro!",
            error: error.message 
        })
    }
    
}