// Cartões da tela de entrada: login, primeiro acesso, "esqueci minha senha" e redefinição por link.
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import * as authService from "../services/authService.js";
import { fieldErrorsFromApi, validateBibliotecario, validateEmail, validateLogin, validateNovaSenha } from "../lib/validators.js";

const inputCls =
  "h-14 w-full rounded-xl border-2 border-line bg-sunken px-4 text-base sm:text-lg text-ink placeholder:text-ink-muted/60 transition-all hover:border-field focus:border-forest focus:bg-panel focus:outline-none aria-[invalid=true]:border-danger";
const botaoCls =
  "flex h-14 w-full items-center justify-center gap-2.5 rounded-xl bg-forest px-6 text-lg font-extrabold text-on-forest shadow-sm transition-all hover:bg-forest-strong hover:shadow-md active:scale-[0.99] disabled:opacity-60 cursor-pointer";
const linkCls = "inline-flex items-center gap-1.5 text-sm font-semibold text-forest underline-offset-4 hover:underline cursor-pointer";

function Cabecalho({ titulo, descricao }) {
  return (
    <div className="mb-7">
      <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-ink">{titulo}</h2>
      {descricao && <p className="mt-2 text-base text-ink-muted leading-relaxed">{descricao}</p>}
    </div>
  );
}

function Campo({ id, label, error, hint, ...props }) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-base font-bold text-ink">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={inputCls}
        {...props}
      />
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-sm font-semibold text-danger">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="text-sm text-ink-muted">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

export function Aviso({ tom = "info", children }) {
  const cores = {
    info: "border-forest/30 bg-forest-soft text-forest",
    sucesso: "border-forest/30 bg-forest-soft text-forest",
    alerta: "border-warn/30 bg-warn-soft text-warn",
    erro: "border-danger/30 bg-danger-soft text-danger",
  };
  return (
    <div role={tom === "erro" ? "alert" : "status"} className={`rounded-xl border p-4 text-sm font-semibold leading-relaxed ${cores[tom]}`}>
      {children}
    </div>
  );
}

/** Estado de formulário simples: valores, erros por campo e validação ao sair do campo. */
function useCampos(inicial, validar) {
  const [valores, setValores] = useState(inicial);
  const [erros, setErros] = useState({});
  const bind = (nome) => ({
    name: nome,
    value: valores[nome],
    error: erros[nome],
    onChange: (e) => {
      setValores((v) => ({ ...v, [nome]: e.target.value }));
      setErros((f) => ({ ...f, [nome]: undefined }));
    },
    onBlur: () => valores[nome] && setErros((f) => ({ ...f, [nome]: validar(valores)[nome] })),
  });
  const conferir = () => {
    const encontrados = validar(valores);
    setErros(encontrados);
    const primeiro = Object.keys(encontrados)[0];
    if (primeiro) document.querySelector(`[name="${primeiro}"]`)?.focus();
    return !primeiro;
  };
  return { valores, erros, setErros, bind, conferir };
}

// ---------- Login ----------

export function LoginCard({ onEsqueci, aviso }) {
  const { login, exitReason } = useAuth();
  const { valores, bind, conferir } = useCampos({ email: "", senha: "" }, validateLogin);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!conferir()) return;
    setLoading(true);
    try {
      await login(valores.email.trim(), valores.senha);
    } catch (err) {
      if (err.status === 401) setError("E-mail ou senha incorretos. Confira os dados e tente de novo.");
      else if (err.status === 400) setError("Não foi possível entrar com os dados informados. Confira o e-mail e a senha.");
      else setError(err.message);
      setLoading(false);
    }
  };

  return (
    <>
      <Cabecalho titulo="Entrar no Sistema" descricao="Digite seu e-mail e sua senha cadastrados para acessar o painel." />
      <div className="mb-6 space-y-3 empty:hidden">
        {aviso && <Aviso tom="sucesso">{aviso}</Aviso>}
        {exitReason === "expired" && !error && !aviso && <Aviso tom="alerta">Sua sessão expirou por segurança. Por favor, entre novamente.</Aviso>}
      </div>

      <form onSubmit={submit} noValidate className="space-y-6">
        <Campo id="login-email" label="E-mail de acesso" type="email" autoComplete="username" placeholder="seu-email@exemplo.com" required autoFocus {...bind("email")} />
        <div className="space-y-2">
          <Campo id="login-senha" label="Senha" type="password" autoComplete="current-password" placeholder="Digite sua senha" required {...bind("senha")} />
          <div className="text-right">
            <button type="button" onClick={onEsqueci} className={linkCls}>
              Esqueci minha senha
            </button>
          </div>
        </div>

        {error && <Aviso tom="erro">{error}</Aviso>}

        <button type="submit" disabled={loading} className={botaoCls}>
          {loading ? "Entrando no sistema..." : "Entrar no sistema"}
          {!loading && <ArrowRight size={20} />}
        </button>
      </form>
    </>
  );
}

// ---------- Primeiro acesso ----------

