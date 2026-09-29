import Script from "next/script";

/** ID do contêiner do Tag Manager da loja (não é segredo). A variável, se existir, tem prioridade. */
const DEFAULT_GTM_ID = "GTM-MSP4DBHM";

function gtmId(): string | null {
  const id = process.env.NEXT_PUBLIC_GTM_ID || DEFAULT_GTM_ID;
  return /^GTM-[A-Z0-9]{4,}$/.test(id) ? id : null;
}

/** Script do Tag Manager (vai no <head> via next/script, depois de a página ficar interativa). */
export function GoogleTagManager() {
  const id = gtmId();
  if (!id) return null;
  return (
    <Script id="gtm-init" strategy="afterInteractive">
      {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${id}');`}
    </Script>
  );
}

/** Versão sem JavaScript (logo depois de abrir o <body>). */
export function GoogleTagManagerNoScript() {
  const id = gtmId();
  if (!id) return null;
  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${id}`}
        height="0"
        width="0"
        style={{ display: "none", visibility: "hidden" }}
        title="Google Tag Manager"
      />
    </noscript>
  );
}
