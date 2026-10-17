import { deleteEmprestimo } from "../../Model/EmprestimoModel.js";
import { updateExemplar } from "../../Model/ExemplarModel.js";

export default async function deleteEmprestimoController(req, res) {
    try {
        const { id } = req.params

        const result = await deleteEmprestimo(+id)

        if (!result) {
            throw new Error("Não foi possível deletar o empréstimo!")
        }

        if (result.id_exemplar && !result.statusDevolucao) {
            await updateExemplar(result.id_exemplar, { disponivel: true });
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