import { api } from "../lib/api.js";

export const MAX_CAPA_BYTES = 5 * 1024 * 1024;

export async function uploadCapa(file) {
  const form = new FormData();
  form.append("capa", file);
  return (await api.post("/upload/capa", form)).url;
}

export async function uploadCapaUrl(url) {
  return (await api.post("/upload/capa", { url })).url;
}
