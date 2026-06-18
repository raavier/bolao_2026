import type { Phase } from "../scoring/phases";
import type { ScoringConfig } from "../scoring/config-schema";
import { classifyHit, scoreMatch, type HitLevel } from "../scoring/score-match";
import { displayName } from "../display-name";
import { fifaRank } from "./fifa-ranking";

/**
 * Cálculo do report da rodada. Função PURA: recebe o snapshot cru (já congelado
 * em rodada-1.snapshot.json) + a config de pontuação e devolve um RoundReport
 * tipado, pronto para a página renderizar. Sem efeitos colaterais e sem acesso
 * ao banco — toda leitura acontece no script de snapshot.
 *
 * Reusa classifyHit/scoreMatch (fonte única das regras) e fifaRank (zebras).
 */

// --- Formato do snapshot (espelha o JSON gerado pelo script) ----------------

export type SnapshotParticipante = {
  id: string;
  nome: string;
  nickname: string | null;
  bloqueado: boolean;
};

export type SnapshotJogo = {
  id: number;
  fase: Phase;
  grupo: string | null;
  inicio: string;
  mandante: string;
  visitante: string;
  gols_mandante: number | null;
  gols_visitante: number | null;
};

export type SnapshotPalpite = {
  participante_id: string;
  jogo_id: number;
  gols_mandante: number;
  gols_visitante: number;
};

export type SnapshotLog = SnapshotPalpite & { criado_em: string };

export type RodadaSnapshot = {
  rodada: number;
  ultimoJogo: number;
  geradoEm: string;
  participantes: SnapshotParticipante[];
  jogos: SnapshotJogo[];
  palpites: SnapshotPalpite[];
  logs: SnapshotLog[];
  comentarios: Record<string, string>;
};

// --- Saída ------------------------------------------------------------------

export type RankRow = {
  id: string;
  nome: string;
  points: number;
  exactScores: number;
  correctResults: number;
  palpitou: number;
};

export type MelhorAcerto = {
  jogoId: number;
  mandante: string;
  visitante: string;
  placar: string;
  hit: HitLevel;
};

export type PodioItem = RankRow & {
  posicao: number;
  comentarioMelhores: MelhorAcerto[];
};

export type PlacarContagem = { placar: string; vezes: number };

export type JogoZebra = {
  jogoId: number;
  mandante: string;
  visitante: string;
  placar: string;
  acertaramVencedor: number;
  total: number;
  // Nomes de quem acertou o vencedor — só preenchido quando foram poucos (<=2),
  // para destacar quem "viu" a zebra. Vazio quando ninguém ou muita gente viu.
  quemViu: string[];
};

export type ZebraFifa = JogoZebra & {
  rankMandante: number | null;
  rankVisitante: number | null;
  gap: number; // posições de diferença em que o favorito FIFA tropeçou
};

export type JogoMoleza = JogoZebra & { cravaram: number };

export type PerfilGols = { id: string; nome: string; golsPorJogo: number };

export type Par = { a: string; b: string; iguais: number; total: number };

export type DoContra = {
  nome: string;
  jogo: string;
  placar: string;
  quantos: number; // quantas pessoas cravaram esse placar
};

export type EmCimaDoApito = { nome: string; jogoId: number; minutos: number };

export type Indeciso = { id: string; nome: string; trocas: number; saves: number };

export type Adiantado = { id: string; nome: string; horasMedia: number };

export type ComentarioNeto = { id: string; nome: string; texto: string };

export type RoundReport = {
  rodada: number;
  geradoEm: string;
  totalJogos: number;
  totalParticipantes: number;
  podio: PodioItem[];
  ranking: RankRow[];
  placarNacional: PlacarContagem[];
  zebrasNinguemViu: JogoZebra[];
  zebrasFifa: ZebraFifa[];
  molezas: JogoMoleza[];
  goleadores: PerfilGols[];
  cautelosos: PerfilGols[];
  gemeos: Par[];
  opostos: Par[];
  doContra: DoContra[];
  emCimaDoApito: EmCimaDoApito[];
  indecisos: Indeciso[];
  adiantados: Adiantado[];
  comentarios: ComentarioNeto[];
};

// --- Helpers ----------------------------------------------------------------

const sign = (home: number, away: number): -1 | 0 | 1 =>
  home > away ? 1 : home < away ? -1 : 0;

