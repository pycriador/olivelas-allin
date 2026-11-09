import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ title = "Something went wrong", message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-destructive/30 bg-destructive/5 py-12 px-6 text-center">
      <AlertTriangle className="mb-3 h-6 w-6 text-destructive" />
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {message && <p className="mt-1 max-w-md text-sm text-muted-foreground">{message}</p>}
      {onRetry && (
        <Button onClick={onRetry} size="sm" variant="outline" className="mt-4">
          Try again
        </Button>
      )}
    </div>
  );
}
