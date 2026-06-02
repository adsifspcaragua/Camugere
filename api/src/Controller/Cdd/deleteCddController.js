import { deleteCdd } from "../../Model/CddModel.js";

export default async function deleteCddController(req, res) {
    try {
        const { id } = req.params;

        const result = await deleteCdd(id);

        if(!result) {
            throw new Error("CDD não encontrado!");
        }

        return res.status(200).json({
            message: "CDD deletado com sucesso!",
            result
        })
    } catch (error) {
        return res.status(500).json({
            message: "Não foi possível deletar o CDD!",
            error: error.message
        })        
    }
}