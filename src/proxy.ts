import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { resolveTenantFromHost } from "@/lib/tenant/resolve-host";
import {
  TENANT_HEADER_HOST_KIND,
  TENANT_HEADER_ID,
  TENANT_HEADER_SLUG,
} from "@/lib/tenant/context";

export async function proxy(request: NextRequest) {
  // Qual loja responde por este endereço. Resolvido ANTES de qualquer outra
  // coisa e gravado em headers -- o servidor lê daí, nunca do que o navegador
  // mandar. Como sobrescrevemos sempre (delete + set), header forjado pelo
  // cliente nunca sobrevive.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete(TENANT_HEADER_ID);
  requestHeaders.delete(TENANT_HEADER_SLUG);
  requestHeaders.delete(TENANT_HEADER_HOST_KIND);

  const tenant = resolveTenantFromHost(request.headers.get("host"));
  if (tenant) {
    requestHeaders.set(TENANT_HEADER_ID, tenant.id);
    requestHeaders.set(TENANT_HEADER_SLUG, tenant.slug);
    requestHeaders.set(TENANT_HEADER_HOST_KIND, tenant.hostKind);
  }

  let response = NextResponse.next({ request: { headers: requestHeaders } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request: { headers: requestHeaders } });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  if (path.startsWith("/admin") && path !== "/admin/login" && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    return NextResponse.redirect(url);
  }

  if (path.startsWith("/conta") && path !== "/conta/entrar" && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/conta/entrar";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/conta/:path*"],
};
