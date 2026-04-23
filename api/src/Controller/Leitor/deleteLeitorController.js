import { deleteLeitor } from "../../Model/LeitorModel.js";

export default async function deleteLeitorController(req, res) {
    try {
        const { id } = req.params

        const result = await deleteLeitor(+id)

        if(!result){
            throw new Error("Não foi possível deletar o leitor!")
        }

        return res.status(200).json({
            message: "Leitor deletado com sucesso!",
            data: result
        })
    } catch (e) {
        return res.status(500).json({
            message: "Não foi possível deletar o leitor!",
            error: e.message
        })
    }
}