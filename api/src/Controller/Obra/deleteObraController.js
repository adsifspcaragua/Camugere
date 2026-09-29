import { deleteObra } from "../../Model/ObraModel.js";

export default async function deleteObraController(req, res) {
    try {
        const { id } = req.params;

        const result = await deleteObra(Number(id));

        return res.status(200).json({
            message: "Obra deletada com sucesso!",
            data: result
        });
    } catch (error) {
        return res.status(500).json({
            message: "Erro ao deletar a obra!",
            error: error.message
        });
    }
}