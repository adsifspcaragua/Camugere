import { useCallback, useEffect, useState } from "react";
import { Send } from "lucide-react";
import { Panel, PanelHeader } from "../components/ui/Panel.jsx";
import Button from "../components/ui/Button.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { useLibrary } from "../context/LibraryContext.jsx";
import { enviarLembretes, statusLembretes } from "../services/emprestimoService.js";

export default function LembretesPanel() {
  const toast = useToast();
  const { reload } = useLibrary();
  const [status, setStatus] = useState(null);
  const [sending, setSending] = useState(false);

  const carregar = useCallback(() => statusLembretes().then(setStatus).catch(() => setStatus(null)), []);
  useEffect(() => {
    carregar();
  }, [carregar]);

  const enviarAgora = async () => {
    setSending(true);
    try {
      const r = await enviarLembretes();
      if (r.falhas.length) toast.error(`${r.enviados} enviado(s), ${r.falhas.length} com falha.`);
      else toast.success(r.enviados ? `${r.enviados} lembrete(s) enviado(s).` : "Nenhum lembrete pendente agora.");
      carregar();
      reload();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <Panel>
      <PanelHeader title="Lembretes de devolução" description="E-mail automático enviado ao leitor antes do vencimento." />
      <div className="flex flex-wrap items-center gap-4 px-6 py-5 text-sm">
        <div className="min-w-0 flex-[1_1_20rem] text-ink-soft">
          {status ? (
            <>
              <p>
                Enviados <strong className="font-semibold text-ink">{status.diasAntes} dia(s) antes</strong> do prazo, {status.automatico ? "verificando de hora em hora." : "envio automático desligado no servidor."}
              </p>
              <p className="mt-1 text-ink-muted">
                {status.pendentes ? `${status.pendentes} empréstimo(s) aguardando lembrete.` : "Nenhum lembrete pendente."} Cada empréstimo recebe um lembrete por prazo (renovar gera um novo).
              </p>
            </>
          ) : (
            <p className="text-ink-muted">Não foi possível consultar o status dos lembretes.</p>
          )}
        </div>
        <Button variant="secondary" size="sm" icon={Send} onClick={enviarAgora} loading={sending}>
          Enviar pendentes agora
        </Button>
      </div>
      <p className="border-t border-line px-6 py-4 text-xs text-ink-muted">
        A antecedência é definida por <code className="font-mono">LEMBRETE_DIAS_ANTES</code> no <code className="font-mono">.env</code> da API.
      </p>
    </Panel>
  );
}