const placarStr = (h: number, v: number) => `${h}x${v}`;

type Scoreline = { home: number; away: number };

/** Empate Caique × Bruno: zoeira oficial do bolão (só no pódio do report). */
const DESEMPATE_PODIO = {
  vencedor: "Caique",
  perdedor: "Bruno",
  motivo:
    "Bruno acredita que CR7 foi melhor que Messi — por isso o Caique fica na frente.",
};

// --- Cálculo ----------------------------------------------------------------

export function computeReport(
  snapshot: RodadaSnapshot,
  config: ScoringConfig,
): RoundReport {
  const players = snapshot.participantes.filter((p) => !p.bloqueado);
  const nameOf = new Map(players.map((p) => [p.id, displayName(p)]));
  const isPlayer = (id: string) => nameOf.has(id);

  const jogosEncerrados = snapshot.jogos.filter(
    (j) => j.gols_mandante !== null && j.gols_visitante !== null,
  );
  const jogoById = new Map(jogosEncerrados.map((j) => [j.id, j]));

  const palpites = snapshot.palpites.filter(
    (p) => isPlayer(p.participante_id) && jogoById.has(p.jogo_id),
  );

  const realScore = (j: SnapshotJogo): Scoreline => ({
    home: j.gols_mandante as number,
    away: j.gols_visitante as number,
  });

  // --- Ranking da rodada ---
  type Acc = RankRow & { gols: number };
  const acc = new Map<string, Acc>(
    players.map((p) => [
      p.id,
      {
        id: p.id,
        nome: nameOf.get(p.id)!,
        points: 0,
        exactScores: 0,
        correctResults: 0,
        palpitou: 0,
        gols: 0,
      },
    ]),
  );

  for (const palpite of palpites) {
    const jogo = jogoById.get(palpite.jogo_id)!;
    const row = acc.get(palpite.participante_id)!;
    const pred: Scoreline = { home: palpite.gols_mandante, away: palpite.gols_visitante };
    const { points } = scoreMatch(pred, realScore(jogo), jogo.fase, config);
    const hit = classifyHit(pred, realScore(jogo));
    row.points += points;
    row.palpitou += 1;
    row.gols += palpite.gols_mandante + palpite.gols_visitante;
    if (hit === "exact_score") row.exactScores += 1;
    if (hit !== "miss") row.correctResults += 1;
  }

  const ranking: RankRow[] = [...acc.values()]
    .map((r) => ({
      id: r.id,
      nome: r.nome,
      points: r.points,
      exactScores: r.exactScores,
      correctResults: r.correctResults,
      palpitou: r.palpitou,
    }))
    .sort(
      (a, b) =>
        b.points - a.points ||
        b.exactScores - a.exactScores ||
        b.correctResults - a.correctResults ||
        a.nome.localeCompare(b.nome),
    );

  // Override do pódio: a zoeira CR7×Messi coloca Caique à frente de Bruno
  // quando os dois empatam em pontos. Só afeta o report, não o /ranking oficial.
  const rankingPodio = applyDesempatePodio(ranking);

  // --- Pódio detalhado (melhores acertos do top 3) ---
  const podio: PodioItem[] = rankingPodio.slice(0, 3).map((row, i) => ({
    ...row,
    posicao: i + 1,
    comentarioMelhores: melhoresAcertos(row.id, palpites, jogoById, config),
  }));

  // --- Ranking de placares ---
  // Na Copa, jogar em casa ou fora não muda nada, então placares simétricos
  // contam juntos: 2x0 = 0x2, 2x1 = 1x2. Normalizamos para "maior x menor".
  const placarCount = new Map<string, number>();
  for (const p of palpites) {
    const k = placarStr(
      Math.max(p.gols_mandante, p.gols_visitante),
      Math.min(p.gols_mandante, p.gols_visitante),
    );
    placarCount.set(k, (placarCount.get(k) ?? 0) + 1);
  }
  const placarNacional: PlacarContagem[] = [...placarCount.entries()]
    .map(([placar, vezes]) => ({ placar, vezes }))
    .sort((a, b) => b.vezes - a.vezes)
    .slice(0, 6);

  // --- Por jogo: acertos de vencedor e cravadas ---
  const porJogo = jogosEncerrados.map((j) => {
    const ps = palpites.filter((p) => p.jogo_id === j.id);
    const real = realScore(j);
    let cravaram = 0;
    const quemAcertou: string[] = [];
    for (const p of ps) {
      const hit = classifyHit({ home: p.gols_mandante, away: p.gols_visitante }, real);
      if (hit !== "miss") quemAcertou.push(nameOf.get(p.participante_id)!);
      if (hit === "exact_score") cravaram += 1;
    }
    return {
      jogo: j,
      total: ps.length,
      acertaramVencedor: quemAcertou.length,
      quemAcertou,
      cravaram,
      placar: placarStr(real.home, real.away),
    };
  });

  const zebrasNinguemViu: JogoZebra[] = [...porJogo]
    .filter((s) => s.total > 0)
    .sort((a, b) => a.acertaramVencedor - b.acertaramVencedor || b.total - a.total)
    .slice(0, 6)
    .map((s) => ({
      jogoId: s.jogo.id,
      mandante: s.jogo.mandante,
      visitante: s.jogo.visitante,
      placar: s.placar,
      acertaramVencedor: s.acertaramVencedor,
      total: s.total,
      // Destaca quem viu quando foram poucos (1 ou 2 pessoas).
      quemViu: s.acertaramVencedor > 0 && s.acertaramVencedor <= 2 ? s.quemAcertou : [],
    }));

  const zebrasFifa: ZebraFifa[] = porJogo
    .map((s) => {
      const rm = fifaRank(s.jogo.mandante);
      const rv = fifaRank(s.jogo.visitante);
      const o = sign(s.jogo.gols_mandante as number, s.jogo.gols_visitante as number);
      // gap > 0: o favorito (melhor rank = número menor) NÃO venceu
      let gap = 0;
      if (rm !== null && rv !== null) {
        if (o === 1) gap = rm - rv; // mandante (rank rm) venceu o favorito rv
        else if (o === -1) gap = rv - rm; // visitante venceu o favorito rm
        else gap = Math.abs(rm - rv); // empate: favorito tropeçou
      }
      return { s, rm, rv, gap };
    })
    .filter((x) => x.gap > 0)
    .sort((a, b) => b.gap - a.gap)
    .slice(0, 5)
    .map(({ s, rm, rv, gap }) => ({
      jogoId: s.jogo.id,
      mandante: s.jogo.mandante,
      visitante: s.jogo.visitante,
      placar: s.placar,
      acertaramVencedor: s.acertaramVencedor,
      total: s.total,
      quemViu: s.acertaramVencedor > 0 && s.acertaramVencedor <= 2 ? s.quemAcertou : [],
      rankMandante: rm,
      rankVisitante: rv,
      gap,
    }));

  const molezas: JogoMoleza[] = [...porJogo]
    .filter((s) => s.total > 0)
    .sort((a, b) => b.cravaram - a.cravaram || b.acertaramVencedor - a.acertaramVencedor)
    .slice(0, 4)
    .map((s) => ({
      jogoId: s.jogo.id,
      mandante: s.jogo.mandante,
      visitante: s.jogo.visitante,
      placar: s.placar,
      acertaramVencedor: s.acertaramVencedor,
      cravaram: s.cravaram,
      total: s.total,
      quemViu: [],
    }));

  // --- Perfis (gols por jogo palpitado) ---
  const perfis: PerfilGols[] = [...acc.values()]
    .filter((r) => r.palpitou > 0)
    .map((r) => ({ id: r.id, nome: r.nome, golsPorJogo: r.gols / r.palpitou }));
  const goleadores = [...perfis].sort((a, b) => b.golsPorJogo - a.golsPorJogo).slice(0, 3);
  const cautelosos = [...perfis].sort((a, b) => a.golsPorJogo - b.golsPorJogo).slice(0, 3);

  // --- Gêmeos & opostos (placares idênticos entre pares) ---
  const palpitePorJogador = new Map<string, Map<number, string>>();
  for (const p of palpites) {
    if (!palpitePorJogador.has(p.participante_id))
      palpitePorJogador.set(p.participante_id, new Map());
    palpitePorJogador
      .get(p.participante_id)!
      .set(p.jogo_id, placarStr(p.gols_mandante, p.gols_visitante));
  }
  const ids = players.map((p) => p.id);
  const pares: Par[] = [];
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const ma = palpitePorJogador.get(ids[i]);
      const mb = palpitePorJogador.get(ids[j]);
      if (!ma || !mb) continue;
      let iguais = 0;
      let total = 0;
      for (const jogo of jogosEncerrados) {
        const a = ma.get(jogo.id);
        const b = mb.get(jogo.id);
        if (a && b) {
          total += 1;
          if (a === b) iguais += 1;
        }
      }
      if (total > 0)
        pares.push({ a: nameOf.get(ids[i])!, b: nameOf.get(ids[j])!, iguais, total });
    }
  }
  const gemeos = [...pares].sort((x, y) => y.iguais - x.iguais).slice(0, 3);
  const opostos = [...pares].sort((x, y) => x.iguais - y.iguais).slice(0, 3);

  // --- Do-contra: cravou um placar que <= 2 pessoas cravaram ---
  const doContra: DoContra[] = [];
  for (const j of jogosEncerrados) {
    const real = realScore(j);
    const realK = placarStr(real.home, real.away);
    const cravadores = palpites.filter(
      (p) => p.jogo_id === j.id && placarStr(p.gols_mandante, p.gols_visitante) === realK,
    );
    if (cravadores.length >= 1 && cravadores.length <= 2) {
      for (const c of cravadores) {
        doContra.push({
          nome: nameOf.get(c.participante_id)!,
          jogo: `${j.mandante} x ${j.visitante}`,
          placar: realK,
          quantos: cravadores.length,
        });
      }
    }
  }
  // Prioriza os mais solitários (1 cravador) primeiro.
  doContra.sort((a, b) => a.quantos - b.quantos);

  // --- Comportamento (logs) ---
  const logs = snapshot.logs.filter(
    (l) => isPlayer(l.participante_id) && jogoById.has(l.jogo_id),
  );

  const emCimaDoApito = computeEmCimaDoApito(logs, jogoById, nameOf);
  const indecisos = computeIndecisos(logs, nameOf);
  const adiantados = computeAdiantados(logs, jogoById, nameOf);

  // --- Comentários do Craque Neto ---
  const comentarios: ComentarioNeto[] = rankingPodio
    .filter((r) => snapshot.comentarios[r.id])
    .map((r) => ({ id: r.id, nome: r.nome, texto: snapshot.comentarios[r.id] }));

  return {
    rodada: snapshot.rodada,
    geradoEm: snapshot.geradoEm,
    totalJogos: jogosEncerrados.length,
    totalParticipantes: players.length,
    podio,
    ranking: rankingPodio,
    placarNacional,
    zebrasNinguemViu,
    zebrasFifa,
    molezas,
    goleadores,
    cautelosos,
    gemeos,
    opostos,
    doContra,
    emCimaDoApito,
    indecisos,
    adiantados,
    comentarios,
  };
}

