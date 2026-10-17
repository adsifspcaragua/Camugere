import { getLeitorById } from "../../Model/LeitorModel.js"
import { listSuspensoesLeitor } from "../../Model/SuspensaoLeitorModel.js"

export default async function listSuspensoesLeitorController(req, res) {
  const id = Number(req.params.id)
  if (!Number.isInteger(id))
    return res.status(400).json({ message: "Id do leitor inválido!" })

  try {
    if (!(await getLeitorById(id)))
      return res.status(404).json({ message: "Leitor não encontrado!" })
    return res
      .status(200)
      .json({
        message: "Suspensões listadas com sucesso!",
        data: await listSuspensoesLeitor(id),
      })
  } catch (error) {
    return res
      .status(500)
      .json({
        message: "Não foi possível listar as suspensões!",
        error: error.message,
      })
  }
}
