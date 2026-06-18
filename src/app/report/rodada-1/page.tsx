import type { Metadata } from "next";
import { loadScoringConfig } from "@/lib/scoring/load-config";
import {
  computeReport,
  desempatePodioMotivo,
  type RodadaSnapshot,
} from "@/lib/report/compute";
import { FIFA_RANKING_FONTE } from "@/lib/report/fifa-ranking";
import { CRAQUE_NETO_DISCLAIMER } from "@/lib/report/craque-neto";
import snapshotJson from "@/lib/report/rodada-1.snapshot.json";
import {
  ComentariosNetoCard,
  ComportamentoCard,
  DoContraCard,
  GemeosCard,
  MolezasCard,
  PerfisCard,
  PlacarNacionalCard,
  PodioCard,
  ZebrasFifaCard,
  ZebrasNinguemCard,
} from "./cards";

// Report congelado: o snapshot é fixo (gerado por scripts/snapshot-rodada.mjs),
// então a página pode ser totalmente estática. Os números não mudam quando a
// 2ª rodada começar.
export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Report da 1ª Rodada — Bolas Crentes 2026",
};

const snapshot = snapshotJson as RodadaSnapshot;

export default function ReportRodada1Page() {
  const config = loadScoringConfig();
  const report = computeReport(snapshot, config);

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <header className="space-y-1 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-foreground/45">
          Bolão Bolas Crentes 2026
        </p>
        <h1 className="text-2xl sm:text-3xl font-extrabold">
          📊 Report da 1ª Rodada
        </h1>
        <p className="text-sm text-foreground/60">
          Fim da 1ª rodada da fase de grupos — todas as 48 seleções já jogaram.
          {" "}
          {report.totalJogos} jogos, {report.totalParticipantes} palpiteiros.
        </p>
      </header>

      <PodioCard podio={report.podio} motivoDesempate={desempatePodioMotivo} />
      <PlacarNacionalCard placares={report.placarNacional} />
      <ZebrasNinguemCard zebras={report.zebrasNinguemViu} />
      <ZebrasFifaCard zebras={report.zebrasFifa} fonte={FIFA_RANKING_FONTE} />
      <MolezasCard molezas={report.molezas} />
      <PerfisCard goleadores={report.goleadores} cautelosos={report.cautelosos} />
      <GemeosCard gemeos={report.gemeos} opostos={report.opostos} />
      <DoContraCard doContra={report.doContra} />
      <ComportamentoCard
        emCimaDoApito={report.emCimaDoApito}
        indecisos={report.indecisos}
        adiantados={report.adiantados}
      />
      <ComentariosNetoCard
        comentarios={report.comentarios}
        disclaimer={CRAQUE_NETO_DISCLAIMER}
      />

      <footer className="text-center text-xs text-foreground/40 pt-2">
        Retrato fechado no fim da 1ª rodada. Os números não mudam daqui pra
        frente.
      </footer>
    </div>
  );
}
