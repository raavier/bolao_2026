// Roda um arquivo .sql no Postgres do Supabase.
// Uso: node scripts/run-sql.mjs <caminho.sql>
// Requer env: SUPABASE_DB_PASSWORD (e opcional SUPABASE_DB_HOST).
import { readFileSync } from "node:fs";
import pg from "pg";

const sqlPath = process.argv[2];
if (!sqlPath) {
  console.error("uso: node scripts/run-sql.mjs <arquivo.sql>");
  process.exit(1);
}

const REF = "yvarqzeoefehrodcxpui";
const password = process.env.SUPABASE_DB_PASSWORD;
if (!password) {
  console.error("falta SUPABASE_DB_PASSWORD no ambiente");
  process.exit(1);
}

// Candidatos de conexão: direto (IPv6) + poolers regionais comuns (IPv4).
const candidates = process.env.SUPABASE_DB_HOST
  ? [{ host: process.env.SUPABASE_DB_HOST, port: 5432, user: "postgres" }]
  : [
      { host: `db.${REF}.supabase.co`, port: 5432, user: "postgres" },
      { host: "aws-0-sa-east-1.pooler.supabase.com", port: 5432, user: `postgres.${REF}` },
      { host: "aws-0-us-east-1.pooler.supabase.com", port: 5432, user: `postgres.${REF}` },
      { host: "aws-0-us-east-2.pooler.supabase.com", port: 5432, user: `postgres.${REF}` },
      { host: "aws-1-sa-east-1.pooler.supabase.com", port: 5432, user: `postgres.${REF}` },
    ];

const sql = readFileSync(sqlPath, "utf8");

const tryConnect = async (cfg) => {
  const client = new pg.Client({
    host: cfg.host,
    port: cfg.port,
    user: cfg.user,
    password,
    database: "postgres",
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 8000,
  });
  await client.connect();
  return client;
};

let client = null;
for (const cfg of candidates) {
  try {
    client = await tryConnect(cfg);
    console.log(`conectado: ${cfg.host} (user ${cfg.user})`);
    break;
  } catch (error) {
    console.log(`  x ${cfg.host}: ${error.code || error.message}`);
  }
}

if (!client) {
  console.error("não foi possível conectar em nenhum host.");
  process.exit(1);
}

try {
  await client.query("begin");
  await client.query(sql);
  await client.query("commit");
  console.log(`OK: ${sqlPath} aplicado.`);
} catch (error) {
  await client.query("rollback").catch(() => {});
  console.error(`ERRO ao aplicar (rollback feito): ${error.message}`);
  process.exitCode = 1;
} finally {
  await client.end();
}
