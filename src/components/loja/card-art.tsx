import type { ReactNode } from "react";
import type { CardThemeKey } from "@/modules/cards/templates";

/**
 * Ilustrações dos cartões temáticos. SVG puro (sem imagem externa, sem JS de
 * cliente): pesa bytes, escala sem borrar e funciona igual em página de
 * servidor e de cliente. Cada tema desenha uma faixa de TOPO e uma de RODAPÉ
 * (viewBox 300x64) e, em alguns, uma marca-d'água grande atrás do texto. As
 * faixas ficam NO FLUXO do cartão -- a altura acompanha o texto, nada
 * sobrepõe a mensagem.
 */

const HEART =
  "M12 21c-4-3.2-8-6.6-8-10.6C4 7.6 6.2 5.6 8.8 5.6c1.4 0 2.7.7 3.2 1.8.5-1.1 1.8-1.8 3.2-1.8 2.6 0 4.8 2 4.8 4.8 0 4-4 7.4-8 10.6z";
const STAR = "M12 2l2.9 6.3 6.9.7-5.2 4.6 1.5 6.8L12 17l-6.1 3.4 1.5-6.8L2.2 9l6.9-.7z";

function Band({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 300 64" preserveAspectRatio="xMidYMid meet" className="block w-full" aria-hidden="true">
      {children}
    </svg>
  );
}

/** Forma de 24x24 centrada em (x,y). */
function Sh({ d, x, y, s = 1, r = 0, fill, o = 1 }: { d: string; x: number; y: number; s?: number; r?: number; fill: string; o?: number }) {
  return <path d={d} fill={fill} opacity={o} transform={`translate(${x} ${y}) rotate(${r}) scale(${s}) translate(-12 -12)`} />;
}

function Flower({ x, y, s = 1, petal, center }: { x: number; y: number; s?: number; petal: string; center: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {[0, 72, 144, 216, 288].map((a) => (
        <ellipse key={a} cx={0} cy={-6} rx={4.6} ry={6.6} fill={petal} transform={`rotate(${a})`} />
      ))}
      <circle r={3.3} fill={center} />
    </g>
  );
}

function Leaf({ x, y, r, fill = "#6fae6a", s = 1 }: { x: number; y: number; r: number; fill?: string; s?: number }) {
  return <ellipse cx={x} cy={y} rx={9 * s} ry={3.6 * s} fill={fill} transform={`rotate(${r} ${x} ${y})`} />;
}

/* ─────────────────────────────── ANIVERSÁRIO ─────────────────────────────── */

function AniversarioTop() {
  const cols = ["#e76f51", "#f4a261", "#2a9d8f", "#e9c46a", "#e76f51", "#2a9d8f", "#f4a261", "#e9c46a", "#e76f51"];
  return (
    <Band>
      <path d="M0 6 Q150 34 300 6" stroke="#9a7a4e" strokeWidth="1" fill="none" />
      {cols.map((c, i) => {
        const t = (i + 0.5) / cols.length;
        const x = 300 * t;
        const y = 6 * (1 - t) ** 2 + 68 * t * (1 - t) + 6 * t * t;
        return <path key={i} d={`M${x - 11} ${y - 1} L${x + 11} ${y - 1} L${x} ${y + 24}Z`} fill={c} />;
      })}
    </Band>
  );
}

function AniversarioBottom() {
  const balloons = [
    { x: 38, y: 26, c: "#e76f51" },
    { x: 60, y: 18, c: "#2a9d8f" },
    { x: 82, y: 28, c: "#e9c46a" },
  ];
  const confetti = [
    [150, 40, "#e76f51", 20], [175, 20, "#2a9d8f", -30], [200, 44, "#e9c46a", 45], [225, 24, "#f4a261", 10],
    [250, 46, "#e76f51", -20], [270, 18, "#2a9d8f", 35], [130, 18, "#f4a261", 50], [290, 40, "#e9c46a", -10],
  ] as const;
  return (
    <Band>
      {balloons.map((b, i) => (
        <g key={i}>
          <path d={`M${b.x} ${b.y + 14} Q${b.x + 4} ${b.y + 30} 60 60`} stroke="#9a7a4e" strokeWidth="0.8" fill="none" />
          <ellipse cx={b.x} cy={b.y} rx={11} ry={14} fill={b.c} />
          <ellipse cx={b.x - 3.5} cy={b.y - 5} rx={2.6} ry={4} fill="#fff" opacity="0.4" />
        </g>
      ))}
      {confetti.map(([x, y, c, r], i) => (
        <rect key={i} x={x} y={y} width={7} height={3.4} fill={c} transform={`rotate(${r} ${x} ${y})`} />
      ))}
    </Band>
  );
}

