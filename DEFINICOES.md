# Bolão da Copa do Mundo 2026 — Definições do Projeto

> Documento vivo. Tudo aqui é decisão de projeto e pode ser ajustado antes da bola rolar.
> Última atualização: 2026-06-08.

## 1. Visão geral

Aplicação web para um bolão entre **12 amigos** na Copa do Mundo de 2026 (EUA, Canadá e México, **11/jun a 19/jul**).

Cada participante:
- Registra palpites de **placar** dos jogos antes de cada partida começar.
- Responde **palpites bônus** (campeão, artilheiro etc.) antes do início do torneio.
- Acompanha o **ranking ao vivo** conforme os resultados saem.

Requisitos do dono:
- Custo **R$ 0**.
- Login simplificado.
- 12 pessoas (escala pequena — simplifica muita coisa).

---

## 2. Stack e hospedagem (custo R$ 0)

### Decisão: Next.js + Supabase (deploy no Vercel)

Type-safety ponta a ponta, login pronto e banco de verdade — tudo dentro do tier gratuito para 12 pessoas.

```
[ Navegador ]  <-->  [ Next.js no Vercel ]  <-->  [ Supabase ]
   (React)          (App Router, Server Actions,    (Postgres + Auth magic link
                     Route Handlers)                  + Row Level Security)
```

| Camada | Ferramenta | Custo | Por quê |
|---|---|---|---|
| Front + backend | **Next.js (App Router)** no **Vercel** | R$ 0 | SSR, Server Actions, deploy automático via git |
| Banco de dados | **Supabase (Postgres)** | R$ 0 | Free tier folgado para 12 pessoas; SQL de verdade |
| Autenticação | **Supabase Auth (magic link)** | R$ 0 | Envia o email e valida o token nativamente — sem backend manual |
| Type-safety | **TypeScript + tipos gerados do Supabase** | R$ 0 | `supabase gen types` → tipos do banco no código |
| Validação | **Zod** (palpites, config YAML) | R$ 0 | Valida entrada do usuário e o `scoring.yaml` no boot |

**Bibliotecas previstas:**
- `@supabase/supabase-js` + `@supabase/ssr` (auth no App Router)
- `zod` (validação de palpites e do YAML de pontuação)
- `yaml` (ler `config/scoring.yaml`)
- UI: Tailwind CSS + shadcn/ui (rápido e acessível)

**Trade-offs assumidos:**
- ✅ Type-safety real, auth pronta, banco relacional, observabilidade (logs do Vercel + Supabase).
- ✅ Magic link sai de graça e sem gambiarra — resolve o conflito da conversa anterior.
- ⚠️ Free tier do Supabase pausa o projeto após ~1 semana de inatividade total. Irrelevante durante a Copa (uso diário); basta reativar no painel se acontecer.

### Segurança (Row Level Security)
- Cada participante só lê/grava **os próprios palpites** enquanto o jogo não começou.
- Palpites alheios só ficam visíveis **após o apito inicial** do jogo.
- Resultados e config: escrita restrita ao admin (você).

---

## 3. De onde vem a tabela de jogos (fonte da verdade)

### Fontes oficiais
- **Calendário e resultados oficiais FIFA:** https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/scores-fixtures
- **Classificação dos grupos + chaveamento do mata-mata (FIFA):** https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/standings

### Como popular a planilha
Para 12 pessoas, o mais simples e confiável é **semear manualmente** os 104 jogos na aba `Jogos` a partir da fonte oficial (fazemos uma vez, antes do torneio). Estrutura sugerida na seção 7.

> **Atenção aos horários:** as fontes publicam horários em fusos diferentes (ET, local, UK). **Vamos fixar tudo em horário de Brasília (BRT, UTC−3)** na planilha para evitar confusão. Conferir cada jogo na página oficial da FIFA antes de travar.

### Estrutura do torneio (formato 2026 — novo)
- **48 seleções**, **12 grupos** (A–L) de 4 times, **104 jogos** no total.
- **Fase de grupos:** 11–27/jun.
- Avançam ao mata-mata: **os 2 primeiros de cada grupo + os 8 melhores terceiros** → **32 times** (Round of 32 — fase nova).
- **Mata-mata:** Round of 32 (28/jun–3/jul) → Oitavas (4–7/jul) → Quartas (9–11/jul) → Semis (14–15/jul) → Disputa de 3º (18/jul) → **Final (19/jul, MetLife Stadium)**.

---

## 4. Login dos 12 amigos

