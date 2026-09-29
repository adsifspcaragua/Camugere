// listObraController.js
import { listObra } from "../../Model/ObraModel.js";

export default async function listObraController(req, res) {
    try {
        const result = await listObra();

        return res.status(200).json({
            message: "Obras listadas com sucesso!",
            data: result
        });
    } catch (error) {
        return res.status(500).json({
            message: "Erro ao listar as obras!",
            error: error.message
        });
    }
}