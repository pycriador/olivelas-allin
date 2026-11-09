import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import { CircleHelp } from "lucide-react";

interface DocButtonProps {
  module: string;
  page: string;
  title?: string;
}

export function DocButton({ module, page, title }: DocButtonProps) {
  const [open, setOpen] = useState(false);
  const docPath = `/docs/${module}/${page}.md`;

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)} className="h-7 w-7 p-0" title="Ajuda">
        <CircleHelp className="h-4 w-4 text-muted-foreground hover:text-foreground" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[70vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{title ?? "Documentação"}</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-muted-foreground space-y-4">
            <p>Documentação da página <strong>{page}</strong> do módulo <strong>{module}</strong>.</p>
            <p>Para documentação completa, consulte o arquivo:</p>
            <code className="block bg-muted p-2 rounded text-xs">{docPath}</code>
            <p className="text-xs text-muted-foreground">ServiceForge Platform v1.0.0-RC1</p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
