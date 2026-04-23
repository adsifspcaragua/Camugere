import { listLeitor } from "../../Model/LeitorModel.js";

export default async function listLeitorController(req, res) {
    try {
        const result = await listLeitor()

        if(!result){
            throw new Error("Não foi possível listar os leitores!")
        }

        return res.status(200).json({
            message: "Leitores listados com sucesso!",
            data: result
        })
    } catch (e) {
        return res.status(500).json({
            message: "Não foi possível listar os leitores!",
            error: e.message
        })
    }
}