/* ───────────────────────────────── BODAS ─────────────────────────────────── */

function BodasTop() {
  const gold = "#c8a95a";
  return (
    <Band>
      <Sh d={STAR} x={150} y={9} s={0.6} fill={gold} />
      <circle cx={138} cy={36} r={15} fill="none" stroke={gold} strokeWidth="2.6" />
      <circle cx={162} cy={36} r={15} fill="none" stroke={gold} strokeWidth="2.6" />
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <Leaf x={112 - i * 20} y={i % 2 ? 40 : 30} r={i % 2 ? 25 : -25} fill={gold} s={0.9} />
          <Leaf x={188 + i * 20} y={i % 2 ? 40 : 30} r={i % 2 ? -25 : 25} fill={gold} s={0.9} />
        </g>
      ))}
      <path d="M30 35 H120 M180 35 H270" stroke={gold} strokeWidth="0.8" fill="none" />
    </Band>
  );
}

function BodasBottom() {
  const gold = "#c8a95a";
  return (
    <Band>
      <path d="M60 32 H132 M168 32 H240" stroke={gold} strokeWidth="1" />
      <path d="M150 24 L158 32 L150 40 L142 32Z" fill={gold} />
      <circle cx={126} cy={32} r={2} fill={gold} />
      <circle cx={174} cy={32} r={2} fill={gold} />
    </Band>
  );
}

function BodasMark() {
  return (
    <svg viewBox="0 0 100 100" className="size-3/4 max-w-[260px]" aria-hidden="true">
      <circle cx={40} cy={50} r={26} fill="none" stroke="#c8a95a" strokeWidth="3" />
      <circle cx={60} cy={50} r={26} fill="none" stroke="#c8a95a" strokeWidth="3" />
    </svg>
  );
}

/* ────────────────────────────────── NATAL ────────────────────────────────── */

function NatalTop() {
  return (
    <Band>
      <defs>
        <pattern id="jc-candy" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="6" height="12" fill="#c0392b" />
          <rect x="6" width="6" height="12" fill="#f7f3ea" />
        </pattern>
      </defs>
      <rect x="0" y="0" width="300" height="10" fill="url(#jc-candy)" />
      {[
        { x: 48, l: 24, r: 8, c: "#c0392b" },
        { x: 108, l: 12, r: 7, c: "#e9c46a" },
        { x: 192, l: 20, r: 8, c: "#e9c46a" },
        { x: 252, l: 32, r: 9, c: "#c0392b" },
      ].map((o, i) => (
        <g key={i}>
          <line x1={o.x} y1={10} x2={o.x} y2={10 + o.l} stroke="#e9d9a6" strokeWidth="0.8" />
          <rect x={o.x - 3} y={10 + o.l} width={6} height={4} fill="#d9b45a" />
          <circle cx={o.x} cy={10 + o.l + 4 + o.r} r={o.r} fill={o.c} />
          <circle cx={o.x - o.r / 3} cy={10 + o.l + 4 + o.r - o.r / 3} r={o.r / 4} fill="#fff" opacity="0.5" />
        </g>
      ))}
      <Sh d={STAR} x={150} y={26} s={1.1} fill="#f0c75e" />
    </Band>
  );
}

function NatalBottom() {
  const tree = (x: number, h: number, c1: string, c2: string) => (
    <g key={x}>
      <path d={`M${x - 15} 54 L${x} ${54 - h} L${x + 15} 54Z`} fill={c1} />
      <path d={`M${x - 11} ${54 - h * 0.45} L${x} ${54 - h * 1.05} L${x + 11} ${54 - h * 0.45}Z`} fill={c2} />
    </g>
  );
  return (
    <Band>
      {tree(40, 30, "#1f6b4a", "#2f8a5e")}
      {tree(110, 38, "#2f8a5e", "#3fa070")}
      {tree(180, 32, "#1f6b4a", "#2f8a5e")}
      {tree(250, 36, "#2f8a5e", "#3fa070")}
      <Sh d={STAR} x={110} y={12} s={0.55} fill="#f0c75e" />
      <path d="M0 64 V52 Q30 44 60 52 T120 52 T180 52 T240 52 T300 52 V64Z" fill="#f7f3ea" opacity="0.95" />
    </Band>
  );
}

