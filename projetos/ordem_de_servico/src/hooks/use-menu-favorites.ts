import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "sf-menu-favorites";

function loadFavorites(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return new Set(JSON.parse(raw));
  } catch { /* ignore */ }
  return new Set();
}

function saveFavorites(favorites: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...favorites]));
}

export function useMenuFavorites() {
  const [favorites, setFavorites] = useState<Set<string>>(loadFavorites);

  useEffect(() => {
    const handler = () => setFavorites(loadFavorites());
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const isFavorite = useCallback(
    (path: string) => favorites.has(path),
    [favorites],
  );

  const toggleFavorite = useCallback((path: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      saveFavorites(next);
      return next;
    });
  }, []);

  return { favorites, isFavorite, toggleFavorite };
}
