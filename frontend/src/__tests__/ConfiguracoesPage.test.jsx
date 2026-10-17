import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { expect, test, vi } from "vitest"
import ConfiguracoesPage from "../pages/ConfiguracoesPage"

vi.mock("../context/ThemeContext", () => ({
  useTheme: () => ({ dark: false, toggle: vi.fn() }),
}))

test("registers a librarian after matching password confirmation", async () => {
  const onRegister = vi.fn().mockResolvedValue({ ok: true })
  render(<ConfiguracoesPage onRegisterBibliotecario={onRegister} />)

  fireEvent.change(screen.getByLabelText(/^nome$/i), {
    target: { value: "Ana Lima" },
  })
  fireEvent.change(screen.getByLabelText(/^e-mail$/i), {
    target: { value: "ana@example.com" },
  })
  fireEvent.change(screen.getByLabelText(/^senha$/i), {
    target: { value: "senha123" },
  })
  fireEvent.change(screen.getByLabelText(/confirmar senha/i), {
    target: { value: "senha123" },
  })
  fireEvent.click(
    screen.getByRole("button", { name: /registrar bibliotecário/i }),
  )

  await waitFor(() =>
    expect(onRegister).toHaveBeenCalledWith({
      nome: "Ana Lima",
      email: "ana@example.com",
      senha: "senha123",
      confirmacao: "senha123",
    }),
  )
  expect(await screen.findByText(/registrado com sucesso/i)).toBeInTheDocument()
})
