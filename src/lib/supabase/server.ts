import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseAnonKey, supabaseUrl } from "@/lib/supabase/client";

/**
 * Cliente Supabase para Server Components / Server Actions.
 * Mantém a sessão do usuário (cookies) sincronizada.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl(), supabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Chamado fora de um Server Action (ex.: Server Component de leitura).
          // Ignoramos: o middleware/proxy renova a sessão.
        }
      },
    },
  });
}
