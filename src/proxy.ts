import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const PUBLIC_ADMIN_PATHS = ["/admin/login"];

/** Disponibiliza o caminho atual para o layout do painel. */
function withPathname(headers: Headers, pathname: string): Headers {
  const next = new Headers(headers);
  next.set("x-pathname", pathname);
  return next;
}

/**
 * Protege o painel administrativo.
 *
 * Sem as variáveis do Supabase o app roda em modo demonstração e o painel
 * fica liberado (os dados são locais). Com o Supabase configurado, só entra
 * quem estiver autenticado.
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (!pathname.startsWith("/admin")) return NextResponse.next();
  if (PUBLIC_ADMIN_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next({
      request: { headers: withPathname(request.headers, pathname) },
    });
  }
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return NextResponse.next({
      request: { headers: withPathname(request.headers, pathname) },
    });
  }

  let response = NextResponse.next({
    request: { headers: withPathname(request.headers, pathname) },
  });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({
          request: { headers: withPathname(request.headers, pathname) },
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/admin/login";
    loginUrl.search = `?redirect=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
