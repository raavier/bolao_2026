import { loadScoringConfig } from "@/lib/scoring/load-config";
import { PHASES, PHASE_LABELS } from "@/lib/scoring/phases";

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
          Total do jogo = pontos base × peso da fase.
        </p>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-left border-b border-black/10 dark:border-white/15">
              <th className="py-2">Fase</th>
              <th className="py-2 text-right">Peso</th>
              <th className="py-2 text-right">Placar exato vale</th>
            </tr>
          </thead>
          <tbody>
            {PHASES.map((phase) => {
              const weight = config.phase_weights[phase];
              return (
                <tr key={phase} className="border-b border-black/5 dark:border-white/10">
                  <td className="py-2">{PHASE_LABELS[phase]}</td>
                  <td className="py-2 text-right">{formatPoints(weight)}×</td>
                  <td className="py-2 text-right font-medium">
                    {formatPoints(config.points.exact_score * weight)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
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
