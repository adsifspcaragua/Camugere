const dateFmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
const shortFmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" });

export const formatDate = (date) => (date ? dateFmt.format(new Date(date)) : "—");
export const formatShortDate = (date) => (date ? shortFmt.format(new Date(date)).replace(".", "") : "—");

export const onlyDigits = (value = "") => String(value).replace(/\D/g, "");

export function formatCpf(value = "") {
  const d = onlyDigits(value).slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

export function formatPhone(value = "") {
  const d = onlyDigits(value).slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  const split = d.length === 11 ? 7 : 6;
  return `(${d.slice(0, 2)}) ${d.slice(2, split)}-${d.slice(split)}`;
}

export function initials(name = "") {
  return (
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .filter((_, i, arr) => i === 0 || i === arr.length - 1)
      .join("")
      .toUpperCase() || "?"
  );
}

export const plural = (n, singular, pluralForm = `${singular}s`) => `${n} ${n === 1 ? singular : pluralForm}`;

export const normalize = (text = "") =>
  String(text)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

export const matches = (query, ...fields) => {
  const q = normalize(query.trim());
  return !q || fields.some((f) => normalize(f ?? "").includes(q));
};

export function toCsv(rows) {
  const escape = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return rows.map((row) => row.map(escape).join(",")).join("\n");
}

export function downloadFile(content, filename, type = "text/csv;charset=utf-8") {
  const url = URL.createObjectURL(new Blob(["﻿", content], { type }));
  const link = Object.assign(document.createElement("a"), { href: url, download: filename });
  link.click();
  URL.revokeObjectURL(url);
}

export function formatCep(value = "") {
  const d = onlyDigits(value).slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

export function formatEndereco(l) {
  const rua = [l.logradouro, l.numero].filter(Boolean).join(", ");
  const linha1 = [rua, l.complemento].filter(Boolean).join(" — ");
  const linha2 = [l.bairro, [l.cidade, l.uf].filter(Boolean).join("/")].filter(Boolean).join(", ");
  return [linha1, linha2, l.cep && `CEP ${formatCep(l.cep)}`].filter(Boolean).join(" · ");
}
