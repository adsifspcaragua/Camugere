import { listObra } from "../../Model/ObraModel.js";

export default async function listObraController(req, res) {
    try {
        const result = await listObra()

        if(!result) {
            throw new Error("Não foi possível listar as obras!")
        }

        return res.status(200).json({
            message: "Obras listadas com sucesso!",
            data: result
        })
    } catch (error) {
        return res.status(500).json({
            message: "Erro!",
            erro: error.message
        })
    }
}