"use client";

import { useEffect, useState } from "react";
import { checkStaffSession } from "@/lib/auth/actions";
import { hasSupabaseAuthCookie } from "@/lib/auth/staff-hint";

// Uma pergunta só por carregamento de página, compartilhada: o carrossel e a
// logo do cabeçalho precisam da mesma resposta -- antes cada um fazia a sua
// (2 chamadas de server action por visita, para TODO visitante).
let inflight: Promise<boolean> | null = null;

function askServerOnce(): Promise<boolean> {
  inflight ??= checkStaffSession().catch(() => false);
  return inflight;
}

/**
 * `true` se quem está na página é da equipe (mostra "Editar banner" e o lápis da
 * logo). Só pergunta ao servidor se houver cookie de login (ver `staff-hint`);
 * visitante comum não gera chamada nenhuma. Roda depois da hidratação, então
 * não tira a home da geração estática.
 */
export function useIsStaff(): boolean {
  const [isStaff, setIsStaff] = useState(false);

  useEffect(() => {
    if (!hasSupabaseAuthCookie(document.cookie)) return;
    let active = true;
    askServerOnce().then((staff) => {
      if (active) setIsStaff(staff);
    });
    return () => {
      active = false;
    };
  }, []);

  return isStaff;
}
