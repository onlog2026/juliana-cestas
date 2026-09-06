import { Star } from "lucide-react";

/**
 * Estrelas só para LEITURA. Sem "use client" de propósito: assim serve tanto
 * na vitrine (componente de servidor) quanto dentro do carrossel (componente
 * de cliente), sem duas versões do mesmo desenho.
 *
 * A cor é `--jc-gold`, que já existe no tema — nenhuma cor nova entra por aqui.
 */
export function Stars({
  rating,
  size = "sm",
  className = "",
}: {
  rating: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const box = size === "lg" ? "size-6" : size === "md" ? "size-5" : "size-4";
  const nota = Math.max(0, Math.min(5, Math.round(rating)));

  return (
    <span
      className={`inline-flex items-center gap-0.5 ${className}`}
      role="img"
      aria-label={`${nota} de 5 estrelas`}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          aria-hidden="true"
          className={`${box} ${n <= nota ? "text-[var(--jc-gold)]" : "text-border"}`}
          fill={n <= nota ? "currentColor" : "none"}
          strokeWidth={1.5}
        />
      ))}
    </span>
  );
}
