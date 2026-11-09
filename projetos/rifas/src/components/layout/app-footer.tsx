export function AppFooter() {
  return (
    <footer className="border-t border-border px-6 py-4">
      <div className="flex flex-col items-center justify-between gap-2 text-xs text-muted-foreground sm:flex-row">
        <p>© {new Date().getFullYear()} RaffleHub. Todos os direitos reservados.</p>
        <p>Sprint 1 — Foundation Platform</p>
      </div>
    </footer>
  );
}
