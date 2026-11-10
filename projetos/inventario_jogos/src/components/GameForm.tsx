import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Game } from '@/hooks/useGames';
import { Save, X } from 'lucide-react';

interface GameFormProps {
  game?: Game | null;
  open: boolean;
  onClose: () => void;
  onSave: (game: Omit<Game, 'id' | 'createdAt'>) => void;
  onUpdate?: (id: string, game: Partial<Game>) => void;
}

export function GameForm({ game, open, onClose, onSave, onUpdate }: GameFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    mediaType: '',
    description: '',
    price: '',
    url: '',
    originalText: '',
  });

  useEffect(() => {
    if (game) {
      setFormData({
        name: game.name,
        mediaType: game.mediaType,
        description: game.description,
        price: game.price,
        url: game.url,
        originalText: game.originalText,
      });
    } else {
      setFormData({
        name: '',
        mediaType: '',
        description: '',
        price: '',
        url: '',
        originalText: '',
      });
    }
  }, [game, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (game && onUpdate) {
      onUpdate(game.id, formData);
    } else {
      onSave(formData);
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="bg-card border-border max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {game ? 'Editar Jogo' : 'Adicionar Jogo'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Jogo</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nome do jogo"
              className="bg-secondary border-border"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mediaType">Tipo de Mídia</Label>
            <Input
              id="mediaType"
              value={formData.mediaType}
              onChange={(e) => setFormData({ ...formData, mediaType: e.target.value })}
              placeholder="Ex: Midia Fisica, Digital, PS5..."
              className="bg-secondary border-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Adicione uma descrição do produto..."
              className="bg-secondary border-border min-h-[80px] resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Preço</Label>
              <Input
                id="price"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="R$ 99,99"
                className="bg-secondary border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://..."
                className="bg-secondary border-border"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="originalText">Texto Original</Label>
            <Textarea
              id="originalText"
              value={formData.originalText}
              onChange={(e) => setFormData({ ...formData, originalText: e.target.value })}
              placeholder="Texto original da fonte..."
              className="bg-secondary border-border font-mono text-sm min-h-[60px] resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-border hover:bg-secondary"
            >
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Save className="w-4 h-4 mr-2" />
              Salvar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
