import { getCddById } from "../../Model/CddModel.js";

export default async function getCddByIdController(req, res) {
    try {
        const { id } = req.params;
        
        const cdd = await getCddById(id);

        if(!cdd) {
            throw new Error("CDD não encontrado!");
        }

        return res.status(200).json({
            message: "CDD encontrado com sucesso!",
            cdd
        })
    } catch (error) {
        return res.status(500).json({
            message: "Não foi possível encontrar o CDD!",
            error: error.message
        })
    }
}