/* ────────────────────────────────── PÁSCOA ───────────────────────────────── */

function PascoaTop() {
  return (
    <Band>
      <ellipse cx={128} cy={26} rx={8} ry={22} fill="#fff" stroke="#d9c6ef" strokeWidth="1" transform="rotate(-8 128 26)" />
      <ellipse cx={128} cy={27} rx={3.6} ry={15} fill="#f7c6d9" transform="rotate(-8 128 26)" />
      <ellipse cx={172} cy={26} rx={8} ry={22} fill="#fff" stroke="#d9c6ef" strokeWidth="1" transform="rotate(8 172 26)" />
      <ellipse cx={172} cy={27} rx={3.6} ry={15} fill="#f7c6d9" transform="rotate(8 172 26)" />
      <circle cx={150} cy={64} r={24} fill="#fff" stroke="#d9c6ef" strokeWidth="1" />
      <circle cx={142} cy={54} r={2.2} fill="#5b4870" />
      <circle cx={158} cy={54} r={2.2} fill="#5b4870" />
      <ellipse cx={150} cy={60} rx={3} ry={2.2} fill="#f0a3bd" />
      {[40, 80, 220, 260].map((x, i) => (
        <g key={x}>
          <Flower x={x} y={i % 2 ? 40 : 30} s={0.8} petal={["#f7c6d9", "#fff0a8", "#c9e4f7", "#e4d1f7"][i]} center="#f5b942" />
          <Leaf x={x + (x < 150 ? 14 : -14)} y={i % 2 ? 44 : 34} r={x < 150 ? 20 : -20} s={0.8} />
        </g>
      ))}
    </Band>
  );
}

function PascoaBottom() {
  const eggs = [
    [40, "#f7c6d9"], [95, "#c9e4f7"], [150, "#fff0a8"], [205, "#d5f0c8"], [260, "#e4d1f7"],
  ] as const;
  return (
    <Band>
      <path d="M0 64 V50 Q25 42 50 50 T100 50 T150 50 T200 50 T250 50 T300 50 V64Z" fill="#bfe3b4" />
      {eggs.map(([x, c], i) => (
        <g key={x} transform={`rotate(${i % 2 ? 8 : -8} ${x} 40)`}>
          <ellipse cx={x} cy={40} rx={13} ry={17} fill={c} />
          <path d={`M${x - 12.5} 36 l4 -4 l4 4 l4 -4 l4 4 l4 -4 l4 4`} fill="none" stroke="#fff" strokeWidth="2" opacity="0.85" />
          <circle cx={x - 5} cy={45} r={1.6} fill="#fff" opacity="0.85" />
          <circle cx={x + 5} cy={46} r={1.6} fill="#fff" opacity="0.85" />
        </g>
      ))}
    </Band>
  );
}

/* ─────────────────────────────────── MÃES ────────────────────────────────── */

function MaesTop() {
  const pts = [28, 78, 128, 178, 228, 274];
  return (
    <Band>
      <path d="M0 30 Q40 14 80 30 T160 30 T240 30 T300 30" stroke="#6fae6a" strokeWidth="1.6" fill="none" />
      {pts.map((x, i) => {
        const y = i % 2 ? 22 : 36;
        return (
          <g key={x}>
            <Leaf x={x + 22} y={y + (i % 2 ? 8 : -8)} r={i % 2 ? 30 : -30} />
            <Flower x={x} y={y} s={i % 3 === 0 ? 1.15 : 0.9} petal={["#f28aa5", "#f7b3c4", "#e86a8d"][i % 3]} center="#f5c542" />
          </g>
        );
      })}
    </Band>
  );
}

function MaesBottom() {
  return (
    <Band>
      <Leaf x={222} y={44} r={-35} s={1.2} />
      <Leaf x={276} y={44} r={35} s={1.2} />
      <Flower x={232} y={36} s={1.3} petal="#f28aa5" center="#f5c542" />
      <Flower x={252} y={26} s={1.6} petal="#e86a8d" center="#f5c542" />
      <Flower x={272} y={38} s={1.2} petal="#f7b3c4" center="#f5c542" />
      <Sh d={HEART} x={40} y={38} s={0.9} fill="#f28aa5" o={0.8} />
      <Sh d={HEART} x={62} y={26} s={0.55} fill="#e86a8d" o={0.8} />
      <Sh d={HEART} x={78} y={42} s={0.5} fill="#f7b3c4" />
    </Band>
  );
}

