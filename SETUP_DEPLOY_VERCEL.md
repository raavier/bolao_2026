# Deploy no Vercel (passo a passo)

Coloca o bolão no ar para os amigos acessarem de qualquer lugar. Custo R$ 0.

## Parte 1 — Criar conta e importar o projeto
1. Acesse https://vercel.com → **Sign Up** → **Continue with GitHub** (usa sua conta do GitHub).
2. Autorize o Vercel a acessar seus repositórios (pode escolher só o `bolao_2026`).
3. No painel → **Add New… → Project**.
4. Encontre **raavier/bolao_2026** na lista → **Import**.
5. O Vercel detecta Next.js sozinho. **Não mude** Build/Output settings.

## Parte 2 — Variáveis de ambiente (ANTES de clicar em Deploy)
Na tela de import, abra **Environment Variables** e adicione as duas:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://yvarqzeoefehrodcxpui.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (a anon key — está no .env.local) |

Depois clique em **Deploy** e aguarde ~2 min.

## Parte 3 — Anotar a URL de produção
Ao terminar, o Vercel dá uma URL tipo `https://bolao-2026-xxxx.vercel.app`.
**Copie essa URL** e me mande — preciso dela para os passos 4 e 5.

## Parte 4 — Ajustar redirect no Supabase (eu ou você)
Painel Supabase → **Authentication → URL Configuration**:
- **Site URL**: a URL do Vercel.
- **Redirect URLs**: adicionar `https://SUA-URL.vercel.app/auth/callback`
  (mantenha também a de localhost para testes locais).

## Parte 5 — Ajustar redirect no Google
Google Cloud → **Credentials → seu OAuth client** → **Authorized redirect URIs**:
- Já tem o do Supabase (`.../auth/v1/callback`) — esse continua igual,
  NÃO muda nada aqui. O Google sempre volta pro Supabase, que volta pro app.
- Nada a fazer no Google se o redirect do Supabase já está lá. ✅

## Pronto
Acesse a URL do Vercel, entre com Google, e compartilhe o link com os 12 amigos.
Cada `git push` novo no master republica automaticamente.
