// Remove o ambiente de teste: jogos 901-940, palpites neles e os bots.
// Uso: SUPABASE_DB_PASSWORD=... SVC_KEY=... node scripts/cleanup-test.mjs
import pg from "pg";

const REF = "yvarqzeoefehrodcxpui";
const URL = `https://${REF}.supabase.co`;
const SVC = process.env.SVC_KEY;
const PASS = process.env.SUPABASE_DB_PASSWORD;
if (!SVC || !PASS) throw new Error("faltam SVC_KEY e/ou SUPABASE_DB_PASSWORD");

const c = new pg.Client({
  host: `db.${REF}.supabase.co`, port: 5432, user: "postgres",
  password: PASS, database: "postgres", ssl: { rejectUnauthorized: false },
});
await c.connect();

await c.query("delete from palpites where jogo_id between 901 and 940");
await c.query("delete from jogos where id between 901 and 940");
console.log("OK: jogos 901-940 e seus palpites removidos.");

// Remove os bots (auth.users). O cascade limpa participantes + palpites restantes.
const { rows } = await c.query(
  "select id, email from participantes where email like '%bolaoteste@example.com'",
);
for (const row of rows) {
  await fetch(`${URL}/auth/v1/admin/users/${row.id}`, {
    method: "DELETE",
    headers: { apikey: SVC, Authorization: `Bearer ${SVC}` },
  });
  console.log("bot removido:", row.email);
}

await c.end();
console.log("\nAmbiente de teste limpo. Os 104 jogos reais permanecem intactos.");
