import { useState } from "react";
import { Lock, Mail, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await login({ email, password });
    } catch (err) {
      setError(err.message || "Não foi possível fazer login.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-50 py-10 dark:bg-surface-950">
      <div className="mx-auto max-w-md rounded-3xl border border-surface-200 bg-white p-10 shadow-xl dark:border-surface-800 dark:bg-surface-900">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-brand-500 text-white shadow-lg shadow-brand-500/20">
            <Lock size={28} />
          </div>
          <h1 className="text-3xl font-semibold text-surface-900 dark:text-white">Entrar</h1>
          <p className="mt-2 text-sm text-surface-500 dark:text-surface-400">
            Faça login para acessar o sistema da biblioteca.
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <label className="block">
            <span className="text-sm font-medium text-surface-700 dark:text-surface-300">Email</span>
            <div className="mt-2 rounded-2xl border border-surface-200 bg-surface-50 px-4 py-3 dark:border-surface-700 dark:bg-surface-800 flex items-center">
              <Mail size={18} className="mr-2 inline text-surface-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent text-sm text-surface-900 outline-none dark:text-surface-100"
                placeholder="seu@email.com"
                required
              />
            </div>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-surface-700 dark:text-surface-300">Senha</span>
            <div className="mt-2 rounded-2xl border border-surface-200 bg-surface-50 px-4 py-3 dark:border-surface-700 dark:bg-surface-800 flex items-center">
              <Lock size={18} className="mr-2 inline text-surface-400 flex"/>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent text-sm text-surface-900 outline-none dark:text-surface-100"
                placeholder="Senha"
                required
              />
            </div>
          </label>

          {error && <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-600 px-5 py-3 text-base font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Entrar
            <ArrowRight size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