/** Override de pódio: a zoeira CR7×Messi põe Caique à frente de Bruno no empate. */
function applyDesempatePodio(ranking: RankRow[]): RankRow[] {
  const rows = [...ranking];
  const iVenc = rows.findIndex((r) => r.nome.includes(DESEMPATE_PODIO.vencedor));
  const iPerd = rows.findIndex((r) => r.nome.includes(DESEMPATE_PODIO.perdedor));
  if (iVenc === -1 || iPerd === -1) return rows;
  // Só inverte se o "perdedor da zoeira" está na frente e empatam em pontos.
  if (iPerd < iVenc && rows[iPerd].points === rows[iVenc].points) {
    const [venc] = rows.splice(iVenc, 1);
    rows.splice(iPerd, 0, venc);
  }
  return rows;
}

/** Motivo cômico do desempate, para a página exibir. */
export const desempatePodioMotivo = DESEMPATE_PODIO.motivo;

function melhoresAcertos(
  participanteId: string,
  palpites: SnapshotPalpite[],
  jogoById: Map<number, SnapshotJogo>,
  config: ScoringConfig,
): MelhorAcerto[] {
  const ordem: Record<HitLevel, number> = {
    exact_score: 3,
    winner_and_goal_diff: 2,
    winner_only: 1,
    miss: 0,
  };
  return palpites
    .filter((p) => p.participante_id === participanteId)
    .map((p) => {
      const jogo = jogoById.get(p.jogo_id)!;
      const pred = { home: p.gols_mandante, away: p.gols_visitante };
      const real = { home: jogo.gols_mandante as number, away: jogo.gols_visitante as number };
      const { hitLevel, points } = scoreMatch(pred, real, jogo.fase, config);
      return { jogo, hitLevel, points };
    })
    .filter((x) => x.hitLevel !== "miss")
    .sort((a, b) => ordem[b.hitLevel] - ordem[a.hitLevel] || b.points - a.points)
    .slice(0, 3)
    .map((x) => ({
      jogoId: x.jogo.id,
      mandante: x.jogo.mandante,
      visitante: x.jogo.visitante,
      placar: placarStr(x.jogo.gols_mandante as number, x.jogo.gols_visitante as number),
      hit: x.hitLevel,
    }));
}

