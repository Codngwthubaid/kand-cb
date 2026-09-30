import type { CSSProperties } from "react";
import { Heart } from "lucide-react";

const TEXT = "Built by Ubaid with love";

function Chunk({ idPrefix }: { idPrefix: string }) {
  const chars = TEXT.split("");
  return (
    <span className="marquee-chunk" aria-hidden="true">
      {chars.map((ch, i) => (
        <span
          key={`${idPrefix}-${i}`}
          className="marquee-char"
          style={{ "--i": i } as CSSProperties}
        >
          {ch === " " ? "\u00A0" : ch}
        </span>
      ))}
      <span
        className="marquee-char marquee-heart"
        style={{ "--i": chars.length } as CSSProperties}
      >
        <Heart size={13} fill="currentColor" aria-hidden="true" />
      </span>
    </span>
  );
}

export function MarqueeBanner() {
  return (
    <div className="marquee" role="note" aria-label="Built by Ubaid with love">
      <div className="marquee-track">
        <Chunk idPrefix="a" />
        <Chunk idPrefix="b" />
      </div>
    </div>
  );
}
