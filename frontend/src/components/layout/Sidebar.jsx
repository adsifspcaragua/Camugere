import { LogOut } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import Avatar from "../ui/Avatar.jsx";
import Button from "../ui/Button.jsx";
import { NAV_GROUPS } from "./navigation.js";

function Brand() {
  return (
    <div className="flex items-center gap-3 px-5 pt-6 pb-6">
      <img src="/favicon.svg" alt="" className="size-11 rounded-md" />
      <div className="leading-tight">
        <p className="font-display text-lg font-bold text-ink">Camugerê</p>
        <p className="text-xs text-ink-muted">Biblioteca comunitária</p>
      </div>
    </div>
  );
}

export default function Sidebar({ page, onNavigate, overdue, open, onClose }) {
  const { user, logout } = useAuth();

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-stone-950/40 lg:hidden" onClick={onClose} aria-hidden />}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r-[1.5px] border-line bg-panel transition-transform lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Brand />
        <nav aria-label="Principal" className="flex-1 space-y-6 overflow-y-auto px-4 scrollbar-thin">
          {NAV_GROUPS.map((group) => (
            <div key={group.label ?? "inicio"}>
              {group.label && <p className="mb-2 px-4 text-xs font-semibold tracking-[0.08em] text-ink-muted uppercase">{group.label}</p>}
              <div className="space-y-1">
                {group.items.map(({ id, label, icon: Icon }) => {
                  const active = page === id;
                  return (
                    <button
                      key={id}
                      onClick={() => onNavigate(id)}
                      aria-current={active ? "page" : undefined}
                      className={`flex min-h-12 w-full items-center gap-3 rounded-md px-4 text-base transition-colors ${
                        active ? "bg-forest font-bold text-on-forest" : "font-medium text-ink-soft hover:bg-sunken hover:text-ink"
                      }`}
                    >
                      <Icon size={20} strokeWidth={2} />
                      {label}
                      {id === "emprestimos" && overdue > 0 && (
                        <span
                          className={`tabular ml-auto rounded-sm px-2 py-0.5 text-xs font-bold ${active ? "bg-on-forest/20 text-on-forest" : "bg-danger-soft text-danger"}`}
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

        <div className="m-4 flex items-center gap-3 rounded-lg border-[1.5px] border-line bg-sunken p-3">
          <Avatar name={user?.nome} size="sm" />
          <div className="min-w-0 flex-1 leading-tight">
            <p className="break-words text-sm font-semibold text-ink">{user?.nome}</p>
            <p className="wrap-anywhere text-xs text-ink-muted">{user?.email}</p>
          </div>
          <Button variant="ghost" size="icon" icon={LogOut} onClick={logout} aria-label="Sair do sistema" />
        </div>
      </aside>
    </>
  );
}
