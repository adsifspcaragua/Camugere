import { listAutor } from "../../Model/AutorModel.js"

export default async function listAutorController(req, res) {
    try {
        const result = await listAutor()

        if(!result) {
            throw new Error(`Não foi possível listar os autores`)
        }

        return res.status(200).json({
            message: "Autores listados com sucesso",
            data: result
        })
    } catch (error) {
        return res.status(500).json({
            message: "Erro!",
            error: error.message
        })
    }
}