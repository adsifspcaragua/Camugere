// Cores de lombada/avatar escolhidas pelo texto: o mesmo título sempre tem a mesma cor.
const TONS = [
  { bg: "#2f4a3a", fg: "#efe6d2" }, // musgo
  { bg: "#a4502c", fg: "#fbeee2" }, // terracota
  { bg: "#c08a2e", fg: "#2b1f0b" }, // ocre
  { bg: "#5b3a4e", fg: "#f3e3ea" }, // ameixa
  { bg: "#3e5568", fg: "#e6edf2" }, // ardósia
  { bg: "#6d6a3a", fg: "#f3f0dc" }, // oliva
  { bg: "#8a3b3b", fg: "#f7e4e0" }, // vinho
];

function hash(text = "") {
  let h = 0;
  for (const c of text) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}

export const tomPara = (text) => TONS[hash(text) % TONS.length];
