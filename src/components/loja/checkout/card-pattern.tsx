import type { CardTemplate } from "@/modules/cards/templates";

// Imagem de fundo do cartãozinho: um motivo temático espalhado, visível mas
// sem brigar com o texto — "meio transparente" de verdade, não uma textura
// quase invisível. viewBox 0-100 = um sistema de coordenadas em "%", assim
// o desenho escala certo em qualquer tamanho de cartão.

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

const SCATTER = [
  { x: 8, y: 10, scale: 1.3, rotate: -14 },
  { x: 70, y: 14, scale: 0.9, rotate: 20 },
  { x: 20, y: 78, scale: 1, rotate: 8 },
  { x: 55, y: 82, scale: 0.7, rotate: -22 },
];

export function CardPattern({ template }: { template: CardTemplate }) {
  if (template.icon === "none" || !template.accentColor) return null;
  const shapePath = SHAPES[template.icon];
  if (!shapePath) return null;

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid slice"
      className="pointer-events-none absolute inset-0 size-full opacity-[0.18]"
    >
      {SCATTER.map((pos, i) => (
        <path
          key={i}
          d={shapePath}
          fill={template.accentColor}
          stroke="none"
          transform={`translate(${pos.x} ${pos.y}) scale(${pos.scale * 0.12}) rotate(${pos.rotate})`}
        />
      ))}
      {/* Motivo grande de canto, pra ler como uma ilustração de verdade */}
      <path
        d={shapePath}
        fill={template.accentColor}
        stroke="none"
        opacity="0.85"
        transform="translate(74 58) scale(1.1) rotate(-8)"
      />
    </svg>
  );
}
