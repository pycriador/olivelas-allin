import { useRef, useState } from "react";
import { Plus, Pencil, Trash2, FileText, Download, Upload, AlertTriangle, X } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useTemplates, useCreateTemplate, useUpdateTemplate, useDeleteTemplate, Template } from "@/hooks/useData";
import { TemplateBuilder } from "@/components/TemplateBuilder";


export function TemplateManager() {
  const { data: templates, isLoading } = useTemplates();
  const createTemplate = useCreateTemplate();
  const updateTemplate = useUpdateTemplate();
  const deleteTemplate = useDeleteTemplate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [importErrors, setImportErrors] = useState<string[]>([]);


  const handleDelete = async (id: string) => {
    try {
      await deleteTemplate.mutateAsync(id);
      toast({ title: "Deletado", description: "Template removido." });
    } catch {
      toast({ title: "Erro", description: "Erro ao deletar template.", variant: "destructive" });
    }
  };

  const handleExport = () => {
    if (!templates?.length) {
      toast({ title: "Nada para exportar", description: "Você ainda não tem templates.", variant: "destructive" });
      return;
    }
    const payload = {
      version: 1,
      exported_at: new Date().toISOString(),
      templates: templates.map((t: Template) => ({ name: t.name, content: t.content })),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `templates-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exportado", description: `${payload.templates.length} template(s) salvos em arquivo.` });
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setImportErrors([]);
    setImporting(true);

    const fail = (title: string, errors: string[]) => {
      setImportErrors(errors);
      toast({ title, description: errors[0], variant: "destructive" });
    };

    try {
      if (file.size > 1_000_000) {
        fail("Arquivo muito grande", ["O arquivo deve ter no máximo 1 MB."]);
        return;
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(await file.text());
      } catch {
        fail("JSON inválido", ["Não foi possível ler o arquivo: o conteúdo não é um JSON válido."]);
        return;
      }

      const fileSchema = z.union([
        z.array(z.unknown()),
        z.object({ templates: z.array(z.unknown()) }),
      ]);
      const fileResult = fileSchema.safeParse(parsed);
      if (!fileResult.success) {
        fail("Formato inesperado", [
          'O arquivo deve conter uma lista de templates ou um objeto com o campo "templates".',
        ]);
        return;
      }

      const list = Array.isArray(fileResult.data) ? fileResult.data : fileResult.data.templates;
      if (list.length === 0) {
        fail("Arquivo vazio", ["Nenhum template encontrado no arquivo."]);
        return;
      }

      const templateSchema = z.object({
        name: z
          .string({ required_error: 'campo "name" é obrigatório', invalid_type_error: 'campo "name" deve ser texto' })
          .trim()
          .min(1, 'campo "name" não pode ficar vazio')
          .max(100, 'campo "name" deve ter no máximo 100 caracteres'),
        content: z
          .string({ required_error: 'campo "content" é obrigatório', invalid_type_error: 'campo "content" deve ser texto' })
          .trim()
          .min(1, 'campo "content" não pode ficar vazio')
          .max(5000, 'campo "content" deve ter no máximo 5000 caracteres'),
      });

      const errors: string[] = [];
      const valid: { name: string; content: string }[] = [];
      const seen = new Set<string>();

      list.forEach((item, i) => {
        const label = `Template #${i + 1}`;
        if (typeof item !== "object" || item === null || Array.isArray(item)) {
          errors.push(`${label}: deve ser um objeto com "name" e "content".`);
          return;
        }
        const result = templateSchema.safeParse(item);
        if (!result.success) {
          result.error.issues.forEach((issue) => errors.push(`${label}: ${issue.message}`));
          return;
        }
        const key = result.data.name.toLowerCase();
        if (seen.has(key)) {
          errors.push(`${label}: nome duplicado no arquivo ("${result.data.name}").`);
          return;
        }
        seen.add(key);
        valid.push({ name: result.data.name as string, content: result.data.content as string });
      });

      if (!valid.length) {
        fail("Nenhum template válido", errors);
        return;
      }

      const failures: string[] = [];
      let imported = 0;
      for (const t of valid) {
        try {
          await createTemplate.mutateAsync({ name: t.name, content: t.content });
          imported++;
        } catch {
          failures.push(`"${t.name}": falha ao salvar no servidor.`);
        }
      }

      const allErrors = [...errors, ...failures];
      setImportErrors(allErrors);
      toast({
        title: allErrors.length ? "Importado parcialmente" : "Importado",
        description: allErrors.length
          ? `${imported} template(s) adicionados, ${allErrors.length} com problema.`
          : `${imported} template(s) adicionados.`,
        variant: allErrors.length ? "destructive" : undefined,
      });
    } finally {
      setImporting(false);
    }
  };



  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Templates de Mensagem
        </h2>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={handleImport}
          />
          <Button size="sm" variant="outline" onClick={handleExport} className="border-border">
            <Download className="h-4 w-4 mr-1" />
            Exportar
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={importing}
            onClick={() => fileInputRef.current?.click()}
            className="border-border"
          >
            <Upload className="h-4 w-4 mr-1" />
            {importing ? "Importando..." : "Importar"}
          </Button>
          <CreateTemplateDialog onCreate={createTemplate.mutateAsync} />
        </div>
      </div>

      {importErrors.length > 0 && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium text-destructive flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Problemas na importação ({importErrors.length})
            </p>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-destructive"
              onClick={() => setImportErrors([])}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <ul className="list-disc pl-5 space-y-1 text-xs text-destructive max-h-40 overflow-y-auto">
            {importErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}


      <div className="space-y-2 text-xs text-muted-foreground bg-secondary/30 rounded-md p-3 border border-border">
        <p className="font-medium text-foreground text-sm">Variáveis disponíveis:</p>
        <div className="flex flex-wrap gap-2">
          {["{{nome_produto}}", "{{preco_antigo}}", "{{preco_novo}}", "{{parcelas}}", "{{link}}"].map((v) => (
            <code key={v} className="bg-primary/10 text-primary px-2 py-0.5 rounded font-mono text-xs">
              {v}
            </code>
          ))}
        </div>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground text-center py-4">Carregando...</p>
      ) : (
        <div className="space-y-3">
          {templates?.map((template: Template) => (
            <div
              key={template.id}
              className="gradient-card rounded-lg border border-border p-4 space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-foreground">{template.name}</h3>
                  {template.is_default && (
                    <span className="text-xs px-2 py-0.5 rounded bg-primary/20 text-primary">Padrão</span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <EditTemplateDialog template={template} onSave={updateTemplate.mutateAsync} />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(template.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <pre className="bg-secondary/50 rounded-md p-3 border border-border text-xs text-muted-foreground whitespace-pre-wrap font-sans">
                {template.content}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CreateTemplateDialog({
  onCreate,
}: {
  onCreate: (data: { name: string; content: string }) => Promise<any>;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const { toast } = useToast();

  const handleCreate = async () => {
    if (!name.trim() || !content.trim()) {
      toast({ title: "Erro", description: "Preencha todos os campos.", variant: "destructive" });
      return;
    }
    try {
      await onCreate({ name, content });
      setOpen(false);
      setName("");
      setContent("");
      toast({ title: "Criado", description: "Template criado com sucesso." });
    } catch {
      toast({ title: "Erro", description: "Erro ao criar template.", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gradient-primary text-primary-foreground font-semibold glow-primary">
          <Plus className="h-4 w-4 mr-1" />
          Novo
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-foreground">Novo Template</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <TemplateBuilder name={name} content={content} onNameChange={setName} onContentChange={setContent} />
          <Button onClick={handleCreate} className="w-full gradient-primary text-primary-foreground font-semibold">
            Criar Template
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EditTemplateDialog({
  template,
  onSave,
}: {
  template: Template;
  onSave: (data: { id: string; name?: string; content?: string }) => Promise<any>;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(template.name);
  const [content, setContent] = useState(template.content);
  const { toast } = useToast();

  const handleSave = async () => {
    try {
      await onSave({ id: template.id, name, content });
      setOpen(false);
      toast({ title: "Salvo", description: "Template atualizado." });
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
      <DialogContent className="bg-card border-border max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-foreground">Editar Template</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <TemplateBuilder name={name} content={content} onNameChange={setName} onContentChange={setContent} />
          <Button onClick={handleSave} className="w-full gradient-primary text-primary-foreground font-semibold">
            Salvar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
