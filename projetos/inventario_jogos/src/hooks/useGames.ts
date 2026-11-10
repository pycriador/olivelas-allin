import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Game {
  id: string;
  name: string;
  mediaType: string;
  description: string;
  price: string;
  url: string;
  originalText: string;
  createdAt: Date;
}

interface DbGame {
  id: string;
  user_id: string;
  name: string;
  media_type: string | null;
  description: string | null;
  price: string;
  url: string | null;
  original_text: string | null;
  created_at: string;
}

export function useGames() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const mapDbToGame = (dbGame: DbGame): Game => ({
    id: dbGame.id,
    name: dbGame.name,
    mediaType: dbGame.media_type || '',
    description: dbGame.description || '',
    price: dbGame.price,
    url: dbGame.url || '',
    originalText: dbGame.original_text || '',
    createdAt: new Date(dbGame.created_at),
  });

  const fetchGames = useCallback(async () => {
    setLoading(true);
    // Use the public view that doesn't expose user_id
    const { data, error } = await supabase
      .from('games_public')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching games:', error);
    } else {
      // Map from public view (no user_id) to Game type
      setGames((data || []).map((game) => ({
        id: game.id,
        name: game.name,
        mediaType: game.media_type || '',
        description: game.description || '',
        price: game.price,
        url: game.url || '',
        originalText: game.original_text || '',
        createdAt: new Date(game.created_at),
      })));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  const addGame = async (game: Omit<Game, 'id' | 'createdAt'>) => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('games')
      .insert({
        user_id: user.id,
        name: game.name,
        media_type: game.mediaType,
        description: game.description,
        price: game.price,
        url: game.url,
        original_text: game.originalText,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding game:', error);
      return null;
    }

    const newGame = mapDbToGame(data);
    setGames((prev) => [newGame, ...prev]);
    return newGame;
  };

  const updateGame = async (id: string, updates: Partial<Game>) => {
    if (!user) return;

    const dbUpdates: Partial<DbGame> = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.mediaType !== undefined) dbUpdates.media_type = updates.mediaType;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.price !== undefined) dbUpdates.price = updates.price;
    if (updates.url !== undefined) dbUpdates.url = updates.url;
    if (updates.originalText !== undefined) dbUpdates.original_text = updates.originalText;

    const { error } = await supabase
      .from('games')
      .update(dbUpdates)
      .eq('id', id);

    if (error) {
      console.error('Error updating game:', error);
      return;
    }

    setGames((prev) =>
      prev.map((game) => (game.id === id ? { ...game, ...updates } : game))
    );
  };

  const deleteGame = async (id: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('games')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting game:', error);
      return;
    }

    setGames((prev) => prev.filter((game) => game.id !== id));
  };

  const parseAndAddGame = async (text: string): Promise<Game | null> => {
    if (!user) return null;

    // Extract URL (https or http)
    const urlMatch = text.match(/(https?:\/\/[^\s]+)/i);
    const url = urlMatch ? urlMatch[1] : '';
    
    // Extract price (after R$)
    const priceMatch = text.match(/R\$\s*([\d.,]+)/i);
    const price = priceMatch ? `R$ ${priceMatch[1].trim()}` : '';
    
    // Extract media type (content inside parentheses)
    const mediaTypeMatch = text.match(/\(([^)]+)\)/);
    const mediaType = mediaTypeMatch ? mediaTypeMatch[1].trim() : '';
    
    // Extract game name (everything before the first parenthesis)
    let name = '';
    const parenIndex = text.indexOf('(');
    if (parenIndex > 0) {
      name = text.substring(0, parenIndex).trim();
    } else {
      // Fallback: remove URL and price from text
      name = text
        .replace(urlMatch?.[0] || '', '')
        .replace(/R\$\s*[\d.,]+/i, '')
        .replace(/Por\s*/i, '')
        .replace(/\s+/g, ' ')
        .trim();
    }
    
    if (!name && !url && !price) {
      return null;
    }

    return addGame({
      name: name || 'Jogo sem nome',
      mediaType: mediaType || '',
      description: '',
      price: price || 'Preço não informado',
      url,
      originalText: text,
    });
  };

  const importFromJson = async (jsonData: string): Promise<{ success: number; failed: number }> => {
    if (!user) return { success: 0, failed: 0 };

    try {
      const data = JSON.parse(jsonData);
      
      if (!Array.isArray(data)) {
        return { success: 0, failed: 1 };
      }

      let success = 0;
      let failed = 0;

      for (const item of data) {
        const game = {
          name: item.nome || item.name || '',
          mediaType: item.tipo_midia || item.mediaType || '',
          description: item.descricao || item.description || '',
          price: item.preco || item.price || 'Preço não informado',
          url: item.url || '',
          originalText: item.texto_original || item.originalText || '',
        };

        if (game.name) {
          const result = await addGame(game);
          if (result) {
            success++;
          } else {
            failed++;
          }
        } else {
          failed++;
        }
      }

      return { success, failed };
    } catch {
      return { success: 0, failed: 1 };
    }
  };

  return {
    games,
    loading,
    addGame,
    updateGame,
    deleteGame,
    parseAndAddGame,
    importFromJson,
    refetch: fetchGames,
  };
}
