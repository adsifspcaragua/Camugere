import {
  LayoutDashboard,
  BookOpen,
  Users,
  ArrowLeftRight,
  BarChart3,
  Settings,
  BookMarked,
} from "lucide-react";

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "acervo", label: "Acervo", icon: BookOpen },
  { id: "leitores", label: "Leitores", icon: Users },
  { id: "emprestimos", label: "Empréstimos", icon: ArrowLeftRight },
  { id: "relatorios", label: "Relatórios", icon: BarChart3 },
  { id: "configuracoes", label: "Configurações", icon: Settings },
];

export default function Sidebar({ activePage, onNavigate, overdueCount = 0 }) {
  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-surface-200 bg-white transition-colors duration-300 dark:border-surface-800 dark:bg-surface-900">
      {/* Logo */}
      <div className="flex h-20 items-center gap-3 border-b border-surface-200 px-5 dark:border-surface-800">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-md shadow-brand-600/30">
          <BookMarked size={22} />
        </div>
        <div>
          <h1 className="text-base font-bold tracking-tight text-surface-900 dark:text-white">
            Camugerê
          </h1>
          <p className="text-[13px] font-medium text-surface-400 dark:text-surface-500">
            Casa da Democracia
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4 scrollbar-thin">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`group flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-base font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-surface-900 ${
                isActive
                  ? "bg-brand-50 text-brand-700 shadow-sm dark:bg-brand-500/10 dark:text-brand-400"
                  : "text-surface-500 hover:bg-surface-100 hover:text-surface-900 dark:text-surface-400 dark:hover:bg-surface-800 dark:hover:text-surface-200"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon
                size={20}
                className={`flex-shrink-0 transition-colors ${
                  isActive
                    ? "text-brand-600 dark:text-brand-400"
                    : "text-surface-400 group-hover:text-surface-600 dark:text-surface-500 dark:group-hover:text-surface-300"
                }`}
              />
              <span>{item.label}</span>
              {item.id === "emprestimos" && overdueCount > 0 && (
                <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white">
                  {overdueCount}
                </span>
              )}
              {isActive && item.id !== "emprestimos" && (
                <span className="ml-auto h-2 w-2 rounded-full bg-brand-600 dark:bg-brand-400" />
              )}
              {isActive && item.id === "emprestimos" && overdueCount === 0 && (
                <span className="ml-auto h-2 w-2 rounded-full bg-brand-600 dark:bg-brand-400" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer - Logged User */}
      <div className="border-t border-surface-200 px-4 py-4 dark:border-surface-800">
        <div className="flex items-center gap-3 rounded-2xl bg-surface-50 px-4 py-3 dark:bg-surface-800/50">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-base font-bold text-white">
            MA
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-semibold text-surface-800 dark:text-surface-200">
              Mariana
            </p>
            <p className="truncate text-[13px] text-surface-400 dark:text-surface-500">
              Bibliotecária
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
