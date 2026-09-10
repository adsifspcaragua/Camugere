import { changeStatusDevolucaoEmprestimo } from "../../Model/EmprestimoModel.js";
import { emprestimoValidator } from "../../Model/EmprestimoModel.js";

export default async function changeStatusDevolucaoEmprestimoController(req, res) {
    try {
        const { id } = req.params
        const emprestimo = req.body

        const result = await changeStatusDevolucaoEmprestimo(+id, emprestimo)

        if (!result) {
            throw new Error("Não foi possível atualizar o empréstimo!")
        }

        return res.status(200).json({
            message: "Empréstimo atualizado com sucesso!",
            data: result
        })
    } catch (error) {
        return res.status(500).json({
            message: "Erro!",
            error: error.message
        })
    }
}