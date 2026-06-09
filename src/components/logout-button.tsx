import { signOut } from "@/app/auth/actions";

export function LogoutButton() {
  return (
    <form action={signOut} className="ml-auto">
      <button
        type="submit"
        className="text-foreground/70 hover:text-foreground transition-colors"
      >
        Sair
      </button>
    </form>
  );
}
