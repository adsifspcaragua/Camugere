import { getAutorById } from "../../Model/AutorModel.js"

export default async function getAutorByIdController(req, res) {
    try {
        const { id } = req.params
        
        const result = await getAutorById(+id)

        if(!result) {
            throw new Error(`Não foi possível encontrar o autor com id ${id}`)
        }

        return res.status(200).json({
            message: "Autor encontrado com sucesso",
            data: result
        })
    } catch (error) {
        return res.status(500).json({
            message: "Erro!",
            error: error.message
        })
    }
}