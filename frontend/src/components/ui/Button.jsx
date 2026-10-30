import { forwardRef } from "react";
import Tooltip from "./Tooltip.jsx";

const VARIANTS = {
  primary: "bg-forest font-bold text-on-forest hover:bg-forest-strong disabled:bg-line-strong disabled:text-ink-soft disabled:hover:bg-line-strong",
  secondary: "border-2 border-ink bg-transparent font-semibold text-ink hover:bg-sunken disabled:border-line-strong disabled:text-ink-muted",
  ghost: "font-semibold text-ink-soft hover:bg-sunken hover:text-ink disabled:opacity-45",
  "ghost-danger": "font-semibold text-danger hover:bg-danger-soft disabled:opacity-45",
  danger: "bg-danger font-bold text-white hover:brightness-90 disabled:bg-line-strong disabled:text-ink-soft dark:text-paper",
};

const SIZES = {
  sm: "min-h-10 px-4 text-xs gap-2",
  md: "min-h-12 px-5 text-sm gap-2",
  lg: "min-h-[52px] px-6 text-base gap-2.5",
  icon: "size-11 justify-center",
};

/**
 * Botão padrão. `tooltip` mostra uma dica; em botões só de ícone, o aria-label vira a dica automaticamente.
 */
const Button = forwardRef(function Button(
  { variant = "primary", size = "md", icon: Icon, loading, tooltip, className = "", children, type = "button", ...props },
  ref,
) {
  const dica = tooltip ?? (size === "icon" ? props["aria-label"] : undefined);
  const button = (
    <button
      ref={ref}
      type={type}
      disabled={loading || props.disabled}
      aria-busy={loading || undefined}
      className={`inline-flex shrink-0 items-center rounded-md whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:hover:bg-transparent ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />
      ) : (
        Icon && <Icon size={size === "sm" ? 17 : size === "lg" ? 20 : 19} strokeWidth={2} aria-hidden />
      )}
      {size !== "icon" && (loading ? "Aguarde…" : children)}
    </button>
  );

  // Botão desabilitado não dispara eventos de mouse: a dica fica num invólucro.
  if (dica && props.disabled) {
    return (
      <Tooltip content={dica}>
        <span tabIndex={0} className="inline-flex rounded-md">
          {button}
        </span>
      </Tooltip>
    );
  }
  return dica ? <Tooltip content={dica}>{button}</Tooltip> : button;
});

export default Button;
