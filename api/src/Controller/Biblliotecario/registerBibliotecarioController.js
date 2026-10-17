import {
  registrarBibliotecario,
  registroBibliotecarioValidator,
} from "../../Model/BibliotecarioModel.js"

export default async function registerBibliotecarioController(req, res) {
  const validation = registroBibliotecarioValidator(req.body)
  if (!validation.success) {
    return res.status(400).json({
      message: "Dados do bibliotecário inválidos!",
      error: validation.error.message,
    })
  }

  try {
    const result = await registrarBibliotecario(validation.data)
    return res.status(201).json({
      message: "Bibliotecário registrado com sucesso!",
      data: result,
    })
  } catch (error) {
    if (
      error.code === "DUPLICATE_EMAIL" ||
      error.code === "DUPLICATE_LIBRARIAN"
    ) {
      return res.status(409).json({ message: error.message })
    }
    return res.status(500).json({
      message: "Não foi possível registrar o bibliotecário!",
      error: error.message,
    })
  }
}