### Decisão: Magic link por email (Supabase Auth)

- O participante digita o email → recebe um link → clica → entra. Sem senha.
- Pré-cadastramos os **12 emails autorizados** na tabela `participantes`. Email fora da lista não entra (bolão fechado) — barrado por uma checagem no callback + RLS.

**Fluxo (nativo do Supabase, sem backend manual):**
1. Tela de login chama `supabase.auth.signInWithOtp({ email })`.
2. Supabase envia o magic link por email automaticamente.
3. Usuário clica → cai na rota `/auth/callback` → sessão criada (cookie httpOnly via `@supabase/ssr`).
4. Sessão renova sozinha; configurável para durar todo o torneio (sem relogar a cada jogo).

> Como são 12 emails confiáveis, mantemos a sessão longa. O free tier de email do Supabase serve para esse volume; se quiser remetente próprio depois, dá para plugar um SMTP grátis (ex.: Resend) sem mudar o fluxo.

---

## 5. O que cada um palpita

### 5.1 Palpites de jogo (placar)
- Para **cada partida**, o participante informa o **placar** (ex.: `2 x 1`).
- **Quando trava** depende da política `lock_policy` no `config/scoring.yaml` (ver 5.4).
- **Palpite em branco** (não preencheu antes do travamento): pontos definidos por `blank_prediction_points` (padrão **0**).

### 5.4 Política de travamento — `lock_policy` (DECIDIDO: `per_game`)
**Decisão:** o palpite pode ser editado até a **hora exata do apito inicial** de cada jogo (campo `inicio` do jogo); a partir daí, trava. Continua sendo uma chave no YAML, trocável sem mexer no código:

| Valor | Comportamento | Efeito no jogo |
|---|---|---|
| `per_game` **(em uso)** | Cada jogo trava no **seu próprio apito inicial**. Dá para editar palpites de jogos futuros a qualquer momento. | Mais engajante — você reage a lesões, surpresas, etc. |
| `per_phase` | Todos os palpites de uma fase travam **quando a fase começa**. | Premia quem crava antes; não dá para reagir no meio da fase. |

### 5.2 Liberação por fase
- **Fase de grupos:** todos os 72 jogos ficam disponíveis para palpitar desde já (cada um trava no seu horário).
- **Mata-mata:** os jogos só existem depois que se sabe quem se classificou. Portanto, **os palpites do mata-mata só são registrados após o fim da fase de grupos** (quando os confrontos do Round of 32 estiverem definidos). O sistema libera os palpites de cada fase conforme os confrontos vão sendo conhecidos.

### 5.3 Palpites bônus (registrados ANTES do início do torneio)
Travam no apito inicial do primeiro jogo (11/jun). Valem pontos no fim (ver seção 6.3):
- 🏆 **Campeão**
- 🥈 **Vice-campeão**
- 🥉 **Terceiro lugar**
- ⚽ **Artilheiro** da Copa
- 🎯 (opcional) **Seleção surpresa** / **zebra**

---

## 6. Critérios de pontuação

> **Fonte única da verdade:** `config/scoring.yaml`. Os números abaixo são o reflexo dos valores padrão desse arquivo — para mudar pesos/pontos, edite o YAML (não o código nem este doc). O app lê o YAML, valida com Zod no boot e usa esses valores tanto no cálculo quanto na **página pública de regras** (seção 9).
>
> Baseado nos modelos de bolão brasileiros pesquisados (dacopa, Oeste "Sem Firula", Plural, 365Scores) e **calibrado pelo exemplo dado pelo dono**: placar exato vale bem mais que só acertar o vencedor.

### 6.1 Pontuação por jogo — fase de grupos (peso 1×)

| Nível de acerto | Descrição | Pontos |
|---|---|---|
| 🎯 **Placar exato** | Acertou os dois placares ("na mosca") | **5** |
| ↔️ **Vencedor + diferença de gols** | Acertou quem ganhou **e** a diferença de gols, mas não o placar exato | **3** |
| ✅ **Só o resultado** | Acertou quem ganhou (ou que foi empate), placar errado | **2** |
| ❌ **Erro** | Não acertou o resultado | **0** |

**Exemplos (validando o pedido do dono):**

Resultado real: **3 × 1** (vitória do mandante)
| Palpite | Por quê | Pontos |
|---|---|---|
| `3 x 1` | Placar exato | **5** |
| `2 x 0` | Vencedor certo + diferença certa (+2) | **3** |
| `2 x 1` | Vencedor certo, diferença errada | **2** |
| `0 x 1` | Vencedor errado | **0** |

