import { updateAutor } from "../../Model/AutorModel.js";
import { autorValidator } from "../../Model/AutorModel.js";

export default async function updateAutorController(req, res) {
    try {
        const { id } = req.params
        const autor = req.body

        const { success, data, error } = autorValidator(autor)

        if (!success) {
            throw new Error(`Não foi possível validar o autor: ${error}`)
        }

        const result = await updateAutor(+id, data)

        if (!result) {
            throw new Error(`Não foi possível atualizar o autor com id ${id}: ${error}`)
        }

        return res.status(200).json({
            message: "Autor atualizado com sucesso",
            data: result
        })
    } catch (error) {
        return res.status(500).json({
            message: "Erro!",
            error: error.message
        })
    }
}