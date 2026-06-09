// Gera supabase/seed.sql a partir de scripts/fixtures.json.
// Converte o horário US Eastern (EDT, UTC-4 em jun/jul) para UTC.
// Uso: node scripts/generate-seed.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const { fixtures } = JSON.parse(
  readFileSync(join(root, "scripts", "fixtures.json"), "utf8"),
);

const EDT_OFFSET_HOURS = 4; // EDT = UTC-4 → UTC = ET + 4h

const toUtcIso = (etLocal) => {
  // etLocal: "2026-06-13T18:00" interpretado como horário ET.
  const [date, time] = etLocal.split("T");
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const utcMs = Date.UTC(year, month - 1, day, hour + EDT_OFFSET_HOURS, minute);
  return new Date(utcMs).toISOString();
};

const escape = (value) => value.replace(/'/g, "''");

if (fixtures.length !== 104) {
  throw new Error(`Esperado 104 jogos, encontrado ${fixtures.length}`);
}

const ids = new Set(fixtures.map((f) => f.id));
if (ids.size !== 104) throw new Error("IDs de jogo duplicados");

const rows = fixtures
  .map((f) => {
    const grupo = f.group === null ? "null" : `'${f.group}'`;
    return `  (${f.id}, '${f.phase}', ${grupo}, '${toUtcIso(f.et)}', '${escape(f.home)}', '${escape(f.away)}', 'agendado')`;
  })
  .join(",\n");

const sql = `-- Gerado por scripts/generate-seed.mjs — NÃO editar à mão.
-- 104 jogos da Copa 2026. inicio em UTC; o app exibe em horário de Brasília.
-- Idempotente: re-executar atualiza horários/confrontos sem duplicar.

insert into jogos (id, fase, grupo, inicio, mandante, visitante, status) values
${rows}
on conflict (id) do update set
  fase = excluded.fase,
  grupo = excluded.grupo,
  inicio = excluded.inicio,
  mandante = excluded.mandante,
  visitante = excluded.visitante;
`;

writeFileSync(join(root, "supabase", "seed.sql"), sql, "utf8");
console.log(`OK: ${fixtures.length} jogos → supabase/seed.sql`);
