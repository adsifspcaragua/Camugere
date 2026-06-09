import { createEmprestimo } from "../../Model/EmprestimoModel.js"
import { emprestimoValidator } from "../../Model/EmprestimoModel.js"

export default async function createEmprestimoController(req, res) {
    try {
        const emprestimo = req.body

        const { success, data, error } = emprestimoValidator(emprestimo)

        if (!success) {
            throw new Error("Não foi possível validar o empréstimo!", error)
        }

        const result = await createEmprestimo(emprestimo)

        if (!result) {
            throw new Error("Não foi possível criar o empréstimo!")
        }

        return res.status(200).json({
            message: "Empréstimo criado com sucesso!",
            data: result
        })
    } catch (error) {
        return res.status(500).json({
            message: "Erro!",
            error: error.message
        })
    }
}