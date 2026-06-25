import React from "react"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import App from "../App"

test("renders App component without crashing", () => {
  render(<App />)
  expect(screen.getByText("Camugerê")).toBeInTheDocument()
})

test("navigates to Acervo page and opens new obra drawer", async () => {
  render(<App />)
  
  // Click on Acervo sidebar link
  const acervoLink = screen.getByText("Acervo")
  fireEvent.click(acervoLink)
  
  // Verify Acervo page elements are visible
  await waitFor(() => {
    expect(screen.getByText("Acervo da Biblioteca")).toBeInTheDocument()
  })

  // Click Adicionar Obra
  const addObraBtn = screen.getByText("Adicionar Obra")
  fireEvent.click(addObraBtn)
  
  await waitFor(() => {
    expect(screen.getByText("Cadastrar Nova Obra")).toBeInTheDocument()
  })
})
