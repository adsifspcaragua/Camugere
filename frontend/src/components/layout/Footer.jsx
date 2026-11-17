export function GithubIcon({ className = "size-4" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  );
}

export function LinkedinIcon({ className = "size-4" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76c-.97 0-1.75-.79-1.75-1.76s.78-1.76 1.75-1.76c.97 0 1.76.79 1.76 1.76s-.79 1.76-1.76 1.76m1.4 9.74v-8.37H5.06v8.37h2.8z" />
    </svg>
  );
}

// Para adicionar redes sociais aos demais integrantes, preencha `github` e/ou `linkedin`.
export const TEAM_MEMBERS = [
  {
    name: "Tiago Vieira",
    github: "https://github.com/sapopianista",
    linkedin: "https://www.linkedin.com/in/tiagovieira167/",
  },
  { name: "Lucas Perrota" },
  { name: "Rafael Tomaz" },
  { name: "Matheus Manfredini" },
  { name: "Vitor de Oliveira" },
];

const SYSTEM_NAME = "Biblioteca Comunitária";

function joinNames(names) {
  if (names.length <= 1) return names.join("");
  return `${names.slice(0, -1).join(", ")} e ${names[names.length - 1]}`;
}

function MemberSocialLinks({ member }) {
  if (!member.github && !member.linkedin) return null;

  const linkClass =
    "text-ink-soft transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest";

  return (
    <span className="flex items-center gap-2.5">
      {member.github && (
        <a
          href={member.github}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`GitHub de ${member.name} (abre em nova aba)`}
          title={`GitHub: ${member.name}`}
          className={linkClass}
        >
          <GithubIcon className="size-4" />
        </a>
      )}
      {member.linkedin && (
        <a
          href={member.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`LinkedIn de ${member.name} (abre em nova aba)`}
          title={`LinkedIn: ${member.name}`}
          className={`${linkClass} hover:!text-[#0A66C2]`}
        >
          <LinkedinIcon className="size-4" />
        </a>
      )}
    </span>
  );
}

function Heading({ children }) {
  return (
    <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-ink-soft">
      {children}
    </h2>
  );
}

export default function Footer({ compact = false, className = "" }) {
  const currentYear = new Date().getFullYear();

  const team = (
    <div>
      <Heading>Desenvolvido por</Heading>
      <ul
        className={`grid gap-x-8 gap-y-2 text-sm ${
          compact ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2"
        }`}
      >
        {TEAM_MEMBERS.map((member) => (
          <li
            key={member.name}
            className="flex min-h-6 items-center gap-3"
          >
            <span className="text-ink">{member.name}</span>
            <MemberSocialLinks member={member} />
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <footer
      className={`mt-auto border-t border-line bg-panel/90 transition-colors ${className}`}
    >
      <div
        className={`mx-auto px-4 sm:px-8 ${compact ? "max-w-[820px]" : "max-w-[1360px]"}`}
      >
        {compact ? (
          <div className="py-8">{team}</div>
        ) : (
          <div className="grid gap-10 py-10 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1.6fr]">
            <div>
              <p className="text-base font-bold text-ink">{SYSTEM_NAME}</p>
              <p className="mt-2 max-w-xs text-sm leading-relaxed text-ink-muted">
                Espaço Cultural Casa da Democracia
              </p>
            </div>
            <div>
              <Heading>Projeto</Heading>
              <p className="max-w-xs text-sm leading-relaxed text-ink">
                Projeto de Extensão do curso de Análise e Desenvolvimento de Sistemas
              </p>
              <p className="mt-1 text-sm text-ink-muted">
                IFSP — Câmpus Caraguatatuba
              </p>
            </div>
            <div className="md:col-span-2 lg:col-span-1">{team}</div>
          </div>
        )}

        <div className="border-t border-line py-5 text-xs text-ink-muted">
          <p>
            © {currentYear} {joinNames(TEAM_MEMBERS.map((m) => m.name))}. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