function MaesMark() {
  return (
    <svg viewBox="-30 -30 60 60" className="size-3/4 max-w-[260px]" aria-hidden="true">
      {[0, 72, 144, 216, 288].map((a) => (
        <ellipse key={a} cx={0} cy={-13} rx={9} ry={13} fill="#e86a8d" transform={`rotate(${a})`} />
      ))}
      <circle r={6.5} fill="#f5c542" />
    </svg>
  );
}

/* ─────────────────────────────────── PAIS ────────────────────────────────── */

function PaisTop() {
  return (
    <Band>
      <rect x="0" y="0" width="300" height="14" fill="#22384f" />
      {Array.from({ length: 50 }).map((_, i) => (
        <line key={i} x1={i * 6 + 3} y1={0} x2={i * 6 + 3} y2={14} stroke="#fff" strokeOpacity="0.22" strokeWidth="0.8" />
      ))}
      <path d="M144 14 H156 L154 22 H146Z" fill="#1a2c40" />
      <path d="M146 22 H154 L160 54 L150 62 L140 54Z" fill="#22384f" />
      {[30, 38, 46, 54].map((y) => (
        <path key={y} d={`M${146 - (y - 22) * 0.18} ${y} L${154 + (y - 22) * 0.18} ${y - 6}`} stroke="#d9b45a" strokeWidth="1.2" />
      ))}
    </Band>
  );
}

function PaisBottom() {
  return (
    <Band>
      <path d="M40 32 H108 M192 32 H260" stroke="#22384f" strokeWidth="1" />
      <path d="M150 26 C138 16 118 22 112 34 C124 32 134 34 150 40 C166 34 176 32 188 34 C182 22 162 16 150 26Z" fill="#3b2a20" />
      <Sh d={STAR} x={98} y={32} s={0.5} fill="#22384f" />
      <Sh d={STAR} x={202} y={32} s={0.5} fill="#22384f" />
    </Band>
  );
}

/* ────────────────────────────────── FILHOS ───────────────────────────────── */

function FilhosTop() {
  const arcs = [
    [50, "#ef5b5b"], [44, "#f5a04a"], [38, "#f5d84a"], [32, "#6cc276"], [26, "#5aa9e6"],
  ] as const;
  const cloud = (x: number) => (
    <g key={x}>
      <circle cx={x - 12} cy={58} r={8} fill="#fff" />
      <circle cx={x} cy={54} r={11} fill="#fff" />
      <circle cx={x + 13} cy={58} r={8} fill="#fff" />
      <rect x={x - 20} y={58} width={41} height={6} fill="#fff" />
    </g>
  );
  return (
    <Band>
      {arcs.map(([r, c]) => (
        <path key={r} d={`M${150 - r} 64 A${r} ${r} 0 0 1 ${150 + r} 64`} fill="none" stroke={c} strokeWidth="6" />
      ))}
      {cloud(98)}
      {cloud(202)}
      <Sh d={STAR} x={30} y={22} s={0.7} fill="#f5d84a" r={-15} />
      <Sh d={STAR} x={262} y={18} s={0.9} fill="#f5a04a" r={12} />
      <Sh d={HEART} x={60} y={40} s={0.5} fill="#ef5b5b" />
      <Sh d={STAR} x={274} y={46} s={0.5} fill="#5aa9e6" />
    </Band>
  );
}

function FilhosBottom() {
  const cols = ["#ef5b5b", "#f5a04a", "#f5d84a", "#6cc276", "#5aa9e6", "#b58be0"];
  return (
    <Band>
      {Array.from({ length: 12 }).map((_, i) => {
        const x = 18 + i * 24;
        const y = 22 + ((i * 7) % 3) * 11;
        const c = cols[i % cols.length];
        return i % 3 === 0 ? (
          <Sh key={i} d={HEART} x={x} y={y} s={0.7} fill={c} r={(i % 2 ? 1 : -1) * 12} />
        ) : i % 3 === 1 ? (
          <Sh key={i} d={STAR} x={x} y={y} s={0.75} fill={c} r={(i % 2 ? 1 : -1) * 10} />
        ) : (
          <circle key={i} cx={x} cy={y} r={4} fill={c} />
        );
      })}
    </Band>
  );
}

