// Cria um ambiente de TESTE ao vivo: 40 jogos (IDs 901-940) em volta de "agora",
// 3 participantes-bot e palpites aleatórios deles. Reversível com cleanup-test.mjs.
// Uso: SUPABASE_DB_PASSWORD=... SVC_KEY=... node scripts/seed-test.mjs
import pg from "pg";

const REF = "yvarqzeoefehrodcxpui";
const URL = `https://${REF}.supabase.co`;
const SVC = process.env.SVC_KEY;
const PASS = process.env.SUPABASE_DB_PASSWORD;
if (!SVC || !PASS) throw new Error("faltam SVC_KEY e/ou SUPABASE_DB_PASSWORD");

const TEAMS = [
  "Brasil", "Argentina", "França", "Espanha", "Inglaterra", "Portugal",
  "Alemanha", "Países Baixos", "Croácia", "Uruguai", "Bélgica", "Marrocos",
  "México", "Estados Unidos", "Japão", "Senegal", "Suíça", "Escócia",
];

// Offsets em minutos a partir de agora. <0 = já começou (travado).
const OFFSETS = [
  -50, -40, -30, -20, -12, -5,                       // 6 já começaram
  2, 5, 8, 12, 16, 20, 25, 30, 40, 50,               // 10 travam logo
  65, 80, 95, 110, 130, 150, 170, 190, 210, 240,     // futuros...
  270, 300, 330, 360, 400, 440, 480, 540, 600, 660,
  720, 840, 960, 1080,
];

const GROUPS = "ABCDEFGHIJKL";
// As últimas 8 partidas viram mata-mata (para testar pesos de fase).
const KNOCKOUT = {
  33: "round_of_32", 34: "round_of_16", 35: "round_of_16", 36: "quarter_finals",
  37: "quarter_finals", 38: "semi_finals", 39: "third_place", 40: "final",
};

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randGoals = () => Math.floor(Math.random() * 4);

const c = new pg.Client({
  host: `db.${REF}.supabase.co`, port: 5432, user: "postgres",
  password: PASS, database: "postgres", ssl: { rejectUnauthorized: false },
});
await c.connect();

// 1) Jogos de teste (901-940) ------------------------------------------------
for (let i = 0; i < OFFSETS.length; i++) {
  const id = 901 + i;
  const n = i + 1;
  const phase = KNOCKOUT[n] ?? "group";
  const grupo = phase === "group" ? GROUPS[i % 12] : null;
  // pares de times distintos
  let home = pick(TEAMS), away = pick(TEAMS);
  while (away === home) away = pick(TEAMS);
  const inicioMin = OFFSETS[i];
  await c.query(
    `insert into jogos (id, fase, grupo, inicio, mandante, visitante, status)
     values ($1,$2,$3, now() + ($4 || ' minutes')::interval, $5,$6,'agendado')
     on conflict (id) do update set
       fase=excluded.fase, grupo=excluded.grupo, inicio=excluded.inicio,
       mandante=excluded.mandante, visitante=excluded.visitante,
       gols_mandante=null, gols_visitante=null, status='agendado'`,
    [id, phase, grupo, String(inicioMin), home, away],
  );
}
console.log(`OK: 40 jogos de teste (901-940) criados/atualizados.`);

// 2) Participantes-bot via Admin API (o trigger cria a linha em participantes) -
const bots = ["Teste Ana", "Teste Bruno", "Teste Carla"];
const botIds = [];
for (let i = 0; i < bots.length; i++) {
  const email = `bot${i + 1}.bolaoteste@example.com`;
  const res = await fetch(`${URL}/auth/v1/admin/users`, {
    method: "POST",
    headers: { apikey: SVC, Authorization: `Bearer ${SVC}`, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: "teste123456", email_confirm: true, user_metadata: { full_name: bots[i] } }),
  });
  const j = await res.json();
  const id = j.id || j.user?.id;
  if (id) botIds.push(id);
  else {
    // já existe: busca o id no banco
    const r = await c.query("select id from participantes where email=$1", [email]);
    if (r.rows[0]) botIds.push(r.rows[0].id);
  }
}
console.log(`OK: ${botIds.length} participantes-bot prontos.`);

// 3) Palpites aleatórios dos bots em TODOS os 40 jogos (via pg, ignora RLS) ----
let count = 0;
for (const botId of botIds) {
  for (let i = 0; i < OFFSETS.length; i++) {
    const jogoId = 901 + i;
    await c.query(
      `insert into palpites (participante_id, jogo_id, gols_mandante, gols_visitante)
       values ($1,$2,$3,$4)
       on conflict (participante_id, jogo_id) do update set
         gols_mandante=excluded.gols_mandante, gols_visitante=excluded.gols_visitante`,
      [botId, jogoId, randGoals(), randGoals()],
    );
    count++;
  }
}
console.log(`OK: ${count} palpites dos bots criados.`);

await c.end();
console.log("\nPronto. Acesse /jogos e /palpites no site para testar ao vivo.");