function computeEmCimaDoApito(
  logs: SnapshotLog[],
  jogoById: Map<number, SnapshotJogo>,
  nameOf: Map<string, string>,
): EmCimaDoApito[] {
  // Para cada (jogador, jogo) considera o save mais próximo do apito (o último
  // antes da bola rolar), para não poluir com a pessoa que salvou 4 vezes.
  const maisProximo = new Map<string, EmCimaDoApito>();
  for (const l of logs) {
    const jogo = jogoById.get(l.jogo_id);
    if (!jogo) continue;
    const minutos = (new Date(jogo.inicio).getTime() - new Date(l.criado_em).getTime()) / 60000;
    if (minutos < 0) continue;
    const key = `${l.participante_id}:${l.jogo_id}`;
    const atual = maisProximo.get(key);
    if (!atual || minutos < atual.minutos) {
      maisProximo.set(key, { nome: nameOf.get(l.participante_id)!, jogoId: l.jogo_id, minutos });
    }
  }
  return [...maisProximo.values()]
    .sort((a, b) => a.minutos - b.minutos)
    .slice(0, 5);
}

function computeIndecisos(
  logs: SnapshotLog[],
  nameOf: Map<string, string>,
): Indeciso[] {
  const porJogador = new Map<string, { saves: number; jogos: Set<number> }>();
  for (const l of logs) {
    if (!porJogador.has(l.participante_id))
      porJogador.set(l.participante_id, { saves: 0, jogos: new Set() });
    const e = porJogador.get(l.participante_id)!;
    e.saves += 1;
    e.jogos.add(l.jogo_id);
  }
  return [...porJogador.entries()]
    .map(([id, e]) => ({
      id,
      nome: nameOf.get(id)!,
      saves: e.saves,
      trocas: e.saves - e.jogos.size, // saves além do 1º por jogo = trocas
    }))
    .sort((a, b) => b.trocas - a.trocas)
    .slice(0, 5);
}

