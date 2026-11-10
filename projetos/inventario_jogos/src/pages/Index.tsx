import { useState, useRef } from 'react';
import { useGames } from '@/hooks/useGames';
import { useAuth } from '@/hooks/useAuth';
import { GameParser } from '@/components/GameParser';
import { GameTable } from '@/components/GameTable';
import { GameForm } from '@/components/GameForm';
import { AuthModal } from '@/components/AuthModal';
import { Button } from '@/components/ui/button';
import { Game } from '@/hooks/useGames';
import { Plus, Gamepad2, Download, Upload, LogIn, LogOut, User, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';

const Index = () => {
  const { games, loading, addGame, updateGame, deleteGame, parseAndAddGame, importFromJson } = useGames();
  const { user, loading: authLoading, signOut } = useAuth();
  const { toast } = useToast();
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredGames = games.filter(game =>
    game.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleParse = async (text: string): Promise<boolean> => {
    if (!user) {
      toast({
        title: 'Login necessário',
        description: 'Faça login para adicionar jogos.',
        variant: 'destructive',
      });
      setIsAuthOpen(true);
      return false;
    }
    const result = await parseAndAddGame(text);
    return result !== null;
  };

  const handleAddManual = () => {
    if (!user) {
      toast({
        title: 'Login necessário',
        description: 'Faça login para adicionar jogos.',
        variant: 'destructive',
      });
      setIsAuthOpen(true);
      return;
    }
    setEditingGame(null);
    setIsFormOpen(true);
  };

  const handleEdit = (game: Game) => {
    if (!user) {
      toast({
        title: 'Login necessário',
        description: 'Faça login para editar jogos.',
        variant: 'destructive',
      });
      setIsAuthOpen(true);
      return;
    }
    setEditingGame(game);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!user) {
      toast({
        title: 'Login necessário',
        description: 'Faça login para deletar jogos.',
        variant: 'destructive',
      });
      setIsAuthOpen(true);
      return;
    }
    await deleteGame(id);
    toast({
      title: 'Jogo removido',
      description: 'O jogo foi removido da lista.',
    });
  };

  const handleSave = async (gameData: Omit<Game, 'id' | 'createdAt'>) => {
    await addGame(gameData);
  };

  const handleUpdate = async (id: string, updates: Partial<Game>) => {
    await updateGame(id, updates);
  };

  const handleExport = () => {
    const data = games.map(g => ({
      nome: g.name,
      tipo_midia: g.mediaType,
      descricao: g.description,
      preco: g.price,
      url: g.url,
    }));
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lista-jogos.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    if (!user) {
      toast({
        title: 'Login necessário',
        description: 'Faça login para importar jogos.',
        variant: 'destructive',
      });
      setIsAuthOpen(true);
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const text = await file.text();
      const result = await importFromJson(text);
      
      if (result.success > 0) {
        toast({
          title: 'Importação concluída',
          description: `${result.success} jogo(s) importado(s) com sucesso.${result.failed > 0 ? ` ${result.failed} falhou.` : ''}`,
        });
      } else {
        toast({
          title: 'Erro na importação',
          description: 'Nenhum jogo foi importado. Verifique o formato do arquivo.',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Erro na importação',
        description: 'Não foi possível ler o arquivo.',
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: 'Logout realizado',
      description: 'Você foi desconectado.',
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center glow-primary">
                <Gamepad2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gradient">Olivelas - Inventário de Jogos & Mídias</h1>
                <p className="text-xs text-muted-foreground">Organize sua lista de downloads</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {user ? (
                <>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mr-2">
                    <User className="w-4 h-4" />
                    <span className="hidden sm:inline">{user.email}</span>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleImport}
                    disabled={isImporting}
                    className="border-border hover:bg-secondary"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {isImporting ? 'Importando...' : 'Importar'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleExport}
                    disabled={games.length === 0}
                    className="border-border hover:bg-secondary"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Exportar
                  </Button>
                  <Button
                    onClick={handleAddManual}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Adicionar Manual</span>
                    <span className="sm:hidden">Adicionar</span>
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={handleSignOut}
                    className="hover:bg-destructive/20 hover:text-destructive"
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={handleExport}
                    disabled={games.length === 0}
                    className="border-border hover:bg-secondary"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Exportar
                  </Button>
                  <Button
                    onClick={() => setIsAuthOpen(true)}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <LogIn className="w-4 h-4 mr-2" />
                    Entrar
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Parser Section - only show when logged in */}
        {user && <GameParser onParse={handleParse} />}

        {/* Search and Stats */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">
            Lista de Jogos 
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({filteredGames.length} {filteredGames.length === 1 ? 'item' : 'itens'}{searchTerm && ` de ${games.length}`})
            </span>
          </h2>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-card border-border"
            />
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="bg-card border border-border rounded-lg p-12 text-center">
            <div className="text-muted-foreground">Carregando jogos...</div>
          </div>
        ) : (
          <GameTable 
            games={filteredGames} 
            onEdit={handleEdit} 
            onDelete={handleDelete}
            canEdit={!!user}
          />
        )}
      </main>

      {/* Form Dialog */}
      <GameForm
        game={editingGame}
        open={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingGame(null);
        }}
        onSave={handleSave}
        onUpdate={handleUpdate}
      />

      {/* Auth Modal */}
      <AuthModal 
        open={isAuthOpen} 
        onClose={() => setIsAuthOpen(false)} 
      />

      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
};

export default Index;
