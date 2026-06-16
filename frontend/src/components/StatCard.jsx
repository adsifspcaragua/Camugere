import { TrendingUp, TrendingDown } from "lucide-react";

export default function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  trendValue,
  variant = "default",
  onClick,
}) {
  const variants = {
    default:
      "border-surface-200 bg-white dark:border-surface-800 dark:bg-surface-900",
    danger:
      "border-red-200 bg-red-50/50 dark:border-red-500/20 dark:bg-red-500/5",
  };

  const iconVariants = {
    default:
      "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400",
    danger: "bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400",
  };

  const isPositive = trend === "up";
  
  const Component = onClick ? "button" : "div";

  return (
    <Component
      onClick={onClick}
      className={`text-left w-full rounded-2xl border p-6 transition-all duration-300 hover:shadow-md ${onClick ? "cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 hover:border-brand-300 dark:hover:border-brand-700" : ""} ${variants[variant]}`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-base font-medium text-surface-500 dark:text-surface-400">
            {title}
          </p>
          <p
            className={`text-3xl font-bold tracking-tight ${
              variant === "danger"
                ? "text-red-700 dark:text-red-400"
                : "text-surface-900 dark:text-white"
            }`}
          >
            {typeof value === "number" ? value.toLocaleString("pt-BR") : value}
          </p>
        </div>
        <div className={`rounded-xl p-3 ${iconVariants[variant]}`}>
          <Icon size={22} />
        </div>
      </div>
      {trendValue && (
        <div className="mt-3 flex items-center gap-2">
          {isPositive ? (
            <TrendingUp size={16} className="text-emerald-500" />
          ) : (
            <TrendingDown size={16} className="text-red-500" />
          )}
          <span
            className={`text-base font-semibold ${
              isPositive
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {trendValue}
          </span>
        </div>
      )}
    </Component>
  );
}
