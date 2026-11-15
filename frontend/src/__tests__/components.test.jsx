import { act, fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { useState } from "react";
import Autocomplete from "../components/Autocomplete.jsx";
import ErrorBoundary from "../components/ErrorBoundary.jsx";
import ConnectionBanner from "../components/ConnectionBanner.jsx";
import Drawer from "../components/ui/Drawer.jsx";
import Modal from "../components/ui/Modal.jsx";
import SearchInput from "../components/ui/SearchInput.jsx";
import Segmented from "../components/ui/Segmented.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import Avatar from "../components/ui/Avatar.jsx";
import Cover from "../components/ui/Cover.jsx";
import { TextArea, TextField, inputProps } from "../components/ui/Field.jsx";

describe("Field", () => {
  it("associa rótulo, dica e erro ao campo", () => {
    const { rerender } = render(<TextField label="Nome" hint="Como no documento" optional />);
    const input = screen.getByLabelText(/Nome/);
    expect(screen.getByText("opcional")).toBeInTheDocument();
    expect(input).toHaveAttribute("aria-invalid", "false");
    expect(input).toHaveAccessibleDescription("Como no documento");

    rerender(<TextField label="Nome" hint="Como no documento" error="Informe o nome." />);
    expect(screen.getByLabelText(/Nome/)).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("alert")).toHaveTextContent("Informe o nome.");
    expect(screen.queryByText("Como no documento")).not.toBeInTheDocument();
  });

  it("TextArea marca erro e inputProps remove props que não são do DOM", () => {
    render(<TextArea label="Resumo" error="Muito longo" />);
    expect(screen.getByLabelText("Resumo")).toHaveAttribute("aria-invalid", "true");
    expect(inputProps({ name: "a", value: 1, onChange: 2, onBlur: 3, error: "x" })).toEqual({ name: "a", value: 1, onChange: 2, onBlur: 3 });
  });
});

describe("Autocomplete", () => {
  const leitores = [
    { id: 1, nome: "Ana" },
    { id: 2, nome: "Bruno" },
    { id: 3, nome: "Bia" },
  ];
  function Busca() {
    const [valor, setValor] = useState(null);
    return (
      <Autocomplete
        id="leitor"
        items={leitores}
        filter={(l, q) => l.nome.toLowerCase().includes(q.toLowerCase())}
        renderItem={(l) => <span>{l.nome}</span>}
        getKey={(l) => l.id}
        getLabel={(l) => l.nome}
        value={valor}
        onChange={setValor}
        placeholder="Buscar leitor"
        emptyMessage="Nenhum leitor."
      />
    );
  }

  it("filtra, navega com setas e escolhe com Enter", () => {
    render(<Busca />);
    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "b" } });
    expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual(["Bruno", "Bia"]);
    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(screen.getAllByRole("option")[1]).toHaveAttribute("aria-selected", "true");
    fireEvent.keyDown(input, { key: "Enter" });
    expect(screen.getByText("Bia")).toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Remover Bia"));
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("mostra mensagem vazia, fecha com Esc e escolhe com clique", () => {
    render(<Busca />);
    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "zzz" } });
    expect(screen.getByText("Nenhum leitor.")).toBeInTheDocument();
    fireEvent.keyDown(input, { key: "Escape" });
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    fireEvent.change(input, { target: { value: "an" } });
    fireEvent.click(screen.getByRole("option", { name: "Ana" }));
    expect(screen.getByLabelText("Remover Ana")).toBeInTheDocument();
  });

  it("seta para cima a partir do primeiro vai para o último", () => {
    render(<Busca />);
    const input = screen.getByRole("combobox");
    fireEvent.focus(input);
    fireEvent.keyDown(input, { key: "ArrowUp" });
    expect(screen.getAllByRole("option")[2]).toHaveAttribute("aria-selected", "true");
  });

  it("fecha ao clicar fora", () => {
    render(<Busca />);
    fireEvent.focus(screen.getByRole("combobox"));
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });
});

