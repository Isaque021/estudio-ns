import "server-only";

import { randomBytes } from "node:crypto";

export function generateCode(prefix: string): string {
  const random = randomBytes(16).toString("hex").toUpperCase();
  return `${prefix}-${random}`;
}
