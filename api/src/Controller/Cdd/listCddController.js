import { listCdd } from "../../Model/CddModel.js";

export default async function listCddController(req, res) {
    try {
        const result = await listCdd()

        if(!result){
            throw new Error("Nenhum cdd encontrado")
        }

        return res.status(200).json({
            message: "Cdds listados com sucesso!",
            data: result
        })
    } catch (error) {
        return res.status(500).json({
            message: "Não foi possível listar os cdds!",
            error: error.message
        })
    }
}