Resultado real: **2 × 2** (empate)
| Palpite | Por quê | Pontos |
|---|---|---|
| `2 x 2` | Placar exato (empate) | **5** |
| `3 x 3` | Acertou que foi empate, placar errado | **2** |
| `1 x 0` | Não foi empate | **0** |

> No empate, "diferença de gols" é sempre 0, então o nível intermediário (3 pts) não se aplica: ou crava o placar (5) ou acerta só que foi empate (2).

### 6.2 Multiplicador por fase (mata-mata vale mais)

Os mesmos níveis da tabela 6.1, multiplicados pelo peso da fase. Para o mata-mata, **o placar considerado é o do tempo normal + prorrogação** (pênaltis não contam para o placar do palpite).

| Fase | Peso | Placar exato | Vencedor+dif. | Só resultado |
|---|---|---|---|---|
| Fase de grupos | **1×** | 5 | 3 | 2 |
| Round of 32 | **1×** | 5 | 3 | 2 |
| Oitavas de final | **1.5×** | 7,5 | 4,5 | 3 |
| Quartas de final | **2×** | 10 | 6 | 4 |
| Semifinais | **2.5×** | 12,5 | 7,5 | 5 |
| 3º lugar e Final | **3×** | 15 | 9 | 6 |

> Pesos definidos em `phase_weights` no YAML. Arredondamento controlado por `round_points_to_integer` (padrão `false`). Para usar pesos inteiros, troque para `1, 1, 2, 2, 3, 3` no YAML.

### 6.3 Pontos dos palpites bônus

| Acerto | Pontos |
|---|---|
| Campeão | **15** |
| Vice-campeão | **8** |
| Terceiro lugar | **5** |
| Artilheiro | **10** |
| (opcional) Seleção surpresa | **5** |

> Calibrados para serem relevantes no ranking, mas sem decidir o bolão sozinhos. Ajustável.

### 6.4 Bônus de classificação no mata-mata (opcional)
Como você quer pontuar "quem avança": além do placar, **+2 pontos** por acertar quem se classifica em cada confronto de mata-mata (independente do placar). Marcar se vamos usar — adiciona graça mas mais complexidade de apuração.

---

## 7. Modelo de dados (tabelas Postgres / Supabase)

Tipos gerados via `supabase gen types typescript` → usados no front e nas Server Actions (type-safety ponta a ponta).

### `participantes`
| coluna | tipo | nota |
|---|---|---|
| id | uuid (PK) | = `auth.users.id` do Supabase |
| nome | text | |
| email | text (unique) | um dos 12 autorizados |
| is_admin | bool | só você grava resultados/config |
| criado_em | timestamptz | |

### `jogos`
| coluna | tipo | nota |
|---|---|---|
| id | int (PK) | nº oficial do jogo FIFA (1–104) |
| fase | enum | `group`, `round_of_32`, `round_of_16`, `quarter_finals`, `semi_finals`, `third_place`, `final` (casa com `phase_weights`) |
| grupo | text null | A–L (só fase de grupos) |
| inicio | timestamptz | horário do apito (define o travamento) |
| mandante | text | |
| visitante | text | |
| gols_mandante | int null | vazio até encerrar |
| gols_visitante | int null | vazio até encerrar |
| status | enum | `agendado` / `encerrado` |

### `palpites`
| coluna | tipo | nota |
|---|---|---|
| id | uuid (PK) | |
| participante_id | uuid (FK) | |
| jogo_id | int (FK) | |
| gols_mandante | int | |
| gols_visitante | int | |
| atualizado_em | timestamptz | |
| (unique) | (participante_id, jogo_id) | um palpite por jogo |

### `palpites_bonus`
| coluna | tipo |
|---|---|
| participante_id | uuid (PK/FK) |
| campeao / vice / terceiro / artilheiro / surpresa | text null |

> **Pontuação NÃO é coluna no banco.** É calculada a partir de `config/scoring.yaml` + resultados, garantindo fonte única. Auth e tokens são responsabilidade do Supabase Auth (não modelamos à mão).

---

## 8. Cálculo do ranking e critérios de desempate

- **Pontuação total** = soma de todos os pontos de jogos + bônus.
- **Atualização:** sempre que um placar é preenchido na tabela `jogos`, o ranking recalcula (via view/consulta no Postgres).

### Critérios de desempate (em ordem)
1. Maior pontuação total.
2. Maior número de **placares exatos** (cravadas).
3. Maior número de **resultados certos** (vencedor/empate).
4. Mantém empate na posição (pódio dividido) — ou sorteio, a definir.

