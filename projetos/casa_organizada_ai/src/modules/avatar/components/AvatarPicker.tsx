import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Check, Upload, Image as ImageIcon, Search } from "lucide-react";
import { listAvatars } from "@/modules/avatar/avatars.functions";
import { AVATAR_COLORS, generateAvatarSvg, type Avatar, type AvatarCategory, type AvatarColors } from "@/modules/avatar/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface AvatarPickerProps {
  currentAvatarId: string | null;
  currentAvatarType: string;
  currentPhotoUrl: string | null;
  onSelect: (avatarId: string, type: 'library' | 'upload', photoUrl?: string) => void;
  onRemove: () => void;
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const categories: { value: string; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'illustration', label: 'Ilustração' },
  { value: 'animal', label: 'Animal' },
  { value: 'nature', label: 'Natureza' },
  { value: 'abstract', label: 'Abstrato' },
  { value: 'emoji', label: 'Emoji' },
  { value: 'character', label: 'Personagem' },
];

export function AvatarPicker({
  currentAvatarId,
  currentAvatarType,
  currentPhotoUrl,
  onSelect,
  onRemove,
  children,
  open: controlledOpen,
  onOpenChange,
}: AvatarPickerProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  const listFn = useServerFn(listAvatars);
  const { data: avatars, isLoading } = useQuery({
    queryKey: ['avatars'],
    queryFn: () => listFn(),
  });

  const filtered = ((avatars ?? []) as unknown as Avatar[]).filter((a: Avatar) => {
    if (search && !a.name.toLowerCase().includes(search.toLowerCase()) && !a.tags.some(t => t.includes(search))) return false;
    if (activeCategory !== 'all' && a.category !== activeCategory) return false;
    return true;
  });

  function getAvatarColors(avatar: Avatar): AvatarColors {
    return AVATAR_COLORS[avatar.slug.replace('avatar-', '')] ?? AVATAR_COLORS.default;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[650px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Escolher Avatar</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="library">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="library">Biblioteca</TabsTrigger>
            <TabsTrigger value="upload">Upload</TabsTrigger>
          </TabsList>

          <TabsContent value="library" className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar avatar..."
                  className="pl-8"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setActiveCategory(cat.value)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                    activeCategory === cat.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-accent",
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>
            <ScrollArea className="h-[350px]">
              {isLoading ? (
                <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">Carregando...</div>
              ) : filtered.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">Nenhum avatar encontrado.</div>
              ) : (
                <div className="grid grid-cols-5 gap-3">
                  {filtered.map((avatar: Avatar) => {
                    const colors = getAvatarColors(avatar);
                    const isSelected = currentAvatarType === 'library' && currentAvatarId === avatar.id;
                    return (
                      <button
                        key={avatar.id}
                        type="button"
                        onClick={() => onSelect(avatar.id, 'library')}
                        className={cn(
                          "group relative flex flex-col items-center gap-1 rounded-xl p-2 transition-all hover:bg-accent",
                          isSelected && "ring-2 ring-primary ring-offset-2",
                        )}
                        title={avatar.name}
                      >
                        <div className="h-14 w-14 rounded-lg overflow-hidden">
                          <svg viewBox="0 0 100 100" className="h-full w-full">
                            <rect width="100" height="100" rx="20" fill={colors.bg} />
                            <circle cx="50" cy="38" r="18" fill={colors.fg} opacity="0.9" />
                            <ellipse cx="50" cy="72" rx="30" ry="22" fill={colors.fg} opacity="0.7" />
                            <circle cx="42" cy="34" r="2.5" fill={colors.bg} opacity="0.8" />
                            <circle cx="58" cy="34" r="2.5" fill={colors.bg} opacity="0.8" />
                            <path d="M42 44 Q50 50 58 44" stroke={colors.bg} strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.8" />
                          </svg>
                        </div>
                        <span className="text-[10px] text-muted-foreground truncate max-w-full">{avatar.name}</span>
                        {isSelected && (
                          <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                            <Check className="h-3 w-3" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="upload" className="space-y-4">
            <div className="flex flex-col items-center gap-4 py-6">
              <div className="flex h-32 w-32 items-center justify-center rounded-full border-2 border-dashed border-muted-foreground/30 bg-muted/30">
                {currentPhotoUrl ? (
                  <img src={currentPhotoUrl} alt="Foto" className="h-full w-full rounded-full object-cover" />
                ) : (
                  <ImageIcon className="h-10 w-10 text-muted-foreground/50" />
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/png,image/jpeg,image/webp';
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) {
                      const url = URL.createObjectURL(file);
                      onSelect('', 'upload', url);
                    }
                  };
                  input.click();
                }}>
                  <Upload className="mr-1.5 h-4 w-4" />
                  Enviar foto
                </Button>
                {currentPhotoUrl && (
                  <Button variant="ghost" size="sm" onClick={onRemove}>
                    Remover
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">Formatos: PNG, JPG, JPEG, WEBP</p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
