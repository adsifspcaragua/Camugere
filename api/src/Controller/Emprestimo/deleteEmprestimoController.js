import { deleteEmprestimo } from "../../Model/EmprestimoModel.js";

export default function deleteEmprestimoController(req, res) {
    try {
        const { id } = req.params

        const result = deleteEmprestimo(+id)

        if (!result) {
            throw new Error("Não foi possível deletar o empréstimo!")
        }

        return res.status(200).json({
            message: "Empréstimo deletado com sucesso!",
            data: result
        })
    } catch (error) {
        return res.status(500).json({
            message: "Erro!",
            error: error.message
        })
    }
}