/* ───────────────────────────────── RÉVEILLON ─────────────────────────────── */

function Burst({ cx, cy, r, color, n = 12 }: { cx: number; cy: number; r: number; color: string; n?: number }) {
  return (
    <g>
      {Array.from({ length: n }).map((_, i) => {
        const a = (i / n) * Math.PI * 2;
        const x1 = cx + Math.cos(a) * (r * 0.35);
        const y1 = cy + Math.sin(a) * (r * 0.35);
        const x2 = cx + Math.cos(a) * r;
        const y2 = cy + Math.sin(a) * r;
        return (
          <g key={i}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="1.3" strokeLinecap="round" />
            <circle cx={x2 + Math.cos(a) * 3} cy={y2 + Math.sin(a) * 3} r={1.6} fill={color} />
          </g>
        );
      })}
    </g>
  );
}

function ReveillonTop() {
  return (
    <Band>
      <Burst cx={58} cy={30} r={22} color="#f2cf75" />
      <Burst cx={150} cy={26} r={26} color="#e7b0e8" n={14} />
      <Burst cx={244} cy={32} r={20} color="#f2cf75" n={10} />
      <Sh d={STAR} x={104} y={14} s={0.5} fill="#fff" o={0.9} />
      <Sh d={STAR} x={200} y={12} s={0.4} fill="#fff" o={0.9} />
      <Sh d={STAR} x={22} y={52} s={0.4} fill="#f2cf75" />
      <Sh d={STAR} x={280} y={52} s={0.45} fill="#f2cf75" />
    </Band>
  );
}

function ReveillonBottom() {
  const flute = (rot: number, x: number) => (
    <g transform={`translate(${x} 58) rotate(${rot})`}>
      <path d="M-7 -44 L7 -44 L4.5 -18 Q0 -12 -4.5 -18Z" fill="#f2cf75" fillOpacity="0.28" stroke="#f2cf75" strokeWidth="1.2" />
      <line x1={0} y1={-13} x2={0} y2={-2} stroke="#f2cf75" strokeWidth="1.4" />
      <ellipse cx={0} cy={0} rx={7} ry={1.8} fill="#f2cf75" />
    </g>
  );
  const dots = [[132, 12, 1.6], [150, 6, 1.2], [168, 12, 1.8], [141, 20, 1], [160, 21, 1.3]] as const;
  return (
    <Band>
      {flute(-16, 138)}
      {flute(16, 162)}
      {dots.map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill="#fff" opacity="0.8" />
      ))}
      {[[40, 30, 25], [70, 48, -20], [232, 26, 40], [264, 46, -30], [98, 22, 10], [204, 44, 15]].map(([x, y, r], i) => (
        <rect key={i} x={x} y={y} width={6} height={3} fill="#f2cf75" transform={`rotate(${r} ${x} ${y})`} />
      ))}
    </Band>
  );
}

/* ─────────────────────────────────── NAMORADOS ───────────────────────────── */

function NamoradosTop() {
  const hearts = [
    [30, "#e05a74", 0.9], [66, "#f28aa5", 0.7], [102, "#c0364d", 1], [138, "#f28aa5", 0.75],
    [174, "#e05a74", 0.95], [210, "#c0364d", 0.7], [246, "#f28aa5", 0.9], [278, "#e05a74", 0.65],
  ] as const;
  return (
    <Band>
      <path d="M0 8 Q75 22 150 8 T300 8" stroke="#b5566c" strokeWidth="0.9" fill="none" />
      {hearts.map(([x, c, s], i) => {
        const y = i % 2 ? 30 : 40;
        return (
          <g key={i}>
            <line x1={x} y1={i % 2 ? 11 : 14} x2={x} y2={y - 6} stroke="#b5566c" strokeWidth="0.7" />
            <Sh d={HEART} x={x} y={y} s={s * 1.1} fill={c} r={(i % 2 ? 1 : -1) * 8} />
          </g>
        );
      })}
    </Band>
  );
}

