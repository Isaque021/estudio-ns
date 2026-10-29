import "server-only";

import { createHash } from "node:crypto";

import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/client";

type Limit = {
  key: string;
  max: number;
  seconds: number;
};

export function limitKey(scope: string, value: string): string {
  const hash = createHash("sha256").update(value).digest("hex");
  return `${scope}:${hash}`;
}

export async function checkRequestLimits(
  limits: Limit[],
): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;

  const admin = createAdminClient();

  if (!admin) {
    return "Serviço indisponível no momento. Tente novamente mais tarde.";
  }

  const { data, error } = await admin.rpc(
    "ns_consume_request_limits",
    { p_limits: limits },
  );

  if (error || typeof data !== "boolean") {
    return "Não foi possível validar esta solicitação. Tente novamente mais tarde.";
  }

  return data
    ? null
    : "Muitas tentativas em pouco tempo. Aguarde alguns minutos antes de tentar novamente.";
}
