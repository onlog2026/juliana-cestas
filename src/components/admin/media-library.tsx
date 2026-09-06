"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Check, Copy, Loader2, Pencil, Search, Trash2, TriangleAlert, Upload, Video, X } from "lucide-react";
import {
  atualizarMidia,
  conferirUsoDaMidia,
  enviarParaGaleria,
  excluirMidia,
} from "@/modules/media/library-actions";
import type { MediaItem } from "@/modules/media/library";

/**
 * GALERIA — a biblioteca de fotos e vídeos da loja.
 *
 * A parte que mais importa desta tela não é a grade: é o que acontece ao clicar
 * na lixeira. Antes de apagar qualquer coisa, a tela pergunta ao servidor onde
 * aquele arquivo está sendo usado e mostra a lista -- e mostra também o que ela
 * NÃO conseguiu conferir, para a lojista não ler "não está em uso" como se
 * fosse uma garantia que ninguém pode dar.
 */
export function MediaLibrary({ items: initialItems }: { items: MediaItem[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [busca, setBusca] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [copiadoId, setCopiadoId] = useState<string | null>(null);
  const [editando, setEditando] = useState<MediaItem | null>(null);
  const [confirmando, setConfirmando] = useState<{
    item: MediaItem;
    usos: string[];
    naoVerificados: string[];
  } | null>(null);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return items;
    return items.filter((item) =>
      [item.title, item.alt, item.url].some((campo) => (campo ?? "").toLowerCase().includes(termo))
    );
  }, [items, busca]);

  function enviarArquivo(arquivo: File | undefined) {
    if (!arquivo) return;
    setErro(null);
    const formData = new FormData();
    formData.set("file", arquivo);
    startTransition(async () => {
      const resultado = await enviarParaGaleria(formData);
      if (!resultado.ok) {
        setErro(resultado.error);
        return;
      }
      router.refresh();
    });
  }

  async function copiarEndereco(item: MediaItem) {
    try {
      await navigator.clipboard.writeText(item.url);
      setCopiadoId(item.id);
      window.setTimeout(() => setCopiadoId(null), 2000);
    } catch {
      setErro("Não consegui copiar sozinho. Selecione o endereço no campo abaixo da foto e copie na mão.");
    }
  }

  function pedirExclusao(item: MediaItem) {
    setErro(null);
    startTransition(async () => {
      const uso = await conferirUsoDaMidia(item.id);
      if (!uso.ok) {
        setErro(uso.error);
        return;
      }
      setConfirmando({ item, usos: uso.usos, naoVerificados: uso.naoVerificados });
    });
  }

  function confirmarExclusao() {
    if (!confirmando) return;
    const alvo = confirmando.item;
    setErro(null);
    startTransition(async () => {
      const resultado = await excluirMidia({ id: alvo.id, confirmarMesmoEmUso: true });
      if (!resultado.ok) {
        setErro(resultado.error);
        return;
      }
      setConfirmando(null);
      setItems((atual) => atual.filter((i) => i.id !== alvo.id));
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por título ou descrição"
            aria-label="Buscar na galeria"
            className="h-11 w-full rounded-[10px] border border-border bg-card pl-9 pr-3 text-sm text-foreground"
          />
        </div>

        <div className="shrink-0">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/avif,video/mp4,video/webm,video/quicktime"
            className="hidden"
            onChange={(e) => {
              enviarArquivo(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={pending}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground disabled:opacity-60 sm:w-auto"
          >
            {pending ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
            {pending ? "Enviando…" : "Enviar foto ou vídeo"}
          </button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Fotos em JPG, PNG, WebP ou GIF e vídeos em MP4, WebM ou MOV. O limite por arquivo é 4 MB.
      </p>

      {erro ? <p className="text-sm text-destructive">{erro}</p> : null}

      {filtrados.length === 0 ? (
        <p className="rounded-[10px] border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          {items.length === 0
            ? "A galeria ainda está vazia. Envie a primeira foto para reaproveitá-la nos produtos e banners."
            : "Nenhum arquivo encontrado com esse texto."}
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {filtrados.map((item) => (
            <li key={item.id} className="overflow-hidden rounded-[10px] border border-border bg-card">
              <div className="relative aspect-square bg-secondary">
                {item.kind === "video" ? (
                  <div className="flex size-full flex-col items-center justify-center gap-1 text-muted-foreground">
                    <Video className="size-6" />
                    <span className="text-xs">Vídeo</span>
                  </div>
                ) : (
                  <Image
                    src={item.thumbUrl || item.url}
                    alt={item.alt ?? ""}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-cover"
                  />
                )}
              </div>

              <div className="space-y-2 p-2.5">
                <p className="truncate text-xs font-medium text-foreground" title={item.title ?? item.url}>
                  {item.title?.trim() || "Sem título"}
                </p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {item.alt?.trim() || "Sem texto alternativo"}
                </p>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => copiarEndereco(item)}
                    aria-label="Copiar o endereço da imagem"
                    className="flex h-8 flex-1 items-center justify-center gap-1 rounded-full border border-border text-[11px] font-medium text-foreground hover:bg-accent"
                  >
                    {copiadoId === item.id ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                    {copiadoId === item.id ? "Copiado" : "Copiar"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditando(item)}
                    aria-label={`Editar ${item.title ?? "arquivo"}`}
                    className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-accent"
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => pedirExclusao(item)}
                    disabled={pending}
                    aria-label={`Apagar ${item.title ?? "arquivo"}`}
                    className="flex size-8 shrink-0 items-center justify-center rounded-full text-destructive hover:bg-destructive/10 disabled:opacity-40"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editando ? (
        <EditarMidia
          item={editando}
          onFechar={() => setEditando(null)}
          onSalvo={() => {
            setEditando(null);
            router.refresh();
          }}
        />
      ) : null}

      {confirmando ? (
        <div className="rounded-[10px] border border-destructive/40 bg-destructive/5 p-4">
          <p className="flex items-start gap-2 text-sm font-medium text-foreground">
            <TriangleAlert className="mt-0.5 size-4 shrink-0 text-destructive" />
            Apagar &ldquo;{confirmando.item.title?.trim() || "este arquivo"}&rdquo;?
          </p>

          {confirmando.usos.length > 0 ? (
            <div className="mt-3">
              <p className="text-sm text-foreground">
                Este arquivo está sendo usado agora. Se você apagar, estes lugares vão ficar sem a imagem no
                site:
              </p>
              <ul className="mt-1.5 list-disc space-y-0.5 pl-5 text-sm text-foreground">
                {confirmando.usos.map((uso) => (
                  <li key={uso}>{uso}</li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="mt-3 text-sm text-foreground">
              Não encontrei nenhum produto, banner, categoria ou marca usando este arquivo.
            </p>
          )}

          <div className="mt-3">
            <p className="text-xs font-medium text-muted-foreground">O que eu não consegui conferir:</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-5 text-xs text-muted-foreground">
              {confirmando.naoVerificados.map((lugar) => (
                <li key={lugar}>{lugar}</li>
              ))}
            </ul>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={confirmarExclusao}
              disabled={pending}
              className="flex h-11 items-center gap-2 rounded-full bg-destructive px-6 text-sm font-semibold text-white disabled:opacity-60"
            >
              {pending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
              Apagar mesmo assim
            </button>
            <button
              type="button"
              onClick={() => setConfirmando(null)}
              className="flex h-11 items-center gap-2 rounded-full border border-border px-6 text-sm font-medium text-foreground hover:bg-accent"
            >
              <X className="size-4" /> Cancelar
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function EditarMidia({
  item,
  onFechar,
  onSalvo,
}: {
  item: MediaItem;
  onFechar: () => void;
  onSalvo: () => void;
}) {
  const [title, setTitle] = useState(item.title ?? "");
  const [alt, setAlt] = useState(item.alt ?? "");
  const [erro, setErro] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    startTransition(async () => {
      const resultado = await atualizarMidia({ id: item.id, title, alt });
      if (!resultado.ok) {
        setErro(resultado.error);
        return;
      }
      onSalvo();
    });
  }

  return (
    <form onSubmit={enviar} className="space-y-4 rounded-[10px] border border-border bg-card p-4">
      <p className="text-sm font-medium text-foreground">Editar arquivo</p>

      <div>
        <label htmlFor="midia-titulo" className="mb-1.5 block text-sm font-medium text-foreground">
          Título
        </label>
        <input
          id="midia-titulo"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex.: Cesta café da manhã na varanda"
          className="h-11 w-full rounded-[10px] border border-border bg-background px-3 text-sm text-foreground"
        />
        <p className="mt-1 text-xs text-muted-foreground">Serve só para você achar o arquivo depois.</p>
      </div>

      <div>
        <label htmlFor="midia-alt" className="mb-1.5 block text-sm font-medium text-foreground">
          Texto alternativo
        </label>
        <input
          id="midia-alt"
          value={alt}
          onChange={(e) => setAlt(e.target.value)}
          placeholder="Descreva a foto em poucas palavras"
          className="h-11 w-full rounded-[10px] border border-border bg-background px-3 text-sm text-foreground"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          É o que aparece quando a foto não carrega e o que o Google e os leitores de tela entendem.
        </p>
      </div>

      <div>
        <label htmlFor="midia-url" className="mb-1.5 block text-sm font-medium text-foreground">
          Endereço da imagem
        </label>
        <input
          id="midia-url"
          value={item.url}
          readOnly
          onFocus={(e) => e.currentTarget.select()}
          className="h-11 w-full rounded-[10px] border border-border bg-secondary px-3 text-sm text-muted-foreground"
        />
      </div>

      {erro ? <p className="text-sm text-destructive">{erro}</p> : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={pending}
          className="flex h-11 items-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
          Salvar
        </button>
        <button
          type="button"
          onClick={onFechar}
          className="flex h-11 items-center gap-2 rounded-full border border-border px-6 text-sm font-medium text-foreground hover:bg-accent"
        >
          <X className="size-4" /> Fechar
        </button>
      </div>
    </form>
  );
}
