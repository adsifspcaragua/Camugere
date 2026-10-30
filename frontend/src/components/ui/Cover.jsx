import { useState } from "react";
import { tomPara } from "../../lib/palette.js";

// Capa do livro; sem imagem, uma lombada colorida com a inicial do título.
const SIZES = { sm: "h-14 w-10 text-base", md: "h-18 w-13 text-xl", lg: "h-36 w-24 text-3xl" };

export default function Cover({ src, title = "", size = "sm" }) {
  const [failedSrc, setFailedSrc] = useState(null);
  const classes = `${SIZES[size]} shrink-0 overflow-hidden rounded-[4px_7px_7px_4px] shadow-[inset_3px_0_0_rgb(0_0_0/0.18),0_1px_2px_rgb(0_0_0/0.12)]`;

  if (src && failedSrc !== src) {
    return <img src={src} alt="" loading="lazy" onError={() => setFailedSrc(src)} className={`${classes} object-cover`} />;
  }
  const tom = tomPara(title);
  return (
    <span aria-hidden className={`${classes} flex items-center justify-center font-display font-bold`} style={{ background: tom.bg, color: tom.fg }}>
      {title.trim()[0]?.toUpperCase() ?? "·"}
    </span>
  );
}
