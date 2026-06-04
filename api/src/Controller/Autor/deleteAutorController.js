import { deleteAutor } from "../../Model/AutorModel.js"

export default async function deleteAutorController(req, res) {
    try {
        const { id } = req.params

        const result = await deleteAutor(+id)

        if(!result) {
            throw new Error(`Não foi possível deletar o autor com id ${id}`)
        }

        return res.status(200).json({
            message: "Autor deletado com sucesso"
        })
    } catch (error) {
        return res.status(500).json({
            message: "Erro!",
            error: error.message
        })
    }
}