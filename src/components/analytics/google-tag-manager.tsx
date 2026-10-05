import Script from "next/script";

/** Só aceita o formato GTM-XXXX: um ID inválido nunca vira código na página. */
function gtmValido(id: string | null | undefined): id is string {
  return !!id && /^GTM-[A-Z0-9]{4,}$/.test(id);
}

/** Script do Tag Manager da loja (vai no <head> via next/script, depois de a página ficar interativa). */
export function GoogleTagManager({ id }: { id: string | null | undefined }) {
  if (!gtmValido(id)) return null;
  return (
    <Script id="gtm-init" strategy="afterInteractive">
      {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${id}');`}
    </Script>
  );
}

/** Versão sem JavaScript (logo depois de abrir o conteúdo da loja). */
export function GoogleTagManagerNoScript({ id }: { id: string | null | undefined }) {
  if (!gtmValido(id)) return null;
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
