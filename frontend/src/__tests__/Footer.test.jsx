import { render, screen } from "@testing-library/react";
import Footer from "../components/layout/Footer.jsx";

describe("Footer", () => {
  it("renderiza o nome do desenvolvedor Tiago Vieira e os links corretos", () => {
    render(<Footer />);

    expect(screen.getByText("Tiago Vieira")).toBeInTheDocument();
    expect(screen.getByText(/Desenvolvido por/i)).toBeInTheDocument();

    const githubLink = screen.getByRole("link", { name: /github de tiago vieira/i });
    expect(githubLink).toHaveAttribute("href", "https://github.com/sapopianista");
    expect(githubLink).toHaveAttribute("target", "_blank");
    expect(githubLink).toHaveAttribute("rel", "noopener noreferrer");

    const linkedinLink = screen.getByRole("link", { name: /linkedin de tiago vieira/i });
    expect(linkedinLink).toHaveAttribute("href", "https://www.linkedin.com/in/tiagovieira167/");
    expect(linkedinLink).toHaveAttribute("target", "_blank");
    expect(linkedinLink).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("renderiza em modo compacto sem o nome do sistema", () => {
    render(<Footer compact />);

    expect(screen.getByText("Tiago Vieira")).toBeInTheDocument();
    expect(screen.queryByText(/Sistema de Gestão da Biblioteca Comunitária/i)).not.toBeInTheDocument();
  });
});
