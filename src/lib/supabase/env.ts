import { z } from "zod";

/**
 * Variáveis de ambiente do Supabase, validadas. Importar daqui em vez de ler
 * process.env solto — falha cedo e com mensagem clara se faltar configurar.
 */
const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

const parsed = envSchema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});

if (!parsed.success) {
  throw new Error(
    "Variáveis do Supabase ausentes ou inválidas. Copie .env.example para .env.local e preencha.",
  );
}

export const supabaseEnv = parsed.data;
