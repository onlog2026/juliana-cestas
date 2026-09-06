"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowDown, ArrowUp, Check, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { contarProdutosDaMarca, excluirMarca, reordenarMarcas, salvarMarca } from "@/modules/brands/actions";
import type { Brand } from "@/modules/brands/service";

/**
 * MARCAS — mesma forma da tela de categorias (`categories-manager.tsx`), de
 * propósito: quem já sabe mexer numa sabe mexer na outra. Lista, setas para
 * ordenar, lápis para editar, lixeira para excluir, e um botão pontilhado no
 * fim para incluir.
 *
 * A diferença está na exclusão: antes de apagar, a tela pergunta ao servidor
 * quantas cestas usam a marca e diz exatamente o que vai acontecer com elas.
 */
export function BrandsManager({
  brands: initialBrands,
  productCounts,
}: {
  brands: Brand[];
  productCounts: Record<string, number>;
}) {
  const router = useRouter();
  const [brands, setBrands] = useState(initialBrands);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Mesma armadilha da tela de categorias: `router.refresh()` traz dados novos,
  // mas o estado local não se re-sincroniza sozinho -- sem isto, depois de
  // salvar a lista reaparecia com o valor ANTIGO e parecia que não salvou.
  useEffect(() => {
    setBrands(initialBrands);
  }, [initialBrands]);

  function aoSalvar() {
    setEditingId(null);
    setCreating(false);
    router.refresh();
  }

  function mover(index: number, direcao: -1 | 1) {
    const alvo = index + direcao;
    if (alvo < 0 || alvo >= brands.length) return;
    const proxima = [...brands];
    [proxima[index], proxima[alvo]] = [proxima[alvo], proxima[index]];
    setBrands(proxima);
    startTransition(async () => {
      const resultado = await reordenarMarcas(proxima.map((m) => m.id));
      if (!resultado.ok) setError(resultado.error);
    });
  }

  function excluir(marca: Brand) {
    setError(null);
    startTransition(async () => {
      const contagem = await contarProdutosDaMarca(marca.id);
      const total = contagem.ok ? contagem.total : 0;

      const aviso =
        total > 0
          ? `Excluir a marca "${marca.name}"?\n\n${total} ${total === 1 ? "cesta usa" : "cestas usam"} esta marca. ${total === 1 ? "Ela" : "Elas"} NÃO ${total === 1 ? "será apagada" : "serão apagadas"}: ${total === 1 ? "ela" : "elas"} apenas ${total === 1 ? "fica" : "ficam"} sem marca.\n\nNão dá para desfazer.`
          : `Excluir a marca "${marca.name}"? Nenhuma cesta usa esta marca hoje. Não dá para desfazer.`;

      if (!confirm(aviso)) return;

      const resultado = await excluirMarca(marca.id);
      if (!resultado.ok) {
        setError(resultado.error);
        return;
      }
      setBrands((atual) => atual.filter((m) => m.id !== marca.id));
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {brands.length === 0 && !creating ? (
        <p className="text-sm text-muted-foreground">
          Você ainda não cadastrou nenhuma marca. As marcas ajudam a organizar as cestas por fabricante ou
          fornecedor.
        </p>
      ) : null}

      {brands.map((marca, index) =>
        editingId === marca.id ? (
          <BrandForm key={marca.id} brand={marca} onSaved={aoSalvar} onCancel={() => setEditingId(null)} />
        ) : (
          <div
            key={marca.id}
            className="flex items-center gap-3 rounded-[10px] border border-border bg-background p-3"
          >
            <div className="relative size-14 shrink-0 overflow-hidden rounded-[8px] bg-secondary">
              {marca.logoUrl ? (
                <Image src={marca.logoUrl} alt="" fill sizes="56px" className="object-contain" />
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{marca.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {marca.active ? "Ativa" : "Inativa"} · {productCounts[marca.id] ?? 0}{" "}
                {(productCounts[marca.id] ?? 0) === 1 ? "cesta" : "cestas"}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => mover(index, -1)}
                disabled={index === 0 || pending}
                aria-label="Mover para cima"
                className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-accent disabled:opacity-30"
              >
                <ArrowUp className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => mover(index, 1)}
                disabled={index === brands.length - 1 || pending}
                aria-label="Mover para baixo"
                className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-accent disabled:opacity-30"
              >
                <ArrowDown className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => setEditingId(marca.id)}
                aria-label={`Editar ${marca.name}`}
                className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-accent"
              >
                <Pencil className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => excluir(marca)}
                disabled={pending}
                aria-label={`Excluir ${marca.name}`}
                className="flex size-8 items-center justify-center rounded-full text-destructive hover:bg-destructive/10 disabled:opacity-40"
              >
                {pending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
              </button>
            </div>
          </div>
        )
      )}

      {creating ? (
        <BrandForm onSaved={aoSalvar} onCancel={() => setCreating(false)} />
      ) : (
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-[10px] border border-dashed border-border text-sm font-medium text-foreground hover:bg-accent"
        >
          <Plus className="size-4" /> Nova marca
        </button>
      )}
    </div>
  );
}

function BrandForm({
  brand,
  onSaved,
  onCancel,
}: {
  brand?: Brand;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(brand?.name ?? "");
  const [slug, setSlug] = useState(brand?.slug ?? "");
  const [logoUrl, setLogoUrl] = useState(brand?.logoUrl ?? "");
  const [description, setDescription] = useState(brand?.description ?? "");
  const [active, setActive] = useState(brand?.active ?? true);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const resultado = await salvarMarca({
        id: brand?.id,
        name,
        slug,
        logoUrl,
        description,
        active,
      });
      if (!resultado.ok) {
        setError(resultado.error);
        return;
      }
      onSaved();
    });
  }

  return (
    <form
      onSubmit={enviar}
      className="space-y-4 rounded-[10px] border border-border bg-background p-4"
    >
      <div>
        <label htmlFor="marca-nome" className="mb-1.5 block text-sm font-medium text-foreground">
          Nome da marca
        </label>
        <input
          id="marca-nome"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex.: Chocolates Brasília"
          className="h-11 w-full rounded-[10px] border border-border bg-card px-3 text-sm text-foreground"
        />
      </div>

      <div>
        <label htmlFor="marca-slug" className="mb-1.5 block text-sm font-medium text-foreground">
          Link (endereço no site)
        </label>
        <input
          id="marca-slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="deixe em branco para criar a partir do nome"
          className="h-11 w-full rounded-[10px] border border-border bg-card px-3 text-sm text-foreground"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Só letras, números e hífen. Se deixar em branco, a gente monta a partir do nome.
        </p>
      </div>

      <ImageUploadField label="Logo da marca" value={logoUrl} onChange={setLogoUrl} kind="logo" />

      <div>
        <label htmlFor="marca-descricao" className="mb-1.5 block text-sm font-medium text-foreground">
          Descrição (opcional)
        </label>
        <textarea
          id="marca-descricao"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full rounded-[10px] border border-border bg-card p-3 text-sm text-foreground"
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          checked={active}
          onChange={(e) => setActive(e.target.checked)}
          className="size-4 rounded border-border"
        />
        Marca ativa (aparece no site)
      </label>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

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
          onClick={onCancel}
          className="flex h-11 items-center gap-2 rounded-full border border-border px-6 text-sm font-medium text-foreground hover:bg-accent"
        >
          <X className="size-4" /> Cancelar
        </button>
      </div>
    </form>
  );
}
