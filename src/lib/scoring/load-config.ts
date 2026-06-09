import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
import { scoringConfigSchema, type ScoringConfig } from "./config-schema";

const CONFIG_PATH = join(process.cwd(), "config", "scoring.yaml");

let cached: ScoringConfig | null = null;

/**
 * Lê e valida o config/scoring.yaml. Server-only (usa fs).
 * Resultado fica em cache no processo; um deploy novo recarrega.
 * Lança erro descritivo se o YAML estiver inválido — falha no boot,
 * não silenciosamente no cálculo.
 */
export function loadScoringConfig(): ScoringConfig {
  if (cached) return cached;

  const raw = readFileSync(CONFIG_PATH, "utf8");
  const parsed = parse(raw);
  const result = scoringConfigSchema.safeParse(parsed);

  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(`config/scoring.yaml inválido:\n${issues}`);
  }

  cached = result.data;
  return cached;
}
