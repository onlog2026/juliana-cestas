import Script from "next/script";

/** Google Analytics 4 da loja. O ID vem da configuração de CADA loja (não é segredo: aparece no código de qualquer site). */
export function GoogleAnalytics({ id }: { id: string | null | undefined }) {
  // Sem ID válido (G-XXXX), não injeta nada quebrado.
  if (!id || !/^G-[A-Z0-9]{6,}$/.test(id)) return null;

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${id}`} strategy="afterInteractive" />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${id}');
        `}
      </Script>
    </>
  );
}