---

## 9. Telas (MVP)

1. **Login** — campo de email + "receber link".
2. **Meus palpites** — lista de jogos por rodada, com inputs de placar; trava conforme `lock_policy`; aba separada para bônus (some após o início do torneio).
3. **Ranking** — tabela dos 12, com pontos, nº de cravadas, posição.
4. **Jogos / resultados** — calendário com placares reais e o seu palpite vs. o resultado.
5. **Regras / Como pontua** — página pública explicando a pontuação para todos, **gerada a partir do `config/scoring.yaml`** (tabelas de níveis de acerto, pesos por fase, bônus e desempate). Como lê o mesmo arquivo do cálculo, nunca fica desatualizada em relação às regras reais.
6. (opcional) **Detalhe do participante** — histórico de palpites de cada um (visível a todos após o jogo começar).

---

## 10. Os 12 grupos (Sorteio Final — Washington, 05/dez/2025)

| Grupo | Times |
|---|---|
| **A** | México (anfitrião), África do Sul, Coreia do Sul, Chéquia |
| **B** | Canadá (anfitrião), Bósnia e Herzegovina, Catar, Suíça |
| **C** | Brasil, Marrocos, Haiti, Escócia |
| **D** | Estados Unidos (anfitrião), Paraguai, Austrália, Türkiye |
| **E** | Alemanha, Curaçao, Costa do Marfim, Equador |
| **F** | Países Baixos, Japão, Suécia, Tunísia |
| **G** | Bélgica, Egito, Irã, Nova Zelândia |
| **H** | Espanha, Cabo Verde, Arábia Saudita, Uruguai |
| **I** | França, Senegal, Iraque, Noruega |
| **J** | Argentina, Argélia, Áustria, Jordânia |
| **K** | Portugal, RD Congo, Uzbequistão, Colômbia |
| **L** | Inglaterra, Croácia, Gana, Panamá |

> ⚠️ Conferir os times dos grupos B, D, I (vagas que dependiam de repescagem) na página oficial da FIFA antes de travar a planilha, pois algumas fontes ainda listavam os playoffs.

### Jogos do Brasil (Grupo C) — conferir horário oficial
- **13/jun** — Brasil x Marrocos (MetLife, Nova Jersey)
- **19/jun** — Brasil x Haiti (Lincoln Financial, Filadélfia)
- **24/jun** — Escócia x Brasil (Hard Rock, Miami)

---

## 11. Decisões em aberto

> Todas configuráveis no `config/scoring.yaml` — não travam o início do desenvolvimento.

1. ✅ **`lock_policy`** — DECIDIDO: `per_game` (edita até a hora exata do apito de cada jogo).
2. **Pesos do mata-mata** — fracionados (1.5×, 2.5×) ou inteiros (1,1,2,2,3,3). Padrão: fracionados.
3. **Bônus de "quem avança"** (`knockout_advance_bonus`) — usar (+2) ou não. Padrão: desligado.
4. **Palpite em branco** — 0 ou penalidade negativa. Padrão: 0.
5. **Arredondamento** de pontos fracionados (`round_points_to_integer`). Padrão: não.
6. **Prêmio / aposta** — tem valor em dinheiro? (não afeta o código).

---

## 12. Próximos passos

1. ✅ Definir stack, fonte de dados, login e pontuação (este documento).
2. ✅ Criar `config/scoring.yaml` com pesos/pontos configuráveis.
3. ✅ Scaffold do projeto Next.js + TypeScript + Tailwind, integrar Supabase.
4. ✅ Loader do `scoring.yaml` com validação Zod + módulo único de cálculo de pontos (com testes).
5. ✅ Migração SQL com tabelas (seção 7) + políticas RLS + tipos do banco (placeholder até `gen types`).
6. ✅ Auth magic link (login, callback, proxy/sessão, logout) + tela **/palpites** funcional + página **/regras** (a partir do YAML).
7. ⬜ Criar o projeto Supabase real, rodar `supabase/migrations/0001_init.sql`, preencher `.env.local` e regerar os tipos.
8. ⬜ Semear os 104 jogos a partir da FIFA (horário de Brasília).
9. ⬜ Telas restantes: ranking real e jogos/resultados.
10. ⬜ Cadastrar os 12 emails, deploy no Vercel e testar o magic link.
11. ⬜ Abrir os palpites bônus **antes de 11/jun**.