export function PrimeiroAcessoCard() {
  const { entrarComToken } = useAuth();
  const { valores, setErros, bind, conferir } = useCampos({ nome: "", email: "", senha: "", confirmacao: "" }, validateBibliotecario);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!conferir()) return;
    setLoading(true);
    try {
      const { token } = await authService.configurarPrimeiroAcesso({ nome: valores.nome.trim(), email: valores.email.trim(), senha: valores.senha });
      await entrarComToken(token);
    } catch (err) {
      const campos = fieldErrorsFromApi(err);
      if (Object.keys(campos).length) setErros(campos);
      else setError(err.message);
      setLoading(false);
    }
  };

  return (
    <>
      <Cabecalho
        titulo="Primeiro acesso"
        descricao="O sistema ainda não tem nenhuma conta. Crie a conta de quem vai administrar a biblioteca; depois, as outras pessoas da equipe são adicionadas em Configurações."
      />
      <form onSubmit={submit} noValidate className="space-y-5">
        <Campo id="pa-nome" label="Seu nome" autoComplete="name" required autoFocus {...bind("nome")} />
        <Campo id="pa-email" label="Seu e-mail" type="email" autoComplete="username" placeholder="seu-email@exemplo.com" required {...bind("email")} />
        <Campo id="pa-senha" label="Crie uma senha" type="password" autoComplete="new-password" hint="Mínimo de 6 caracteres." required {...bind("senha")} />
        <Campo id="pa-confirmacao" label="Repita a senha" type="password" autoComplete="new-password" required {...bind("confirmacao")} />
        {error && <Aviso tom="erro">{error}</Aviso>}
        <button type="submit" disabled={loading} className={botaoCls}>
          {loading ? "Criando conta..." : "Criar conta e entrar"}
          {!loading && <ArrowRight size={20} />}
        </button>
      </form>
    </>
  );
}

// ---------- Esqueci minha senha ----------

export function EsqueciCard({ onVoltar }) {
  const { valores, bind, conferir } = useCampos({ email: "" }, validateEmail);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!conferir()) return;
    setLoading(true);
    try {
      setResultado(await authService.esqueciSenha(valores.email.trim()));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const voltar = (
    <button type="button" onClick={onVoltar} className={linkCls}>
      <ArrowLeft size={16} /> Voltar para o login
    </button>
  );

  if (resultado) {
    return (
      <>
        <Cabecalho titulo="Esqueci minha senha" />
        <div className="space-y-6">
          {resultado.emailConfigurado ? (
            <Aviso tom="sucesso">
              Se <strong>{valores.email.trim()}</strong> tiver acesso ao sistema, você vai receber um e-mail com um link para criar uma nova senha. O link vale por 30
              minutos. Confira também a caixa de spam.
            </Aviso>
          ) : (
            <Aviso tom="alerta">
              O envio de e-mail não está configurado neste computador, então não é possível mandar o link. Peça a outra pessoa da equipe para definir uma nova senha
              para você em <strong>Configurações › Equipe da biblioteca</strong>.
            </Aviso>
          )}
          {voltar}
        </div>
      </>
    );
  }

  return (
    <>
      <Cabecalho titulo="Esqueci minha senha" descricao="Informe o e-mail que você usa para entrar. Vamos enviar um link para você criar uma nova senha." />
      <form onSubmit={submit} noValidate className="space-y-6">
        <Campo id="esqueci-email" label="E-mail de acesso" type="email" autoComplete="username" placeholder="seu-email@exemplo.com" required autoFocus {...bind("email")} />
        {error && <Aviso tom="erro">{error}</Aviso>}
        <button type="submit" disabled={loading} className={botaoCls}>
          {loading ? "Enviando..." : "Enviar link"}
        </button>
        {voltar}
      </form>
    </>
  );
}

// ---------- Redefinir pelo link do e-mail ----------

export function RedefinirCard({ token, onConcluido, onVoltar }) {
  const { valores, setErros, bind, conferir } = useCampos({ novaSenha: "", confirmacao: "" }, validateNovaSenha);
  const [valido, setValido] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    authService
      .validarLinkRedefinicao(token)
      .then((r) => setValido(r.valido))
      .catch(() => setValido(false));
  }, [token]);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!conferir()) return;
    setLoading(true);
    try {
      await authService.redefinirSenha(token, valores.novaSenha);
      onConcluido();
    } catch (err) {
      const campos = fieldErrorsFromApi(err);
      if (Object.keys(campos).length) setErros(campos);
      else setError(err.message);
      setLoading(false);
    }
  };

  const voltar = (
    <button type="button" onClick={onVoltar} className={linkCls}>
      <ArrowLeft size={16} /> Voltar para o login
    </button>
  );

  if (valido === null) return <Cabecalho titulo="Criar nova senha" descricao="Conferindo o link..." />;
  if (!valido) {
    return (
      <>
        <Cabecalho titulo="Criar nova senha" />
        <div className="space-y-6">
          <Aviso tom="alerta">Este link é inválido, já foi usado ou expirou. Peça um novo em “Esqueci minha senha”, na tela de login.</Aviso>
          {voltar}
        </div>
      </>
    );
  }

  return (
    <>
      <Cabecalho titulo="Criar nova senha" descricao="Escolha a nova senha de acesso. Depois de salvar, entre com ela normalmente." />
      <form onSubmit={submit} noValidate className="space-y-5">
        <Campo id="nova-senha" label="Nova senha" type="password" autoComplete="new-password" hint="Mínimo de 6 caracteres." required autoFocus {...bind("novaSenha")} />
        <Campo id="nova-confirmacao" label="Repita a nova senha" type="password" autoComplete="new-password" required {...bind("confirmacao")} />
        {error && <Aviso tom="erro">{error}</Aviso>}
        <button type="submit" disabled={loading} className={botaoCls}>
          {loading ? "Salvando..." : "Salvar nova senha"}
        </button>
        {voltar}
      </form>
    </>
  );
}
