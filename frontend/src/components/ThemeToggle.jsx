import { Moon, Sun } from "lucide-react";
import { useTheme } from "../context/ThemeContext.jsx";
import Button from "./ui/Button.jsx";

/**
 * Botão acessível para alternar entre modo claro e escuro.
 * Apresenta aria-label e tooltip descritivos e ícone contextual (Sol/Lua).
 */
export default function ThemeToggle({
  className = "",
  variant = "ghost",
  size = "icon",
  showLabel = false,
  ...props
}) {
  const { dark, toggleTheme } = useTheme();

  const label = dark ? "Alternar para modo claro" : "Alternar para modo escuro";
  const text = dark ? "Modo claro" : "Modo escuro";
  const Icon = dark ? Sun : Moon;

  return (
    <Button
      type="button"
      variant={variant}
      size={showLabel ? "sm" : size}
      icon={Icon}
      onClick={toggleTheme}
      aria-label={label}
      tooltip={showLabel ? undefined : label}
      className={className}
      {...props}
    >
      {showLabel ? text : null}
    </Button>
  );
}

