import { initials } from "../../lib/format.js";
import { tomPara } from "../../lib/palette.js";

export default function Avatar({ name = "", size = "md" }) {
  const dims = size === "lg" ? "size-14 text-lg" : size === "sm" ? "size-10 text-xs" : "size-11 text-sm";
  const tom = tomPara(name);
  return (
    <span aria-hidden className={`${dims} flex shrink-0 items-center justify-center rounded-full font-semibold`} style={{ background: tom.bg, color: tom.fg }}>
      {initials(name)}
    </span>
  );
}
