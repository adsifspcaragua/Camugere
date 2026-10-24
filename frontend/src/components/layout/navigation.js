import { ArrowLeftRight, BarChart3, BookOpen, LayoutDashboard, Settings, Users } from "lucide-react";

// Agrupado pelo que a bibliotecária faz: atender no balcão, cuidar do acervo, acompanhar.
export const NAV_GROUPS = [
  { label: null, items: [{ id: "inicio", label: "Início", icon: LayoutDashboard }] },
  {
    label: "Balcão",
    items: [
      { id: "emprestimos", label: "Empréstimos", icon: ArrowLeftRight },
      { id: "leitores", label: "Leitores", icon: Users },
    ],
  },
  {
    label: "Biblioteca",
    items: [
      { id: "acervo", label: "Acervo", icon: BookOpen },
      { id: "relatorios", label: "Relatórios", icon: BarChart3 },
      { id: "configuracoes", label: "Configurações", icon: Settings },
    ],
  },
];

export const PAGES = NAV_GROUPS.flatMap((g) => g.items);
