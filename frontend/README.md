# Camugerê — Frontend

React 19 + Vite + Tailwind 4.

```bash
cp .env.example .env   # aponte VITE_API_URL para a API
npm install
npm run dev
```

Estrutura:

- `src/lib` — cliente HTTP, formatação e regras de empréstimo (funções puras, testáveis)
- `src/services` — uma função por endpoint da API
- `src/context` — autenticação, tema, toasts e o `LibraryContext` (dados + ações do acervo)
- `src/components/ui` — componentes visuais reutilizáveis (botão, campo, drawer, badge…)
- `src/features` — drawers de fluxo (empréstimo, devolução, obra, leitor)
- `src/pages` — uma página por item do menu
