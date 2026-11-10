import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  value: number;
  size?: number;
  interactive?: boolean;
  onChange?: (v: number) => void;
  className?: string;
};

export function RatingStars({ value, size = 16, interactive = false, onChange, className }: Props) {
  return (
    <div className={cn("inline-flex items-center gap-0.5", className)}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= Math.round(value);
        const Icon = (
          <Star
            style={{ width: size, height: size }}
            className={cn(
              filled ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/40",
              interactive && "cursor-pointer transition-transform hover:scale-110",
            )}
          />
        );
        if (!interactive) return <span key={n}>{Icon}</span>;
        return (
          <button key={n} type="button" onClick={() => onChange?.(n)} aria-label={`${n} estrelas`}>
            {Icon}
          </button>
        );
      })}
    </div>
  );
}