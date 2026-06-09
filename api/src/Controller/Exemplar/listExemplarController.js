import { listExemplar } from "../../Model/ExemplarModel.js"

export default async function listExemplarController(req, res) {
    try {
        const result = await listExemplar()

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