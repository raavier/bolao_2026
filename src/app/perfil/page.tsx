import { requireUser } from "@/lib/auth";
import { NicknameForm } from "./nickname-form";

export const dynamic = "force-dynamic";

export default async function PerfilPage() {
  const { user, supabase } = await requireUser();

  const { data: me } = await supabase
    .from("participantes")
    .select("nome, nickname, email")
    .eq("id", user.id)
    .single();

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">Seu perfil</h1>
        <p className="text-sm text-foreground/60">
          Escolha um apelido para aparecer no ranking e nos palpites, em vez do
          seu email.
        </p>
      </header>

      <NicknameForm atual={me?.nickname ?? ""} />

      <p className="text-xs text-foreground/40">
        Conta: {me?.email}
      </p>
    </div>
  );
}
