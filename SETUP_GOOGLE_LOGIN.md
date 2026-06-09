# Setup do login com Google (OAuth)

Passo manual (~10 min) — exige seu login no Google Cloud e no painel Supabase.
O código do app já está pronto com os dois botões (Google + magic link).

## Parte 1 — Google Cloud Console

1. Acesse https://console.cloud.google.com → faça login.
2. No topo, crie um projeto (ex.: `bolao-copa-26`) ou use um existente.
3. Menu → **APIs & Services → OAuth consent screen**:
   - User Type: **External** → Create.
   - Preencha só o obrigatório: App name (`Bolão Copa 26`), email de suporte, email do dev.
   - Em *Audience/Test users*: como ficará em modo "Testing", **adicione os 12 emails
     dos amigos** como test users (senão só você consegue entrar). Salve.
4. Menu → **APIs & Services → Credentials → + Create Credentials → OAuth client ID**:
   - Application type: **Web application**.
   - Name: `bolao-web`.
   - **Authorized redirect URIs** → Add URI → cole EXATAMENTE:
     ```
     https://yvarqzeoefehrodcxpui.supabase.co/auth/v1/callback
     ```
   - Create.
5. Copie o **Client ID** e o **Client secret** que aparecem.

## Parte 2 — Supabase

1. Painel do projeto → **Authentication → Sign In / Providers** (ou *Providers*).
2. Encontre **Google** → habilite.
3. Cole o **Client ID** e o **Client Secret** do passo anterior.
4. Salve.


## Parte 3 — Avisar o Claude
Pronto. Não precisa me passar o Client ID/Secret (ficam no Supabase).
Só me diga "configurei o Google" que eu testo o fluxo de ponta a ponta.

## Observação sobre "modo Testing"
Em modo Testing o app funciona normalmente para os emails cadastrados como
test users (até 100). Para o bolão de 12 amigos, **não precisa publicar/verificar**
o app no Google — basta adicionar os emails como test users. A tela do Google
mostra um aviso de "app não verificado"; é só clicar em "Avançado → continuar".
