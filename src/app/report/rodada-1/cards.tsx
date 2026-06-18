import { Flag } from "@/components/flag";
import type { HitLevel } from "@/lib/scoring/score-match";
import type {
  Adiantado,
  ComentarioNeto,
  DoContra,
  EmCimaDoApito,
  Indeciso,
  JogoMoleza,
  JogoZebra,
  Par,
  PerfilGols,
  PlacarContagem,
  PodioItem,
  RankRow,
  ZebraFifa,
} from "@/lib/report/compute";

/** Card base: caixa com título e emoji, pensada para caber num print vertical. */
export function Card({
  emoji,
  titulo,
  subtitulo,
  children,
  className = "",
}: {
  emoji: string;
  titulo: string;
  subtitulo?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-black/10 dark:border-white/15 bg-black/[0.02] dark:bg-white/[0.03] p-4 sm:p-5 space-y-3 ${className}`}
    >
      <div className="space-y-0.5">
        <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
          <span aria-hidden="true">{emoji}</span>
          <span>{titulo}</span>
        </h2>
        {subtitulo ? (
          <p className="text-xs text-foreground/55">{subtitulo}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

const HIT_LABEL: Record<HitLevel, string> = {
  exact_score: "🎯 cravou",
  winner_and_goal_diff: "↔️ vencedor + saldo",
  winner_only: "✅ vencedor",
  miss: "❌",
};

const MEDALHA = ["🥇", "🥈", "🥉"];

export function PodioCard({
  podio,
  motivoDesempate,
}: {
  podio: PodioItem[];
  motivoDesempate: string;
}) {
  const empateTopo =
    podio.length >= 2 && podio[0].points === podio[1].points;

  return (
    <Card emoji="🏆" titulo="Pódio da 1ª rodada" subtitulo="Os craques da rodada">
      <ol className="space-y-3">
        {podio.map((p) => (
          <li
            key={p.id}
            className="rounded-xl border border-black/10 dark:border-white/10 bg-background/40 p-3"
          >
            <div className="flex items-baseline gap-2">
              <span className="text-2xl" aria-hidden="true">
                {MEDALHA[p.posicao - 1]}
              </span>
              <span className="font-bold text-base flex-1 min-w-0 truncate">
                {p.nome}
              </span>
              <span className="text-lg font-extrabold tabular-nums">
                {p.points}
                <span className="text-xs font-medium text-foreground/55"> pts</span>
              </span>
            </div>
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-foreground/60 pl-9">
              <span>🎯 {p.exactScores} cravadas</span>
              <span>✅ {p.correctResults} certos</span>
            </div>
            {p.comentarioMelhores.length > 0 ? (
              <ul className="mt-2 pl-9 space-y-0.5 text-xs text-foreground/70">
                {p.comentarioMelhores.map((m) => (
                  <li key={m.jogoId} className="flex items-center gap-1.5">
                    <Flag team={m.mandante} className="!w-4 !h-3" />
                    <span className="truncate">
                      {m.mandante} {m.placar} {m.visitante}
                    </span>
                    <span className="shrink-0 text-foreground/45">
                      {HIT_LABEL[m.hit]}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
          </li>
        ))}
      </ol>

      {empateTopo ? (
        <p className="text-xs text-foreground/60 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2">
          🤝 Empate em {podio[0].points} pts no topo! <strong>Desempate
          oficial do bolão:</strong> {motivoDesempate}
        </p>
      ) : null}
    </Card>
  );
}

export function RankingCard({ ranking }: { ranking: RankRow[] }) {
  return (
    <Card
      emoji="📋"
      titulo="Ranking completo da rodada"
      subtitulo="Só pelos 24 jogos da 1ª rodada"
    >
      <ol className="space-y-1">
        {ranking.map((r, i) => (
          <li
            key={r.id}
            className="flex items-center gap-2 text-sm py-1 border-b border-black/5 dark:border-white/5 last:border-0"
          >
            <span className="w-5 text-right text-foreground/45 tabular-nums">
              {i + 1}
            </span>
            <span className="flex-1 min-w-0 truncate font-medium">{r.nome}</span>
            <span className="shrink-0 text-xs text-foreground/55 tabular-nums">
              🎯{r.exactScores} · ✅{r.correctResults}
            </span>
            <span className="w-12 text-right font-bold tabular-nums">
              {r.points}
            </span>
          </li>
        ))}
      </ol>
    </Card>
  );
}

export function PlacarNacionalCard({ placares }: { placares: PlacarContagem[] }) {
  const max = placares[0]?.vezes ?? 1;
  return (
    <Card
      emoji="🎯"
      titulo="Ranking de Placares"
      subtitulo="Os placares mais palpitados (casa e fora contam junto: 2x0 = 0x2)"
    >
      <ul className="space-y-2">
        {placares.map((p) => (
          <li key={p.placar} className="flex items-center gap-3 text-sm">
            <span className="w-10 font-bold tabular-nums">{p.placar}</span>
            <span className="flex-1 h-4 rounded-full bg-foreground/10 overflow-hidden">
              <span
                className="block h-full rounded-full bg-green-600/70"
                style={{ width: `${(p.vezes / max) * 100}%` }}
              />
            </span>
            <span className="w-16 text-right text-xs text-foreground/60 tabular-nums">
              {p.vezes} palpites
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function JogoLinha({
  mandante,
  visitante,
  placar,
}: {
  mandante: string;
  visitante: string;
  placar: string;
}) {
  return (
    <span className="flex items-center gap-1.5 min-w-0">
      <Flag team={mandante} className="!w-4 !h-3" />
      <span className="truncate">{mandante}</span>
      <span className="font-semibold tabular-nums px-0.5">{placar}</span>
      <span className="truncate">{visitante}</span>
      <Flag team={visitante} className="!w-4 !h-3" />
    </span>
  );
}

export function ZebrasNinguemCard({ zebras }: { zebras: JogoZebra[] }) {
  return (
    <Card
      emoji="🐍"
      titulo="As zebras que (quase) ninguém viu"
      subtitulo="Jogos com menos acertos de vencedor no bolão"
    >
      <ul className="space-y-2 text-sm">
        {zebras.map((z) => (
          <li key={z.jogoId} className="space-y-0.5">
            <div className="flex items-center justify-between gap-2">
              <JogoLinha
                mandante={z.mandante}
                visitante={z.visitante}
                placar={z.placar}
              />
              <span className="shrink-0 text-xs font-semibold text-red-700 dark:text-red-400 tabular-nums">
                {z.acertaramVencedor}/{z.total}
              </span>
            </div>
            {z.quemViu.length > 0 ? (
              <p className="text-xs text-foreground/55 pl-5">
                👁️ só {z.quemViu.join(" e ")} {z.quemViu.length === 1 ? "viu" : "viram"}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function ZebrasFifaCard({
  zebras,
  fonte,
}: {
  zebras: ZebraFifa[];
  fonte: string;
}) {
  return (
    <Card
      emoji="📊"
      titulo="Zebras pelo ranking FIFA"
      subtitulo={`Favoritos que tropeçaram · ${fonte}`}
    >
      <ul className="space-y-2 text-sm">
        {zebras.map((z) => (
          <li key={z.jogoId} className="space-y-0.5">
            <div className="flex items-center justify-between gap-2">
              <JogoLinha
                mandante={z.mandante}
                visitante={z.visitante}
                placar={z.placar}
              />
              <span className="shrink-0 text-xs font-semibold text-amber-700 dark:text-amber-400">
                gap {z.gap}
              </span>
            </div>
            <p className="text-xs text-foreground/50 pl-5">
              #{z.rankMandante} vs #{z.rankVisitante} no mundo ·{" "}
              {z.acertaramVencedor}/{z.total} acertaram
            </p>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function MolezasCard({ molezas }: { molezas: JogoMoleza[] }) {
  return (
    <Card
      emoji="🥅"
      titulo="As molezas da rodada"
      subtitulo="Os jogos que mais gente cravou na mosca"
    >
      <ul className="space-y-2 text-sm">
        {molezas.map((m) => (
          <li key={m.jogoId} className="flex items-center justify-between gap-2">
            <JogoLinha
              mandante={m.mandante}
              visitante={m.visitante}
              placar={m.placar}
            />
            <span className="shrink-0 text-xs font-semibold text-green-700 dark:text-green-400 tabular-nums">
              {m.cravaram}🎯
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function PerfisCard({
  goleadores,
  cautelosos,
}: {
  goleadores: PerfilGols[];
  cautelosos: PerfilGols[];
}) {
  const linha = (p: PerfilGols) => (
    <li key={p.id} className="flex items-center justify-between gap-2 text-sm">
      <span className="truncate">{p.nome}</span>
      <span className="shrink-0 text-xs text-foreground/60 tabular-nums">
        {p.golsPorJogo.toFixed(2)} gols/jogo
      </span>
    </li>
  );
  return (
    <Card emoji="🎲" titulo="Perfis" subtitulo="Quem enche o placar e quem joga no seguro">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-foreground/50">
            ⚽ Goleadores
          </h3>
          <ul className="space-y-1">{goleadores.map(linha)}</ul>
        </div>
        <div className="space-y-1.5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-foreground/50">
            🧱 Cautelosos
          </h3>
          <ul className="space-y-1">{cautelosos.map(linha)}</ul>
        </div>
      </div>
    </Card>
  );
}

export function GemeosCard({
  gemeos,
  opostos,
}: {
  gemeos: Par[];
  opostos: Par[];
}) {
  return (
    <Card
      emoji="👯"
      titulo="Gêmeos & Opostos"
      subtitulo="Quem palpita igual e quem é água e vinho"
    >
      <div className="space-y-3">
        <div className="space-y-1">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-foreground/50">
            Almas gêmeas
          </h3>
          <ul className="space-y-1 text-sm">
            {gemeos.map((p) => (
              <li key={`${p.a}-${p.b}`} className="flex justify-between gap-2">
                <span className="truncate">
                  {p.a} & {p.b}
                </span>
                <span className="shrink-0 text-xs text-foreground/60 tabular-nums">
                  {p.iguais}/{p.total} iguais
                </span>
              </li>
            ))}
          </ul>
        </div>
        {opostos[0] ? (
          <div className="space-y-1">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-foreground/50">
              Polos opostos
            </h3>
            <p className="text-sm">
              {opostos[0].a} & {opostos[0].b} —{" "}
              <span className="text-foreground/60">
                só {opostos[0].iguais}/{opostos[0].total} placares iguais
              </span>
            </p>
          </div>
        ) : null}
      </div>
    </Card>
  );
}

export function DoContraCard({ doContra }: { doContra: DoContra[] }) {
  return (
    <Card
      emoji="🦅"
      titulo="Os do-contra que cravaram"
      subtitulo="Cravaram um placar que quase ninguém viu"
    >
      <ul className="space-y-1.5 text-sm">
        {doContra.map((d, i) => (
          <li key={`${d.nome}-${d.jogo}-${i}`} className="flex items-center gap-2">
            <span className="font-medium truncate">{d.nome}</span>
            <span className="text-foreground/60 truncate">
              cravou {d.jogo} ({d.placar})
            </span>
            {d.quantos === 1 ? (
              <span className="shrink-0 text-xs text-purple-700 dark:text-purple-400 font-semibold">
                sozinho!
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function ComportamentoCard({
  emCimaDoApito,
  indecisos,
  adiantados,
}: {
  emCimaDoApito: EmCimaDoApito[];
  indecisos: Indeciso[];
  adiantados: Adiantado[];
}) {
  const top = emCimaDoApito[0];
  const maisIndeciso = indecisos[0];
  const maisAdiantado = adiantados[0];
  return (
    <Card
      emoji="⏱️"
      titulo="Comportamento"
      subtitulo="O que o histórico de palpites entrega sobre cada um"
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
        {top ? (
          <div className="rounded-xl bg-background/40 border border-black/10 dark:border-white/10 p-3">
            <p className="text-xs text-foreground/50">⏰ Em cima do apito</p>
            <p className="font-bold mt-0.5 truncate">{top.nome}</p>
            <p className="text-xs text-foreground/60">
              salvou faltando {Math.round(top.minutos)} min
            </p>
          </div>
        ) : null}
        {maisIndeciso ? (
          <div className="rounded-xl bg-background/40 border border-black/10 dark:border-white/10 p-3">
            <p className="text-xs text-foreground/50">🔁 Mais indeciso</p>
            <p className="font-bold mt-0.5 truncate">{maisIndeciso.nome}</p>
            <p className="text-xs text-foreground/60">
              {maisIndeciso.trocas} trocas de palpite
            </p>
          </div>
        ) : null}
        {maisAdiantado ? (
          <div className="rounded-xl bg-background/40 border border-black/10 dark:border-white/10 p-3">
            <p className="text-xs text-foreground/50">📅 Mais adiantado</p>
            <p className="font-bold mt-0.5 truncate">{maisAdiantado.nome}</p>
            <p className="text-xs text-foreground/60">
              ~{Math.round(maisAdiantado.horasMedia)}h de antecedência
            </p>
          </div>
        ) : null}
      </div>
    </Card>
  );
}

export function ComentariosNetoCard({
  comentarios,
  disclaimer,
}: {
  comentarios: ComentarioNeto[];
  disclaimer: string;
}) {
  return (
    <Card
      emoji="🎙️"
      titulo="O Craque Neto analisa cada um"
      subtitulo={disclaimer}
    >
      <div className="flex items-center gap-3 rounded-xl bg-[#1f6fc4]/10 border border-[#1f6fc4]/20 p-3">
        {/* Rosto recortado da imagem (999×561) via background, sem editar o arquivo.
            background-size grande dá zoom; a posição centraliza no rosto do Neto. */}
        <span
          role="img"
          aria-label="Craque Neto (paródia)"
          className="shrink-0 w-16 h-16 rounded-full border-2 border-red-500/70 bg-[#1f6fc4]"
          style={{
            backgroundImage: "url(/craque-neto.jpg)",
            backgroundSize: "320%",
            backgroundPosition: "46% 31%",
          }}
        />
        <p className="text-sm font-bold leading-tight text-[#1f6fc4] dark:text-sky-300">
          &ldquo;Tá de brincadeira comigo?!&rdquo;
          <span className="block text-xs font-medium text-foreground/55 mt-0.5">
            O comentarista da rodada
          </span>
        </p>
      </div>

      <ul className="space-y-3">
        {comentarios.map((c) => (
          <li
            key={c.id}
            className="rounded-xl border border-black/10 dark:border-white/10 bg-background/40 p-3"
          >
            <p className="font-bold text-sm mb-1">{c.nome}</p>
            <p className="text-sm text-foreground/80 leading-relaxed italic">
              “{c.texto}”
            </p>
          </li>
        ))}
      </ul>
    </Card>
  );
}
