import { forwardRef } from "react";
import { CornerDownLeft, Menu, Plus } from "lucide-react";
import Button from "../ui/Button.jsx";
import SearchInput from "../ui/SearchInput.jsx";
import Kbd from "../ui/Kbd.jsx";

const Topbar = forwardRef(function Topbar({ search, onSearch, onOpenMenu, onNewLoan, onReturn, bell }, searchRef) {
  return (
    <div className="sticky top-0 z-20 border-b border-line bg-paper/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[1360px] items-center gap-3 px-4 sm:px-8">
        <button onClick={onOpenMenu} className="rounded-md p-1.5 text-ink-soft hover:bg-sunken lg:hidden" aria-label="Abrir menu">
          <Menu size={18} />
        </button>
        <div className="relative w-full max-w-md">
          <SearchInput ref={searchRef} value={search} onChange={onSearch} placeholder="Buscar no acervo por título, autor ou CDD" />
          {!search && (
            <span className="pointer-events-none absolute top-1/2 right-2.5 hidden -translate-y-1/2 sm:block">
              <Kbd>/</Kbd>
            </span>
          )}
        </div>
        <div className="ml-auto flex items-center gap-2">
          {bell}
          <Button variant="secondary" icon={CornerDownLeft} onClick={onReturn} tooltip="Atalho: D" className="hidden sm:inline-flex">
            Devolução
          </Button>
          <Button icon={Plus} onClick={onNewLoan} tooltip="Atalho: N" aria-label="Novo empréstimo">
            <span className="hidden sm:inline">Empréstimo</span>
          </Button>
        </div>
      </div>
    </div>
  );
});

export default Topbar;
