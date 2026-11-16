import { render, screen } from "@testing-library/react";
import Footer from "../components/layout/Footer.jsx";

const EXPECTED_MEMBERS = [
  "Tiago Vieira",
  "Lucas Perrota",
  "Rafael Tomaz",
  "Matheus Manfredini",
  "Vitor de Oliveira",
];

describe("Footer", () => {
  it("renderiza todos os integrantes, os links do Tiago Vieira e os direitos autorais", () => {
    render(<Footer />);

    expect(screen.getByText(/Desenvolvido por/i)).toBeInTheDocument();
    for (const member of EXPECTED_MEMBERS) {
      expect(screen.getByText(member)).toBeInTheDocument();
    }
    expect(
      screen.getByText(/Camugerê — Projeto de Extensão 3\. Todos os direitos reservados\./i)
    ).toBeInTheDocument();

    const githubLink = screen.getByRole("link", { name: /github de tiago vieira/i });
    expect(githubLink).toHaveAttribute("href", "https://github.com/sapopianista");
    expect(githubLink).toHaveAttribute("target", "_blank");
    expect(githubLink).toHaveAttribute("rel", "noopener noreferrer");

    const linkedinLink = screen.getByRole("link", { name: /linkedin de tiago vieira/i });
    expect(linkedinLink).toHaveAttribute("href", "https://www.linkedin.com/in/tiagovieira167/");
    expect(linkedinLink).toHaveAttribute("target", "_blank");
    expect(linkedinLink).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("renderiza em modo compacto sem o nome do sistema, mantendo integrantes e direitos autorais", () => {
    render(<Footer compact />);

    for (const member of EXPECTED_MEMBERS) {
      expect(screen.getByText(member)).toBeInTheDocument();
    }
    expect(screen.queryByText(/Sistema de Gestão da Biblioteca Comunitária/i)).not.toBeInTheDocument();
    expect(
      screen.getByText(/Camugerê — Projeto de Extensão 3\. Todos os direitos reservados\./i)
    ).toBeInTheDocument();
  });
});