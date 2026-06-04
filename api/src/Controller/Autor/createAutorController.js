import { createAutor, autorValidator } from '../../Model/AutorModel.js'


export default async function createAutorController(req, res) {
    try {
        const autor = req.body

        const { success, data, error } = autorValidator(autor)

        if (!success) {
            throw new Error(`Não foi possível validar o autor: ${error}`)
        }

        const result = await createAutor(data)

        if(!result) {
            throw new Error(`Não foi possível validar o autor: ${error}`)
        }

        return res.status(200).json({
            message: "Autor criado com sucesso",
            data: result
        })
    } catch (error) {
        return res.status(400).json({
            message: "Erro!",
            error: error.message
        })
    }
}