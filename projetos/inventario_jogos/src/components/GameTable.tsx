import { Game } from '@/hooks/useGames';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Edit2, Trash2, ExternalLink, GamepadIcon } from 'lucide-react';

interface GameTableProps {
  games: Game[];
  onEdit: (game: Game) => void;
  onDelete: (id: string) => void;
  canEdit?: boolean;
}

export function GameTable({ games, onEdit, onDelete, canEdit = false }: GameTableProps) {
  if (games.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-12 text-center">
        <GamepadIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
        <h3 className="text-lg font-medium text-muted-foreground">Nenhum jogo na lista</h3>
        <p className="text-sm text-muted-foreground/70 mt-1">
          {canEdit 
            ? 'Use o parser acima para adicionar jogos automaticamente.'
            : 'Faça login para adicionar jogos à lista.'}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            <TableHead className="text-primary font-semibold">Nome</TableHead>
            <TableHead className="text-primary font-semibold">Tipo de Mídia</TableHead>
            <TableHead className="text-primary font-semibold">Descrição</TableHead>
            <TableHead className="text-primary font-semibold">Preço</TableHead>
            <TableHead className="text-primary font-semibold">URL</TableHead>
            {canEdit && (
              <TableHead className="text-primary font-semibold max-w-[200px]">Texto Original</TableHead>
            )}
            {canEdit && (
              <TableHead className="text-primary font-semibold text-right">Ações</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {games.map((game) => (
            <TableRow 
              key={game.id} 
              className="border-border hover:bg-secondary/50 animate-fade-in"
            >
              <TableCell className="font-medium">
                {game.name}
              </TableCell>
              <TableCell>
                {game.mediaType ? (
                  <span className="px-2 py-1 text-xs rounded-md bg-accent/20 text-accent font-medium">
                    {game.mediaType}
                  </span>
                ) : (
                  <span className="text-muted-foreground italic opacity-50">-</span>
                )}
              </TableCell>
              <TableCell className="text-muted-foreground max-w-[250px]">
                <span className="line-clamp-2">
                  {game.description || <span className="italic opacity-50">Sem descrição</span>}
                </span>
              </TableCell>
              <TableCell>
                <span className="text-success font-mono font-medium">
                  {game.price}
                </span>
              </TableCell>
              <TableCell className="max-w-[200px]">
                {game.url ? (
                  <a
                    href={game.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent hover:text-accent/80 transition-colors flex items-center gap-1 text-xs font-mono truncate"
                  >
                    <ExternalLink className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{game.url}</span>
                  </a>
                ) : (
                  <span className="text-muted-foreground italic opacity-50">-</span>
                )}
              </TableCell>
              {canEdit && (
                <TableCell className="max-w-[200px]">
                  <span className="text-xs font-mono text-muted-foreground line-clamp-2">
                    {game.originalText || '-'}
                  </span>
                </TableCell>
              )}
              {canEdit && (
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(game)}
                      className="hover:bg-primary/20 hover:text-primary"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(game.id)}
                      className="hover:bg-destructive/20 hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
