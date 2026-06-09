import { updateEmprestimo } from "../../Model/EmprestimoModel.js";
import { emprestimoValidator } from "../../Model/EmprestimoModel.js"

export default async function updateEmprestimoController(req, res) {
    try {
        const { id } = req.params
        const emprestimo = req.body

        const { success, data, error } = emprestimoValidator(emprestimo)
        
        if (!success) {
            throw new Error("Não foi possível validar o empréstimo!", error)
        }

        const result = await updateEmprestimo(+id, emprestimo)

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