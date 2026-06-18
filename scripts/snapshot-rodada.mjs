// Congela um retrato da 1ª rodada da fase de grupos (jogos #1–24) num JSON.
//
// O report da rodada é um RETRATO FIXO: os números não podem mudar quando a 2ª
// rodada começar. Por isso lemos o banco uma única vez aqui e gravamos tudo cru
// em src/lib/report/rodada-1.snapshot.json (commitado). A página só renderiza
// esse JSON — não toca o banco.
//
// Uso: node scripts/snapshot-rodada.mjs
// Requer: NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY no .env.local.
// (anon key basta: jogos/participantes são públicos e os palpites desta rodada
//  já estão liberados publicamente após o apito de cada jogo.)
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const ULTIMO_JOGO_RODADA = 24; // jogos 1–24 = 1ª partida de cada uma das 48 seleções
const OUT = "src/lib/report/rodada-1.snapshot.json";

const env = readFileSync(".env.local", "utf8");
const readEnv = (key) => (env.match(new RegExp(`^${key}=(.*)$`, "m")) || [])[1]?.trim();

const url = readEnv("NEXT_PUBLIC_SUPABASE_URL");
const anon = readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
if (!url || !anon) {
  console.error("falta NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY no .env.local");
  process.exit(1);
}

const sb = createClient(url, anon);

const [participantes, jogos, palpites, logs] = await Promise.all([
  sb.from("participantes").select("id, nome, nickname, bloqueado"),
  sb
    .from("jogos")
    .select("id, fase, grupo, inicio, mandante, visitante, gols_mandante, gols_visitante")
    .lte("id", ULTIMO_JOGO_RODADA)
    .order("id"),
  sb
    .from("palpites")
    .select("participante_id, jogo_id, gols_mandante, gols_visitante")
    .lte("jogo_id", ULTIMO_JOGO_RODADA),
  sb
    .from("palpites_log")
    .select("participante_id, jogo_id, gols_mandante, gols_visitante, criado_em")
    .lte("jogo_id", ULTIMO_JOGO_RODADA),
]);

for (const [nome, res] of [
  ["participantes", participantes],
  ["jogos", jogos],
  ["palpites", palpites],
  ["palpites_log", logs],
]) {
  if (res.error) {
    console.error(`erro ao ler ${nome}:`, res.error.message);
    process.exit(1);
  }
}

const encerrados = (jogos.data ?? []).filter(
  (j) => j.gols_mandante !== null && j.gols_visitante !== null,
);
if (encerrados.length !== (jogos.data ?? []).length) {
  console.warn(
    `aviso: ${(jogos.data ?? []).length - encerrados.length} jogo(s) da rodada ainda sem placar.`,
  );
}

// Preserva comentários do Craque Neto já escritos num snapshot anterior, para
// não perdê-los ao re-rodar o script (os dados mudam pouco depois de encerrada
// a rodada, mas os textos são feitos à mão).
let comentarios = {};
if (existsSync(OUT)) {
  try {
    comentarios = JSON.parse(readFileSync(OUT, "utf8")).comentarios ?? {};
  } catch {
    // snapshot anterior ilegível — começa do zero
  }
}

const snapshot = {
  rodada: 1,
  ultimoJogo: ULTIMO_JOGO_RODADA,
  geradoEm: new Date().toISOString(),
  participantes: participantes.data ?? [],
  jogos: jogos.data ?? [],
  palpites: palpites.data ?? [],
  logs: logs.data ?? [],
  comentarios, // { [participanteId]: string } — preenchido à mão
};

writeFileSync(OUT, `${JSON.stringify(snapshot, null, 2)}\n`);

console.log(`OK: ${OUT}`);
console.log(
  `  ${snapshot.jogos.length} jogos · ${snapshot.participantes.length} participantes · ` +
    `${snapshot.palpites.length} palpites · ${snapshot.logs.length} logs · ` +
    `${Object.keys(comentarios).length} comentários preservados`,
);
