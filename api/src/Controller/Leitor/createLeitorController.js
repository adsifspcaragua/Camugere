import { createLeitor } from "../../Model/LeitorModel.js"
import { leitorValidator } from "../../Model/LeitorModel.js"
import { validarCPF } from "../../Model/LeitorModel.js"

export default async function createLeitorController(req, res) {
  try {
    const leitor = {
      ...req.body,
      cpf: req.body.cpf?.replace(/\D/g, ""),
      telefone: req.body.telefone?.replace(/\D/g, ""),
    }
    const { success, data, error } = await leitorValidator(leitor)

    if (!success) {
      throw new Error(`Não foi possível validar leitor, ${error}`)
    }

    const cpfValidetor = validarCPF(leitor.cpf)

    if (!cpfValidetor) {
      throw new Error(`Não foi possível validar CPF`)
    }

    const result = await createLeitor(leitor)

    if (!result) {
      throw new Error("Não foi possível criar Leitor!")
    }

    return res.status(200).json({
      message: "Leitor criado com sucesso!",
      data: result,
    })
  } catch (e) {
    return res.status(500).json({
      message: "Não foi possível criar o leitor!",
      error: e.message,
    })
  }
}
