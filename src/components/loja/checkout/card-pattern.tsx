import type { CardTemplate } from "@/modules/cards/templates";

// Padrão de fundo bem sutil (semi-transparente) atrás do cartãozinho, uma
// forma pequena repetida por tema — nunca compete com o texto do cartão.

const SHAPES: Record<string, string> = {
  // coração
  heart: "M12 21c-4-3.2-8-6.6-8-10.6C4 7.6 6.2 5.6 8.8 5.6c1.4 0 2.7.7 3.2 1.8.5-1.1 1.8-1.8 3.2-1.8 2.6 0 4.8 2 4.8 4.8 0 4-4 7.4-8 10.6z",
  // folha
  leaf: "M12 3c5 1 8 5 8 10-6 1-10-2-11-7-.4-1.3-.4-2.3 0-3zM8 20c2-4 4-7 8-9",
  // brilho de 4 pontas
  sparkles: "M12 3l1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6z",
  // confete
  party: "M12 4l1.2 2.4L16 7l-2 1.8.4 2.6L12 10l-2.4 1.4.4-2.6L8 7l2.8-.6z M6 16l1 2 2 .3-1.5 1.4.3 2-1.8-1-1.8 1 .3-2L3.5 18.3l2-.3z M17 16.5l.8 1.6 1.6.2-1.2 1.1.3 1.6-1.5-.8-1.5.8.3-1.6-1.2-1.1 1.6-.2z",
  // alianças
  rings: "M9 15a3.4 3.4 0 1 0 0-6.8 3.4 3.4 0 0 0 0 6.8zM15 15a3.4 3.4 0 1 0 0-6.8 3.4 3.4 0 0 0 0 6.8z",
};

const TILE_SIZE = 64;
const POSITIONS = [
  { x: 6, y: 6, scale: 0.7, rotate: -12 },
  { x: 38, y: 20, scale: 0.5, rotate: 18 },
  { x: 16, y: 42, scale: 0.55, rotate: 6 },
];

export function CardPattern({ template }: { template: CardTemplate }) {
  if (template.icon === "none" || !template.accentColor) return null;
  const shapePath = SHAPES[template.icon];
  if (!shapePath) return null;

  const patternId = `card-pattern-${template.slug}`;

  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 size-full opacity-[0.07]"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <pattern
          id={patternId}
          width={TILE_SIZE}
          height={TILE_SIZE}
          patternUnits="userSpaceOnUse"
        >
          {POSITIONS.map((pos, i) => (
            <path
              key={i}
              d={shapePath}
              fill="none"
              stroke={template.accentColor}
              strokeWidth={1.1}
              transform={`translate(${pos.x} ${pos.y}) scale(${pos.scale}) rotate(${pos.rotate})`}
            />
          ))}
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${patternId})`} />
    </svg>
  );
}
