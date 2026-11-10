import { useState } from "react";
import { Pencil, Trash2, Copy, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useProducts, useUpdateProduct, useDeleteProduct, Product } from "@/hooks/useData";

export function ProductHistory() {
  const { data: products, isLoading } = useProducts();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const { toast } = useToast();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    try {
      await deleteProduct.mutateAsync(id);
      toast({ title: "Deletado", description: "Produto removido com sucesso." });
    } catch {
      toast({ title: "Erro", description: "Erro ao deletar produto.", variant: "destructive" });
    }
  };

  const handleCopy = (message: string) => {
    navigator.clipboard.writeText(message);
    toast({ title: "Copiado!", description: "Mensagem copiada." });
  };

  if (isLoading) {
    return (
      <div className="gradient-card rounded-lg border border-border p-8 text-center">
        <p className="text-muted-foreground">Carregando histórico...</p>
      </div>
    );
  }

  if (!products?.length) {
    return (
      <div className="gradient-card rounded-lg border border-border p-8 text-center">
        <p className="text-muted-foreground">Nenhum produto salvo ainda.</p>
        <p className="text-sm text-muted-foreground mt-1">Cole uma URL acima para começar!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-foreground">
        Histórico ({products.length})
      </h2>

      {products.map((product: Product & { message_templates?: { name: string } | null }) => (
        <div
          key={product.id}
          className="gradient-card rounded-lg border border-border p-4 space-y-3 animate-fade-in"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-primary/20 text-primary uppercase">
                  {product.marketplace || "?"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(product.created_at).toLocaleDateString("pt-BR")}
                </span>
              </div>
              <h3 className="text-sm font-semibold text-foreground truncate">
                {product.product_name || "Produto sem nome"}
              </h3>
              <div className="flex items-center gap-3 mt-1">
                {product.old_price && (
                  <span className="text-xs text-muted-foreground line-through">{product.old_price}</span>
                )}
                {product.new_price && (
                  <span className="text-sm font-semibold text-primary">{product.new_price}</span>
                )}
                {product.installments && (
                  <span className="text-xs text-muted-foreground">{product.installments}</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {product.generated_message && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-primary"
                  onClick={() => handleCopy(product.generated_message!)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              )}
              <a
                href={product.original_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </a>
              <EditProductDialog product={product} onSave={updateProduct.mutateAsync} />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={() => handleDelete(product.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground"
                onClick={() => setExpandedId(expandedId === product.id ? null : product.id)}
              >
                {expandedId === product.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {expandedId === product.id && (
            <div className="space-y-3 pt-3 border-t border-border animate-fade-in">
              <div className="grid grid-cols-1 gap-2">
                <DetailRow label="URL Original" value={product.original_url} />
                <DetailRow label="URL Curta" value={product.short_url || "—"} />
                {product.message_templates && (
                  <DetailRow label="Template" value={product.message_templates.name} />
                )}
              </div>
              {product.generated_message && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Mensagem</p>
                  <pre className="bg-secondary/50 rounded-md p-3 border border-border text-xs text-foreground whitespace-pre-wrap font-sans">
                    {product.generated_message}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-xs text-muted-foreground shrink-0 w-24">{label}:</span>
      <span className="text-xs text-foreground break-all">{value}</span>
    </div>
  );
}

function EditProductDialog({
  product,
  onSave,
}: {
  product: Product;
  onSave: (data: { id: string; original_url?: string; product_name?: string; old_price?: string; new_price?: string; installments?: string }) => Promise<any>;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(product.product_name || "");
  const [originalUrl, setOriginalUrl] = useState(product.original_url);
  const [oldPrice, setOldPrice] = useState(product.old_price || "");
  const [newPrice, setNewPrice] = useState(product.new_price || "");
  const [installments, setInstallments] = useState(product.installments || "");
  const { toast } = useToast();

  const handleSave = async () => {
    try {
      await onSave({
        id: product.id,
        original_url: originalUrl,
        product_name: name,
        old_price: oldPrice,
        new_price: newPrice,
        installments,
      });
      setOpen(false);
      toast({ title: "Salvo", description: "Produto atualizado com sucesso." });
    } catch {
      toast({ title: "Erro", description: "Erro ao salvar.", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Editar Produto</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground">URL Original</label>
            <Input value={originalUrl} onChange={(e) => setOriginalUrl(e.target.value)} className="bg-secondary/50 border-border" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Nome do Produto</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-secondary/50 border-border" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Preço Antigo</label>
              <Input value={oldPrice} onChange={(e) => setOldPrice(e.target.value)} className="bg-secondary/50 border-border" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Preço Novo</label>
              <Input value={newPrice} onChange={(e) => setNewPrice(e.target.value)} className="bg-secondary/50 border-border" />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Parcelas</label>
            <Input value={installments} onChange={(e) => setInstallments(e.target.value)} className="bg-secondary/50 border-border" />
          </div>
          <Button onClick={handleSave} className="w-full gradient-primary text-primary-foreground font-semibold">
            Salvar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
