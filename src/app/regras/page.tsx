import { loadScoringConfig } from "@/lib/scoring/load-config";
import { PHASES, PHASE_LABELS, GAMES_PER_PHASE } from "@/lib/scoring/phases";

const LOCK_POLICY_TEXT = {
  per_game: "Cada jogo trava no seu próprio apito inicial — dá para editar palpites de jogos futuros a qualquer momento.",
  per_phase: "Os palpites de uma fase travam quando a fase começa — depois disso não dá para mudar.",
} as const;

const HIT_LABELS = {
  exact_score: "🎯 Placar exato (cravou)",
  winner_and_goal_diff: "↔️ Vencedor + diferença de gols",
  winner_only: "✅ Só o resultado (vencedor/empate)",
  miss: "❌ Errou o resultado",
} as const;

const formatPoints = (value: number) =>
  Number.isInteger(value) ? String(value) : value.toFixed(1).replace(".", ",");

export default function RegrasPage() {
  const config = loadScoringConfig();
  const hitLevels = ["exact_score", "winner_and_goal_diff", "winner_only", "miss"] as const;

  // Total de pontos em disputa por fase = nº de jogos × placar exato × peso.
  const phaseTotal = (phase: (typeof PHASES)[number]) =>
    GAMES_PER_PHASE[phase] * config.points.exact_score * config.phase_weights[phase];
  const grandTotal = PHASES.reduce((soma, phase) => soma + phaseTotal(phase), 0);

  return (
    <article className="space-y-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">Como pontua</h1>
        <p className="text-foreground/70">
          Estas regras são geradas direto da configuração oficial do bolão — é
          exatamente o que o sistema usa para calcular os pontos.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Pontos por jogo</h2>
        <p className="text-sm text-foreground/60">
          Cada palpite vale conforme o nível de acerto, multiplicado pelo peso
          da fase (ver abaixo).
        </p>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-left border-b border-black/10 dark:border-white/15">
              <th className="py-2">Nível de acerto</th>
              <th className="py-2 text-right">Pontos base</th>
            </tr>
          </thead>
          <tbody>
            {hitLevels.map((level) => (
              <tr key={level} className="border-b border-black/5 dark:border-white/10">
                <td className="py-2">{HIT_LABELS[level]}</td>
                <td className="py-2 text-right font-medium">
                  {formatPoints(config.points[level])}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Peso por fase</h2>
        <p className="text-sm text-foreground/60">
          Total do jogo = pontos base × peso da fase. A última coluna mostra
          quantos pontos estão em disputa em cada fase (nº de jogos × placar
          exato × peso) — é onde o bolão se decide.
        </p>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-left border-b border-black/10 dark:border-white/15">
              <th className="py-2">Fase</th>
              <th className="py-2 text-right">Peso</th>
              <th className="py-2 text-right">Cravar vale</th>
              <th className="py-2 text-right">Total da fase</th>
            </tr>
          </thead>
          <tbody>
            {PHASES.map((phase) => {
              const weight = config.phase_weights[phase];
              return (
                <tr key={phase} className="border-b border-black/5 dark:border-white/10">
                  <td className="py-2">{PHASE_LABELS[phase]}</td>
                  <td className="py-2 text-right">{formatPoints(weight)}×</td>
                  <td className="py-2 text-right">
                    {formatPoints(config.points.exact_score * weight)}
                  </td>
                  <td className="py-2 text-right font-medium">
                    {formatPoints(phaseTotal(phase))}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t border-black/10 dark:border-white/15">
              <td className="py-2 font-semibold" colSpan={3}>
                Total em disputa
              </td>
              <td className="py-2 text-right font-semibold">
                {formatPoints(grandTotal)}
              </td>
            </tr>
          </tfoot>
        </table>
        <p className="text-xs text-foreground/50">
          O total assume que todos cravam o placar exato — é o teto de cada fase,
          para comparar o peso relativo delas.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Prazo e desempate</h2>
        <p className="text-sm">{LOCK_POLICY_TEXT[config.lock_policy]}</p>
        <p className="text-sm">
          Palpite em branco vale{" "}
          <strong>{formatPoints(config.blank_prediction_points)}</strong> pts.
        </p>
        <p className="text-sm text-foreground/60">
          Em caso de empate na pontuação, desempata por: mais placares cravados,
          depois mais resultados certos.
        </p>
      </section>
    </article>
  );
}
