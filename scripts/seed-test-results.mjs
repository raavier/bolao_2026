// Popula resultados aleatórios nos jogos de TESTE (901-940) que ainda estão
// agendados. Preserva os que já foram encerrados manualmente.
// Uso: SUPABASE_DB_PASSWORD=... node scripts/seed-test-results.mjs
import pg from "pg";

const c = new pg.Client({
  host: "db.yvarqzeoefehrodcxpui.supabase.co", port: 5432, user: "postgres",
  password: process.env.SUPABASE_DB_PASSWORD, database: "postgres",
  ssl: { rejectUnauthorized: false },
});
await c.connect();

// Placar aleatório enviesado para resultados realistas (mais 0-2 que 3).
const goal = () => {
  const r = Math.random();
  if (r < 0.30) return 0;
  if (r < 0.62) return 1;
  if (r < 0.85) return 2;
  return 3;
};

const pendentes = (
  await c.query("select id from jogos where id between 901 and 940 and status <> 'encerrado' order by id")
).rows;

for (const { id } of pendentes) {
  await c.query(
    "update jogos set gols_mandante=$2, gols_visitante=$3, status='encerrado' where id=$1",
    [id, goal(), goal()],
  );
}

const total = (await c.query("select count(*) from jogos where id between 901 and 940 and status='encerrado'")).rows[0].count;
console.log(`Encerrados agora: ${pendentes.length} novos. Total de testes encerrados: ${total}/40.`);
await c.end();