describe("ErrorBoundary", () => {
  function Quebra({ quebrar }) {
    if (quebrar) throw new Error("boom");
    return <p>conteúdo</p>;
  }

  it("mostra instruções em vez de tela branca e permite continuar", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    let quebrar = true;
    const { rerender } = render(
      <ErrorBoundary>
        <Quebra quebrar={quebrar} />
      </ErrorBoundary>,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Algo deu errado por aqui");
    quebrar = false;
    rerender(
      <ErrorBoundary>
        <Quebra quebrar={quebrar} />
      </ErrorBoundary>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Tentar continuar" }));
    expect(screen.getByText("conteúdo")).toBeInTheDocument();
    console.error.mockRestore();
  });
});

describe("ConnectionBanner", () => {
  afterEach(() => vi.useRealTimers());

  it("aparece offline, tenta reconectar e recarrega ao voltar", () => {
    vi.useFakeTimers();
    const onRetry = vi.fn();
    render(<ConnectionBanner onRetry={onRetry} />);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();

    act(() => window.dispatchEvent(new Event("offline")));
    expect(screen.getByRole("status")).toHaveTextContent("Sem conexão com o servidor");
    act(() => vi.advanceTimersByTime(5000));
    expect(onRetry).toHaveBeenCalledTimes(1);

    act(() => window.dispatchEvent(new Event("online")));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(onRetry).toHaveBeenCalledTimes(2);
  });
});

describe("Drawer e Modal", () => {
  it("Drawer fechado não renderiza nada", () => {
    render(<Drawer open={false} title="Novo leitor" />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("Drawer com formulário envia, mostra erro e fecha com Esc", () => {
    const onSubmit = vi.fn();
    const onClose = vi.fn();
    render(
      <Drawer open title="Novo leitor" description="Dados pessoais" onClose={onClose} onSubmit={onSubmit} error="Falha ao salvar" footer={<button type="submit">Salvar</button>}>
        <input aria-label="nome" />
      </Drawer>,
    );
    expect(screen.getByRole("dialog", { name: "Novo leitor" })).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Falha ao salvar");
    expect(document.body.style.overflow).toBe("hidden");
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));
    expect(onSubmit).toHaveBeenCalled();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByLabelText("Fechar"));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("Esc não fecha o Drawer quando há confirmação aberta por cima", () => {
    const onClose = vi.fn();
    render(
      <>
        <Drawer open title="D" onClose={onClose} />
        <Modal open onClose={() => {}} labelledBy="x">
          <p id="x">Confirmar</p>
        </Modal>
      </>,
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).not.toHaveBeenCalled();
  });

  it("Modal fecha ao clicar no fundo", () => {
    const onClose = vi.fn();
    render(
      <Modal open onClose={onClose} labelledBy="t">
        <h2 id="t">Título</h2>
      </Modal>,
    );
    fireEvent.click(document.querySelector("[aria-hidden]"));
    expect(onClose).toHaveBeenCalled();
  });
});

describe("componentes simples", () => {
  it("SearchInput repassa o texto e limpa a busca", () => {
    const onChange = vi.fn();
    const { rerender } = render(<SearchInput value="" onChange={onChange} placeholder="Buscar obra" />);
    fireEvent.change(screen.getByLabelText("Buscar obra"), { target: { value: "dom" } });
    expect(onChange).toHaveBeenCalledWith("dom");
    expect(screen.queryByLabelText("Limpar busca")).not.toBeInTheDocument();
    rerender(<SearchInput value="dom" onChange={onChange} placeholder="Buscar obra" />);
    fireEvent.click(screen.getByLabelText("Limpar busca"));
    expect(onChange).toHaveBeenLastCalledWith("");
  });

  it("Segmented marca a aba ativa e mostra contagem", () => {
    const onChange = vi.fn();
    render(
      <Segmented
        label="Filtro"
        value="todos"
        onChange={onChange}
        options={[
          { value: "todos", label: "Todos", count: 10 },
          { value: "atrasados", label: "Atrasados", count: 2, alert: true },
        ]}
      />,
    );
    expect(screen.getByRole("tab", { name: /Todos/ })).toHaveAttribute("aria-selected", "true");
    fireEvent.click(screen.getByRole("tab", { name: /Atrasados/ }));
    expect(onChange).toHaveBeenCalledWith("atrasados");
    expect(screen.getByText("2")).toHaveClass("text-danger");
  });

  it("EmptyState mostra título, descrição e ação", () => {
    render(<EmptyState title="Nada aqui" description="Cadastre a primeira obra" action={<button>Nova obra</button>} />);
    expect(screen.getByText("Nada aqui")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Nova obra" })).toBeInTheDocument();
  });

  it("Avatar mostra as iniciais com cor estável", () => {
    const { container, rerender } = render(<Avatar name="Ana Souza" size="lg" />);
    const cor = container.firstChild.style.background;
    expect(container.firstChild).toHaveTextContent("AS");
    rerender(<Avatar name="Ana Souza" size="sm" />);
    expect(container.firstChild.style.background).toBe(cor);
  });

  it("Cover usa a imagem e cai para a lombada se ela falhar", () => {
    const { container } = render(<Cover src="http://x/capa.png" title="dom casmurro" />);
    const img = container.querySelector("img");
    expect(img).toHaveAttribute("src", "http://x/capa.png");
    fireEvent.error(img);
    expect(container.querySelector("img")).toBeNull();
    expect(container.firstChild).toHaveTextContent("D");
  });

  it("Cover sem título mostra marcador", () => {
    const { container } = render(<Cover />);
    expect(container.firstChild).toHaveTextContent("·");
  });
});
