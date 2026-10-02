import { obraValidator, updateObra } from "../../Model/ObraModel.js";

export default async function updateObraController(req, res) {
    try {
        const { id } = req.params;
        const obra = req.body;

        const { success, data, error } = obraValidator(obra, true);

        if (!success) {
            return res.status(400).json({
                message: "Não foi possível validar a obra!",
                error: error.errors?.map((e) => e.message).join(", ") || error.message
            });
        }

        const result = await updateObra(Number(id), data);

        return res.status(200).json({
            message: "Obra atualizada com sucesso!",
            data: result
        });
    } catch (error) {
        return res.status(500).json({
            message: "Erro ao atualizar a obra!",
            error: error.message
        });
    }
}