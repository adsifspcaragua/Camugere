import React from "react"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { vi, test, expect } from "vitest"
import App from "../App"

vi.mock("../context/AuthContext", () => ({
  AuthProvider: ({ children }) => <div>{children}</div>,
  useAuth: () => ({
    isAuthenticated: true,
    isLoading: false,
    token: "mock-token",
    user: { bibliotecario: { id: 1 }, usuario: { nome: "Admin" } },
    login: vi.fn(),
    logout: vi.fn(),
  }),
}))

vi.mock("../utils/api.js", () => ({
  apiFetch: vi.fn().mockResolvedValue({ data: [] }),
}))


test("renders App component without crashing", () => {
  render(<App />)
  expect(screen.getByText("Camugerê")).toBeInTheDocument()
})

test("navigates to Acervo page and opens new obra drawer", async () => {
  render(<App />)
  
  // Click on Acervo sidebar link
  const acervoLink = screen.getByRole("button", { name: /acervo/i })
  fireEvent.click(acervoLink)
  
  // Verify Acervo page elements are visible
  await waitFor(() => {
    expect(screen.getByText("Obras e exemplares da Biblioteca Camugerê")).toBeInTheDocument()
  })

  // Click Nova Obra button
  const addObraBtn = screen.getByRole("button", { name: /nova obra/i })
  fireEvent.click(addObraBtn)
  
  await waitFor(() => {
    expect(screen.getByText("Cadastrar obra no acervo")).toBeInTheDocument()
  })
})

