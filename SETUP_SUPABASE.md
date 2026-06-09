# Setup do Supabase (nuvem)

Passos para conectar o app a um projeto Supabase real. Custo R$ 0 (free tier).

## 1. Criar o projeto (você)
1. Acesse https://supabase.com → *Start your project* → login (GitHub ou email).
2. *New project*:
   - Name: `bolao-copa-26`
   - Database Password: **escolha uma senha forte e guarde** (cofre/anotação).
   - Region: *South America (São Paulo)*.
3. Aguarde ~2 min o provisionamento.
4. Em **Settings → API**, copie:
   - **Project URL** → vai em `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → vai em `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Cole esses dois valores no chat (ou direto no `.env.local`).

## 2. Aplicar o schema (Claude faz, ou você)
- Abra **SQL Editor** no painel → *New query* → cole o conteúdo de
  `supabase/migrations/0001_init.sql` → *Run*.
- Isso cria as tabelas (`participantes`, `jogos`, `palpites`, `palpites_bonus`),
  os enums e as políticas de segurança (RLS).

## 3. Configurar o Auth (você, no painel)
- **Authentication → URL Configuration**:
  - Site URL: `http://localhost:3000` (dev) e depois a URL do Vercel (prod).
  - Redirect URLs: adicione `http://localhost:3000/auth/callback` e a de produção.
- **Authentication → Providers → Email**: deixe *Email* habilitado (magic link já
  vem ligado). O free tier envia emails de teste; para volume/branding, plugar
  um SMTP depois (ex.: Resend).

## 4. Cadastrar os 12 participantes
Como o bolão é fechado, cada email precisa existir em `auth.users` E em
`participantes`. Duas opções:
- **Simples:** cada amigo faz login uma vez (magic link cria o `auth.users`);
  depois rodamos um INSERT ligando o id ao nome em `participantes`.
- **Pré-cadastro:** convidar os 12 emails em *Authentication → Users → Invite*,
  e popular `participantes` com nome+email.

## 5. Preencher .env.local e regerar tipos
```
NEXT_PUBLIC_SUPABASE_URL=<sua url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<sua anon key>
```
Depois (opcional, melhora a type-safety):
```
npx supabase gen types typescript --project-id <ref> > src/lib/supabase/database.types.ts
```

## 6. Semear os jogos
```
npm run seed
```
(Usa a Service Role key — ver `scripts/seed.ts`.)
