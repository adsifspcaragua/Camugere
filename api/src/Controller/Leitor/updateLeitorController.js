import { updateLeitor } from "../../Model/LeitorModel.js"
import { leitorValidator } from "../../Model/LeitorModel.js"
import { validarCPF } from "../../Model/LeitorModel.js"
import { getLeitorById } from "../../Model/LeitorModel.js"

export default async function updateLeitorController(req, res) {
  try {
    const { id } = req.params
    const dadosRecebidos = {
      ...req.body,
      cpf: req.body.cpf?.replace(/\D/g, ""),
      telefone: req.body.telefone?.replace(/\D/g, ""),
    }
    const leitorAtual = await getLeitorById(+id)
    const cpfAtual = leitorAtual?.cpf?.replace(/\D/g, "")
    const cpfFoiAlterado = dadosRecebidos.cpf && dadosRecebidos.cpf !== cpfAtual
    const dadosSemCpf = { ...dadosRecebidos }
    delete dadosSemCpf.cpf
    const leitor = cpfFoiAlterado ? dadosRecebidos : dadosSemCpf

    const { success, data, error } = await leitorValidator(leitor, true)

    if (!success) {
      throw new Error(`Não foi possível validar leitor, ${error}`)
    }

    if (cpfFoiAlterado && !validarCPF(leitor.cpf)) {
      throw new Error(`Não foi possível validar CPF`)
    }

    const result = await updateLeitor(leitor, +id)

    if (!result) {
      throw new Error("Não foi possível atualizar Leitor!")
    }

    return res.status(200).json({
      message: "Leitor atualizado com sucesso!",
      data: result,
    })
  } catch (error) {
    return res.status(500).json({
      message: "Não foi possível atualizar o leitor!",
      error: error.message,
    })
  }
}
