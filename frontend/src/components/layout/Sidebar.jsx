import { LogOut } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import Avatar from "../ui/Avatar.jsx";
import Button from "../ui/Button.jsx";
import { NAV_GROUPS } from "./navigation.js";

function Brand() {
  return (
    <div className="flex items-center gap-3 px-5 pt-6 pb-6">
      <img src="/favicon.svg" alt="" className="size-9 rounded-[10px]" />
      <div className="leading-tight">
        <p className="font-display text-lg font-medium text-ink">Camugerê</p>
        <p className="text-[11px] text-ink-muted">Biblioteca comunitária</p>
      </div>
    </div>
  );
}

export default function Sidebar({ page, onNavigate, overdue, open, onClose }) {
  const { user, logout } = useAuth();

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-ink/30 lg:hidden" onClick={onClose} aria-hidden />}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-60 flex-col bg-sunken/60 backdrop-blur transition-transform lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Brand />
        <nav aria-label="Principal" className="flex-1 space-y-5 overflow-y-auto px-3 scrollbar-thin">
          {NAV_GROUPS.map((group) => (
            <div key={group.label ?? "inicio"}>
              {group.label && <p className="mb-1.5 px-3 text-[11px] font-medium tracking-[0.12em] text-ink-muted uppercase">{group.label}</p>}
              <div className="space-y-0.5">
                {group.items.map(({ id, label, icon: Icon }) => {
                  const active = page === id;
                  return (
                    <button
                      key={id}
                      onClick={() => onNavigate(id)}
                      aria-current={active ? "page" : undefined}
                      className={`flex h-10 w-full items-center gap-3 rounded-full px-3.5 text-sm transition-colors ${
                        active ? "bg-forest font-medium text-on-forest" : "text-ink-soft hover:bg-panel hover:text-ink"
                      }`}
                    >
                      <Icon size={17} strokeWidth={1.8} />
                      {label}
                      {id === "emprestimos" && overdue > 0 && (
                        <span
                          className={`tabular ml-auto rounded-full px-2 text-xs font-semibold ${active ? "bg-on-forest/20 text-on-forest" : "bg-danger-soft text-danger"}`}
                          title={`${overdue} em atraso`}
                        >
                          {overdue}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="m-3 flex items-center gap-3 rounded-2xl bg-panel p-2.5">
          <Avatar name={user?.nome} size="sm" />
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-sm font-medium text-ink">{user?.nome}</p>
            <p className="truncate text-xs text-ink-muted">{user?.email}</p>
          </div>
          <Button variant="ghost" size="icon" icon={LogOut} onClick={logout} aria-label="Sair do sistema" />
        </div>
      </aside>
    </>
  );
}
