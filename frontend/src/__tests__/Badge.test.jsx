import { render, screen } from "@testing-library/react";
import Badge from "../components/ui/Badge.jsx";

it("renderiza o rótulo com o tom informado", () => {
  render(<Badge tone="danger">Em atraso</Badge>);
  expect(screen.getByText("Em atraso")).toHaveClass("text-danger");
});
