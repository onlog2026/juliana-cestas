import Script from "next/script";

/** ID de medição da loja (não é segredo: aparece no código de qualquer site). A variável, se existir, tem prioridade. */
const DEFAULT_GA4_ID = "G-DP4FFX56RD";

/** Sem ID válido (G-XXXX), não injeta nada quebrado. */
export function GoogleAnalytics() {
  const id = process.env.NEXT_PUBLIC_GA4_ID || DEFAULT_GA4_ID;
  if (!/^G-[A-Z0-9]{6,}$/.test(id)) return null;

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
