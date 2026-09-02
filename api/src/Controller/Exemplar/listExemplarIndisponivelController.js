import { listExemplarIndisponivel } from "../../Model/ExemplarModel.js"

export default async function listExemplarIndisponivelController(req, res) {
    try {
        const result = await listExemplarIndisponivel()

        if(!result) {
            throw new Error("Não foi possível listar os exemplares")
        }

        return res.status(200).json({
            message: "Exemplares listados com sucesso",
            data: result
        })
    } catch (error) {
        return res.status(500).json({
            message: "Erro!",
            error: error.message
        })
    }
}