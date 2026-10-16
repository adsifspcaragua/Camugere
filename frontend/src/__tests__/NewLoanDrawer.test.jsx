import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { vi, test, expect } from "vitest";
import NewLoanDrawer from "../components/NewLoanDrawer";

vi.mock("../../services/leitorService.js", () => ({
  listLeitores: vi.fn().mockResolvedValue({ data: [] }),
}));

vi.mock("../../services/exemplarService.js", () => ({
  listExemplaresDisponiveis: vi.fn().mockResolvedValue({ data: [] }),
}));

vi.mock("../../services/usuarioService.js", () => ({
  getUsuarioById: vi.fn().mockResolvedValue({ data: { nome: "Usuario Teste" } }),
}));

test("NewLoanDrawer displays newly registered obra exemplares from props", async () => {
  const mockObras = [
    { idObra: 10, titulo: "Dom Casmurro", autor: "Machado de Assis", capa: "📕" },
  ];
  const mockExemplares = [
    { idExemplar: 55, idObra: 10, numeroInventario: "DOM-001", disponivel: true },
  ];

  render(
    <NewLoanDrawer
      isOpen={true}
      onClose={() => {}}
      emprestimos={[]}
      exemplares={mockExemplares}
      obras={mockObras}
      onConfirm={() => {}}
    />
  );

  await waitFor(() => {
    expect(screen.getByText("Novo Empréstimo")).toBeInTheDocument();
  });
});
