import { useEffect, useRef, useState } from "react";

/** Relógio leve que atualiza a cada `intervalMs`. */
export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}

export function formatRemaining(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (value: number) => String(value).padStart(2, "0");
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;
}

export interface UseCountdownOptions {
  onExpire?: () => void;
}

export interface Countdown {
  remainingMs: number;
  remainingSeconds: number;
  expired: boolean;
  formatted: string;
}

/** Contador regressivo até `until`; chama `onExpire` uma única vez ao zerar. */
export function useCountdown(until: string | null, options?: UseCountdownOptions): Countdown {
  const onExpireRef = useRef(options?.onExpire);
  onExpireRef.current = options?.onExpire;

  const now = useNow(1000);
  const target = until ? new Date(until).getTime() : null;
  const remainingMs = target == null ? 0 : Math.max(0, target - now);
  const expired = target != null && remainingMs <= 0;

  const firedRef = useRef(false);
  useEffect(() => {
    if (expired && !firedRef.current) {
      firedRef.current = true;
      onExpireRef.current?.();
    }
    if (until == null) {
      firedRef.current = false;
    }
  }, [expired, until]);

  return {
    remainingMs,
    remainingSeconds: Math.floor(remainingMs / 1000),
    expired,
    formatted: formatRemaining(remainingMs),
  };
}
