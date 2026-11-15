import { Component } from "react";

/**
 * Última barreira: se algo inesperado quebrar a tela, mostra instruções em vez de uma página em branco.
 * O que foi salvo antes continua salvo; só o que estava sendo digitado pode se perder.
 */
export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Erro inesperado na interface:", error, info?.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div role="alert" className="flex min-h-screen items-center justify-center bg-paper p-6 text-ink">
        <div className="w-full max-w-md rounded-2xl border-2 border-line bg-panel p-8 text-center shadow-card">
          <h1 className="font-display text-2xl font-extrabold">Algo deu errado por aqui</h1>
          <p className="mt-3 text-base leading-relaxed text-ink-muted">
            Ocorreu um problema inesperado e a tela não pôde ser exibida. O que já foi salvo está seguro. Tente recarregar a página; se o erro continuar, avise o responsável pelo sistema.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button onClick={() => window.location.reload()} className="h-12 rounded-xl bg-forest px-6 font-bold text-on-forest hover:bg-forest-strong">
              Recarregar a página
            </button>
            <button onClick={() => this.setState({ error: null })} className="h-12 rounded-xl border-2 border-line px-6 font-semibold text-ink hover:bg-sunken">
              Tentar continuar
            </button>
          </div>
        </div>
      </div>
    );
  }
}
