import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { formatKickoff } from "@/lib/format";
import { isPredictionOpen } from "@/lib/palpites/lock";
import { ResultadoForm } from "./resultado-form";

export const dynamic = "force-dynamic";

export default async function ResultadosPage() {
  const { user, supabase } = await requireUser();

  const { data: me } = await supabase
    .from("participantes")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  if (!me?.is_admin) redirect("/");

  const { data: jogos } = await supabase
    .from("jogos")
    .select("id, fase, inicio, mandante, visitante, gols_mandante, gols_visitante, status")
    .order("inicio", { ascending: true });

  const todos = jogos ?? [];
  const agora = new Date();
  // Prioriza jogos que já começaram e ainda não têm resultado.
  const pendentes = todos.filter(
    (j) => j.status !== "encerrado" && !isPredictionOpen(new Date(j.inicio), agora),
  );
  const encerrados = todos.filter((j) => j.status === "encerrado");
  const futuros = todos.filter(
    (j) => j.status !== "encerrado" && isPredictionOpen(new Date(j.inicio), agora),
  );

  const renderForm = (j: (typeof todos)[number]) => (
    <ResultadoForm
      key={j.id}
      jogoId={j.id}
      mandante={j.mandante}
      visitante={j.visitante}
      inicioLabel={formatKickoff(j.inicio)}
      golsMandante={j.gols_mandante}
      golsVisitante={j.gols_visitante}
      encerrado={j.status === "encerrado"}
      isKnockout={j.fase !== "group"}
    />
  );

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">Lançar resultados</h1>
        <p className="text-sm text-foreground/60">
          Digite o placar e clique em Encerrar. O ranking recalcula na hora.
        </p>
      </header>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-foreground/70">
          Aguardando resultado ({pendentes.length})
        </h2>
        {pendentes.length === 0 ? (
          <p className="text-sm text-foreground/50">
            Nenhum jogo aguardando. Tudo em dia. ✅
          </p>
        ) : (
          <div>{pendentes.map(renderForm)}</div>
        )}
      </section>

      {encerrados.length > 0 ? (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-foreground/70">
            Encerrados ({encerrados.length}) — editáveis
          </h2>
          <div>{encerrados.map(renderForm)}</div>
        </section>
      ) : null}

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-foreground/70">
          Próximos jogos ({futuros.length})
        </h2>
        <details>
          <summary className="text-sm text-foreground/50 cursor-pointer">
            Mostrar jogos que ainda não começaram
          </summary>
          <div className="mt-2">{futuros.map(renderForm)}</div>
        </details>
      </section>
    </div>
  );
}
