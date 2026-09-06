import { requireStaffWithModule } from "@/lib/auth/require-module";
import { getReviewCounts, listReviewsAdmin, type ReviewStatus } from "@/modules/reviews/service";
import { ReviewsManager } from "@/components/admin/reviews-manager";

const STATUS_VALIDOS: ReviewStatus[] = ["pendente", "aprovada", "recusada"];

function normalizarStatus(valor: string | undefined): ReviewStatus {
  return STATUS_VALIDOS.includes(valor as ReviewStatus) ? (valor as ReviewStatus) : "pendente";
}

/**
 * Painel de avaliações da lojista.
 *
 * O gate é `requireStaffWithModule("avaliacoes")`: confere sessão de staff
 * DESTA loja e o direito ao módulo no plano. Esconder o item do menu não é
 * trava — quem sabe o endereço digita `/admin/avaliacoes` e entra.
 */
export default async function AdminAvaliacoesPage(props: {
  searchParams: Promise<{ status?: string }>;
}) {
  const staff = await requireStaffWithModule("avaliacoes");
  const { status } = await props.searchParams;
  const statusAtual = normalizarStatus(status);

  const [reviews, counts] = await Promise.all([
    listReviewsAdmin(staff.tenantId, statusAtual),
    getReviewCounts(staff.tenantId),
  ]);

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-2xl text-foreground">Avaliações</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Quem recebeu a cesta recebe um convite por e-mail. A avaliação chega aqui e só aparece na
        loja depois que você aprovar.
      </p>

      <div className="mt-6">
        <ReviewsManager reviews={reviews} counts={counts} statusAtual={statusAtual} />
      </div>
    </div>
  );
}
