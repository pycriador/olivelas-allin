import { Link, useRouter } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { LayoutDashboard, LogOut, Sparkles, Trophy } from "lucide-react";
import { motion } from "framer-motion";

export function AppHeader() {
  const { user, isAdmin, signOut } = useAuth();
  const router = useRouter();

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex h-14 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <motion.div
            initial={{ rotate: -10, scale: 0.9 }}
            animate={{ rotate: 0, scale: 1 }}
            className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground">
            <Trophy className="w-4 h-4" />
          </motion.div>
          <span>Olivelas <span className="text-muted-foreground font-normal">· Álbum de Figurinhas Digital</span></span>
        </Link>
        <nav className="flex items-center gap-1">
          {isAdmin && (
            <Button asChild variant="ghost" size="sm">
              <Link to="/admin"><LayoutDashboard className="w-4 h-4 mr-1.5" /> Admin</Link>
            </Button>
          )}
          {!user ? (
            <Button asChild size="sm" variant="outline">
              <Link to="/auth"><Sparkles className="w-4 h-4 mr-1.5" /> Entrar / Criar conta</Link>
            </Button>
          ) : (
            <Button size="sm" variant="ghost" onClick={() => { signOut(); router.navigate({ to: "/" }); }}>
              <LogOut className="w-4 h-4 mr-1.5" /> Sair
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}