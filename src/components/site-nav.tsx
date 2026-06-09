import { createClient } from "@/lib/supabase/server";
import { NavMenu, type NavLink } from "./nav-menu";

const BASE_LINKS: NavLink[] = [
  { href: "/ranking", label: "Ranking" },
  { href: "/grupos", label: "Grupos" },
  { href: "/jogos", label: "Jogos" },
  { href: "/palpites", label: "Meus palpites" },
  { href: "/regras", label: "Regras" },
];

export async function SiteNav() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAdmin = user
    ? Boolean(
        (
          await supabase
            .from("participantes")
            .select("is_admin")
            .eq("id", user.id)
            .single()
        ).data?.is_admin,
      )
    : false;

  const links: NavLink[] = [...BASE_LINKS];
  if (isAdmin) links.push({ href: "/admin", label: "Admin" });
  if (user) links.push({ href: "/perfil", label: "Perfil" });

  return <NavMenu links={links} isLoggedIn={Boolean(user)} />;
}
