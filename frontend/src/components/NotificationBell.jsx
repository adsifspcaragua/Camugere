import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { useLibrary } from "../context/LibraryContext.jsx";
import Button from "./ui/Button.jsx";
import { buildNotifications } from "../lib/notifications.js";

const SEEN_KEY = "camugere:notificacoes-vistas";
const DOT = { danger: "bg-danger", warn: "bg-warn", info: "bg-forest" };

function loadSeen() {
  try {
    return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) ?? "[]"));
  } catch {
    return new Set();
  }
}

function saveSeen(ids) {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify([...ids]));
  } catch {
    /* sem armazenamento: as notificações voltam a aparecer como novas */
  }
}

export default function NotificationBell({ onNavigate, onOpenLeitor }) {
  const { loans, leitores } = useLibrary();
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState(loadSeen);
  const rootRef = useRef(null);

  const itens = useMemo(() => buildNotifications(loans, leitores), [loans, leitores]);
  const novas = itens.filter((n) => !seen.has(n.id)).length;

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => !rootRef.current?.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const toggle = () => {
    setOpen((o) => !o);
    if (!open && novas) {
      // Guarda só os ids atuais, para a lista não crescer para sempre.
      const ids = new Set(itens.map((n) => n.id));
      setSeen(ids);
      saveSeen(ids);
    }
  };

  const abrir = (n) => {
    setOpen(false);
    if (n.alvo.leitorId) onOpenLeitor(n.alvo.leitorId);
    else onNavigate(n.alvo.pagina);
  };

  return (
    <div ref={rootRef} className="relative">
      <Button
        variant="ghost"
        size="icon"
        icon={Bell}
        onClick={toggle}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={novas ? `${novas} notificações novas` : "Notificações"}
        tooltip={open ? "" : novas ? `${novas} nova${novas === 1 ? "" : "s"}` : "Notificações"}
      />
      {novas > 0 && (
        <span className="tabular pointer-events-none absolute -top-1 -right-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-danger px-1 text-xs font-bold text-white ring-2 ring-paper dark:text-paper">
          {novas > 9 ? "9+" : novas}
        </span>
      )}

      {open && (
        <div role="dialog" aria-label="Notificações" className="animate-rise absolute top-13 right-0 z-40 w-[min(420px,calc(100vw-2rem))] overflow-hidden rounded-lg border-[1.5px] border-line-strong bg-panel shadow-pop">
          <div className="flex items-baseline justify-between border-b border-line px-5 py-4">
            <p className="font-display text-lg font-bold text-ink">Notificações</p>
            <p className="text-xs text-ink-muted">{itens.length ? `${itens.length} pendente${itens.length === 1 ? "" : "s"}` : ""}</p>
          </div>
          {itens.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
              <BellOff size={24} className="text-ink-muted" aria-hidden />
              <p className="text-base text-ink-soft">Tudo em dia. Nada precisa da sua atenção agora.</p>
            </div>
          ) : (
            <ul className="max-h-[60vh] divide-y divide-line overflow-y-auto scrollbar-thin">
              {itens.map((n) => (
                <li key={n.id}>
                  <button onClick={() => abrir(n)} className="flex min-h-16 w-full gap-3 px-5 py-3.5 text-left hover:bg-sunken">
                    <span className={`mt-2 size-3 shrink-0 rounded-full ${DOT[n.tone]}`} aria-hidden />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-ink">{n.titulo}</span>
                      <span className="mt-0.5 block break-words text-xs text-ink-muted">{n.detalhe}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
