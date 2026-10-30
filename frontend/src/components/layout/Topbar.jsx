import { forwardRef } from "react";
import { CornerDownLeft, Menu, Plus } from "lucide-react";
import Button from "../ui/Button.jsx";
import SearchInput from "../ui/SearchInput.jsx";
import Kbd from "../ui/Kbd.jsx";

const Topbar = forwardRef(function Topbar({ search, onSearch, onOpenMenu, onNewLoan, onReturn, bell }, searchRef) {
  return (
    <div className="sticky top-0 z-20 border-b-[1.5px] border-line bg-panel/95 backdrop-blur">
      <div className="mx-auto flex min-h-[76px] max-w-[1360px] flex-wrap items-center gap-2 px-4 py-3 sm:flex-nowrap sm:gap-3 sm:px-8 sm:py-0">
        <button onClick={onOpenMenu} className="flex size-11 shrink-0 items-center justify-center rounded-md text-ink-soft hover:bg-sunken lg:hidden" aria-label="Abrir menu">
          <Menu size={22} />
        </button>
        <div className="relative order-last w-full basis-full sm:order-none sm:max-w-xl sm:basis-auto">
          <SearchInput ref={searchRef} value={search} onChange={onSearch} placeholder="Buscar no acervo por título, autor ou CDD" />
          {!search && (
            <span className="pointer-events-none absolute top-1/2 right-3 hidden -translate-y-1/2 sm:block">
              <Kbd>/</Kbd>
            </span>
          )}
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          {bell}
          <Button variant="secondary" icon={CornerDownLeft} onClick={onReturn} tooltip="Atalho: D" className="max-sm:hidden">
            Devolução
          </Button>
          <Button icon={Plus} onClick={onNewLoan} tooltip="Atalho: N" aria-label="Novo empréstimo">
            <span>Empréstimo</span>
          </Button>
        </div>
      </div>
    </div>
  );
});

export default Topbar;