function computeAdiantados(
  logs: SnapshotLog[],
  jogoById: Map<number, SnapshotJogo>,
  nameOf: Map<string, string>,
): Adiantado[] {
  // Para cada (jogador, jogo) usa o PRIMEIRO save (a antecedência com que a
  // pessoa deixou o palpite pronto), depois tira a média por jogador.
  const primeiro = new Map<string, number>(); // key -> ms do primeiro save
  for (const l of logs) {
    const jogo = jogoById.get(l.jogo_id);
    if (!jogo) continue;
    const key = `${l.participante_id}:${l.jogo_id}`;
    const t = new Date(l.criado_em).getTime();
    if (!primeiro.has(key) || t < primeiro.get(key)!) primeiro.set(key, t);
  }
  const porJogador = new Map<string, number[]>();
  for (const [key, t] of primeiro) {
    const [pid, jid] = key.split(":");
    const jogo = jogoById.get(Number(jid))!;
    const horas = (new Date(jogo.inicio).getTime() - t) / 3600000;
    if (horas < 0) continue;
    if (!porJogador.has(pid)) porJogador.set(pid, []);
    porJogador.get(pid)!.push(horas);
  }
  return [...porJogador.entries()]
    .map(([id, arr]) => ({
      id,
      nome: nameOf.get(id)!,
      horasMedia: arr.reduce((a, b) => a + b, 0) / arr.length,
    }))
    .sort((a, b) => b.horasMedia - a.horasMedia)
    .slice(0, 4);
}
