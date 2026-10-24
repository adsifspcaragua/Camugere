import { forwardRef } from "react";
import Tooltip from "./Tooltip.jsx";

const VARIANTS = {
  primary: "bg-forest text-on-forest hover:bg-forest-strong",
  secondary: "border border-line-strong bg-panel text-ink hover:bg-sunken",
  ghost: "text-ink-soft hover:bg-sunken hover:text-ink",
  "ghost-danger": "text-danger hover:bg-danger-soft",
  danger: "bg-danger text-white hover:opacity-90 dark:text-paper",
};

const SIZES = {
  sm: "h-8 px-3 text-[13px] gap-1.5",
  md: "h-9 px-4 text-sm gap-2",
  lg: "h-11 px-5 text-[15px] gap-2",
  icon: "size-8 justify-center",
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
      className={`inline-flex shrink-0 items-center rounded-full font-medium whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />
      ) : (
        Icon && <Icon size={size === "sm" || size === "icon" ? 15 : 16} strokeWidth={1.9} aria-hidden />
      )}
      {size !== "icon" && (loading ? "Aguarde…" : children)}
    </button>
  );

  // Botão desabilitado não dispara eventos de mouse: a dica fica num invólucro.
  if (dica && props.disabled) {
    return (
      <Tooltip content={dica}>
        <span tabIndex={0} className="inline-flex rounded-full">
          {button}
        </span>
      </Tooltip>
    );
  }
  return dica ? <Tooltip content={dica}>{button}</Tooltip> : button;
});

export default Button;
