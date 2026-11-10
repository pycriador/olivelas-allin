import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface GameParserProps {
  onParse: (text: string) => Promise<boolean>;
}

export function GameParser({ onParse }: GameParserProps) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleParse = async () => {
    if (!text.trim()) {
      toast({
        title: 'Texto vazio',
        description: 'Cole o texto com as informações do jogo.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    const success = await onParse(text.trim());
    setLoading(false);

    if (success) {
      setText('');
      toast({
        title: 'Jogo adicionado!',
        description: 'O jogo foi parseado e adicionado à lista.',
      });
    } else {
      toast({
        title: 'Erro ao parsear',
        description: 'Não foi possível extrair informações do texto.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">Parser de Jogos</h2>
      </div>
      
      <p className="text-sm text-muted-foreground">
        Cole o texto com nome do jogo, preço e URL. O parser vai tentar extrair as informações automaticamente.
      </p>
      
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Ex: Deaths Door PS5 (Midia Fisica) Por R$139,89 https://s.shopee.com.br/..."
        className="min-h-[100px] bg-secondary border-border font-mono text-sm resize-none focus:ring-primary"
      />
      
      <Button 
        onClick={handleParse}
        disabled={loading}
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 glow-primary"
      >
        <Plus className="w-4 h-4 mr-2" />
        {loading ? 'Adicionando...' : 'Parsear e Adicionar'}
      </Button>
    </div>
  );
}
