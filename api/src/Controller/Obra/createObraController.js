import { createObra, obraValidator } from "../../Model/ObraModel.js";

export default async function createObraController(req, res) {
    try {
        const obra = req.body;

        const { success, data, error } = obraValidator(obra);

        if (!success) {
            return res.status(400).json({
                message: "Não foi possível validar os dados da obra!",
                error: error.errors?.map((e) => e.message).join(", ") || error.message
            });
        }

        const result = await createObra(data);

        return res.status(201).json({
            message: "Obra criada com sucesso!",
            data: result
        });
    } catch (error) {
        return res.status(500).json({
            message: "Erro ao criar a obra!",
            error: error.message
        });
    }
}