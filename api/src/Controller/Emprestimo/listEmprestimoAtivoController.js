import { listEmprestimosAtivos } from "../../Model/EmprestimoModel.js";

export default async function listEmprestimoAtivoController(req, res) {
    try {
        const result = await listEmprestimosAtivos()

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