function NamoradosBottom() {
  return (
    <Band>
      <Leaf x={126} y={44} r={-30} s={1.3} />
      <Leaf x={174} y={44} r={30} s={1.3} />
      <circle cx={150} cy={32} r={15} fill="#c0364d" />
      <path d="M150 32 m-9 0 a9 9 0 1 1 9 9" fill="none" stroke="#8f2238" strokeWidth="1.6" />
      <path d="M150 32 m-4.5 0 a4.5 4.5 0 1 1 4.5 4.5" fill="none" stroke="#8f2238" strokeWidth="1.4" />
      <Sh d={HEART} x={92} y={30} s={0.9} fill="#e05a74" r={-12} />
      <Sh d={HEART} x={112} y={44} s={0.5} fill="#f28aa5" />
      <Sh d={HEART} x={208} y={30} s={0.9} fill="#e05a74" r={12} />
      <Sh d={HEART} x={188} y={44} s={0.5} fill="#f28aa5" />
    </Band>
  );
}

function NamoradosMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-3/4 max-w-[260px]" aria-hidden="true">
      <path d={HEART} fill="#c0364d" />
    </svg>
  );
}

/* ─────────────────────────────── estilo por tema ─────────────────────────── */

export type ThemeStyle = {
  paper: string;
  border: string;
  ink: string;
  sub: string;
  greeting: string;
  align: "center" | "left";
  upper?: boolean;
  italic?: boolean;
};

export const THEME_STYLE: Record<CardThemeKey, ThemeStyle> = {
  aniversario: { paper: "linear-gradient(180deg,#fff6e6,#fde9c9)", border: "2px dashed #e0a95e", ink: "#4a3320", sub: "#9a7a4e", greeting: "#d9603b", align: "center", italic: true },
  bodas: { paper: "#fbf8f0", border: "4px double #c8a95a", ink: "#4a3f2a", sub: "#a08a52", greeting: "#a8873a", align: "center", italic: true },
  natal: { paper: "linear-gradient(180deg,#0f3d2b,#15503a)", border: "2px solid #c9a24a", ink: "#f7f1e1", sub: "#d9c48a", greeting: "#f0c75e", align: "center", italic: true },
  pascoa: { paper: "linear-gradient(180deg,#f6f0fc,#eaf6ee)", border: "2px solid #cdb8ea", ink: "#4d3b63", sub: "#8f78ad", greeting: "#8b5fbf", align: "center", italic: true },
  maes: { paper: "linear-gradient(160deg,#fff0f2,#fde3e8)", border: "2px solid #f0b5c1", ink: "#5c2a3a", sub: "#b0647a", greeting: "#c4456a", align: "left", italic: true },
  pais: { paper: "#eadcc2", border: "2px solid #22384f", ink: "#22384f", sub: "#6b5a3e", greeting: "#22384f", align: "left", upper: true },
  filhos: { paper: "linear-gradient(180deg,#eef8ff,#fffbea)", border: "3px dotted #7cc4f0", ink: "#2f4a63", sub: "#6d90ad", greeting: "#e8743b", align: "center" },
  reveillon: { paper: "linear-gradient(180deg,#0a0f2e,#1a1547)", border: "1px solid #d9b45a", ink: "#f6ecd0", sub: "#c9b070", greeting: "#f2cf75", align: "center", upper: true },
  namorados: { paper: "linear-gradient(180deg,#fff0f2,#fbdde3)", border: "2px solid #e9a0b0", ink: "#6a1f33", sub: "#b5566c", greeting: "#c0364d", align: "center", italic: true },
};

export const THEME_ART: Record<CardThemeKey, { Top: () => ReactNode; Bottom: () => ReactNode; Mark?: () => ReactNode }> = {
  aniversario: { Top: AniversarioTop, Bottom: AniversarioBottom },
  bodas: { Top: BodasTop, Bottom: BodasBottom, Mark: BodasMark },
  natal: { Top: NatalTop, Bottom: NatalBottom },
  pascoa: { Top: PascoaTop, Bottom: PascoaBottom },
  maes: { Top: MaesTop, Bottom: MaesBottom, Mark: MaesMark },
  pais: { Top: PaisTop, Bottom: PaisBottom },
  filhos: { Top: FilhosTop, Bottom: FilhosBottom },
  reveillon: { Top: ReveillonTop, Bottom: ReveillonBottom },
  namorados: { Top: NamoradosTop, Bottom: NamoradosBottom, Mark: NamoradosMark },
};
