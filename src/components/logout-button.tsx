import { signOut } from "@/app/auth/actions";

export function LogoutButton() {
  return (
    <form action={signOut}>
      <button
        type="submit"
        className="text-foreground/70 hover:text-foreground transition-colors"
      >
        Sair
      </button>
    </form>
  );
}
