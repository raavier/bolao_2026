"use client";

import { useState } from "react";
import { Flag } from "@/components/flag";
import type { BreakdownItem } from "@/lib/scoring/ranking";
import type { HitLevel } from "@/lib/scoring/score-match";

export type RankingTableRow = {
  id: string;
  nome: string;
  points: number;
  exactScores: number;
  correctResults: number;
  breakdown: BreakdownItem[];
};

const HIT_LABEL: Record<HitLevel, string> = {
  exact_score: "🎯 Placar exato",
  winner_and_goal_diff: "↔️ Vencedor + saldo",
  winner_only: "✅ Resultado certo",
  miss: "❌ Errou",
};

const formatPoints = (value: number) =>
  Number.isInteger(value) ? String(value) : value.toFixed(1).replace(".", ",");

export function RankingTable({ rows }: { rows: RankingTableRow[] }) {
  const [aberto, setAberto] = useState<string | null>(null);

  return (
    <table className="w-full text-sm border-collapse">
      <thead>
        <tr className="text-left border-b border-black/10 dark:border-white/15">
          <th className="py-2 w-8">#</th>
          <th className="py-2">Participante</th>
          <th className="py-2 text-right">Pontos</th>
          <th className="py-2 text-right" title="Placares cravados">🎯</th>
          <th className="py-2 text-right" title="Resultados certos">✅</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => {
          const expandido = aberto === row.id;
          return (
            <RankingRowGroup
              key={row.id}
              row={row}
              posicao={index + 1}
              expandido={expandido}
              onToggle={() => setAberto(expandido ? null : row.id)}
            />
          );
        })}
      </tbody>
    </table>
  );
}

function RankingRowGroup({
  row,
  posicao,
  expandido,
  onToggle,
}: {
  row: RankingTableRow;
  posicao: number;
  expandido: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <tr
        onClick={onToggle}
        className="border-b border-black/5 dark:border-white/10 cursor-pointer hover:bg-foreground/5"
      >
        <td className="py-2 text-foreground/50">{posicao}</td>
        <td className="py-2 font-medium">
          <span className="text-foreground/40 mr-1">{expandido ? "▾" : "▸"}</span>
          {row.nome}
        </td>
        <td className="py-2 text-right font-semibold">{formatPoints(row.points)}</td>
        <td className="py-2 text-right text-foreground/60">{row.exactScores}</td>
        <td className="py-2 text-right text-foreground/60">{row.correctResults}</td>
      </tr>
      {expandido ? (
        <tr>
          <td colSpan={5} className="pb-3 pt-1">
            {row.breakdown.length === 0 ? (
              <p className="text-xs text-foreground/50 px-2">
                Nenhum jogo encerrado ainda.
              </p>
            ) : (
              <ul className="space-y-1 px-2">
                {row.breakdown.map((item) => (
                  <li
                    key={item.jogoId}
                    className="flex items-center gap-2 text-xs border-b border-black/5 dark:border-white/5 py-1"
                  >
                    <span className="flex items-center gap-1 flex-1 min-w-0 justify-end">
                      <span className="truncate">{item.mandante}</span>
                      <Flag team={item.mandante} />
                    </span>
                    <span className="font-medium tabular-nums">
                      {item.resultado.home}×{item.resultado.away}
                    </span>
                    <span className="flex items-center gap-1 flex-1 min-w-0">
                      <Flag team={item.visitante} />
                      <span className="truncate">{item.visitante}</span>
                    </span>
                    <span className="text-foreground/50 w-28 text-right shrink-0">
                      {item.palpite
                        ? `palpite ${item.palpite.home}×${item.palpite.away}`
                        : "sem palpite"}
                    </span>
                    <span className="w-32 text-right shrink-0 text-foreground/70">
                      {item.hitLevel ? HIT_LABEL[item.hitLevel] : "—"}
                    </span>
                    <span className="w-10 text-right shrink-0 font-semibold">
                      +{formatPoints(item.points)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </td>
        </tr>
      ) : null}
    </>
  );
}
