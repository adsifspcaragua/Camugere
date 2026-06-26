import { listEmprestimosAtrasados } from "../../Model/EmprestimoModel.js";

export default async function listEmprestimoAtrasadoController(req, res) {
    try {
        const result = await listEmprestimosAtrasados()

        if (!result) {
            throw new Error("Não foi possível listar os empréstimos!")
        }

        return res.status(200).json({
            message: "Empréstimos listados com sucesso!",
            data: result
        })
    } catch (error) {
        return res.status(500).json({
            message: "Erro!",
            error: error.message
        })
    }
}