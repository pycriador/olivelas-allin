import { Link, Outlet, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useAuthStore } from "@/stores/auth-store";

export function AuthLayout() {
  const router = useRouter();
  const { user, isHydrated } = useAuthStore();

  useEffect(() => {
    if (isHydrated && user) {
      router.navigate({ to: "/dashboard" });
    }
  }, [isHydrated, user, router]);

  return (
    <div className="hero-bg flex min-h-screen flex-col">
      <header className="flex items-center justify-between px-6 py-5">
        <Link to="/">
          <Logo size="sm" />
        </Link>
        <div className="flex items-center gap-1">
          <LanguageSwitcher compact />
          <ThemeToggle />
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </main>
      <footer className="px-6 py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} IAM Pro Forms
      </footer>
    </div>
  );
}
