const KEY = "camugere:settings";
const DEFAULTS = { prazoPadrao: 14, renovacaoDias: 14, enviarEmailPadrao: true };

export function loadSettings() {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) ?? "{}") };
  } catch {
    return DEFAULTS;
  }
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    /* armazenamento indisponível: mantém só em memória */
  }
}
