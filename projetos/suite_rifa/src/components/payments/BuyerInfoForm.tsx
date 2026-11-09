import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface BuyerInfoFormProps {
  onSubmit: (data: { name: string; phone: string; email: string; document: string }) => void;
  isPending?: boolean;
}

export function BuyerInfoForm({ onSubmit, isPending }: BuyerInfoFormProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [document, setDocument] = useState("");

  const canSubmit = name.trim().length >= 2 && phone.trim().length >= 8;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!canSubmit) return;
        onSubmit({ name: name.trim(), phone: phone.trim(), email: email.trim(), document: document.trim() });
      }}
      className="space-y-4"
    >
      <div className="space-y-2">
        <Label htmlFor="buyer-name">Nome completo *</Label>
        <Input
          id="buyer-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Seu nome"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="buyer-phone">Telefone / WhatsApp *</Label>
        <Input
          id="buyer-phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="(11) 99999-9999"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="buyer-email">E-mail</Label>
        <Input
          id="buyer-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@exemplo.com"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="buyer-document">CPF / Documento</Label>
        <Input
          id="buyer-document"
          value={document}
          onChange={(e) => setDocument(e.target.value)}
          placeholder="000.000.000-00"
        />
      </div>
      <Button type="submit" className="w-full" disabled={!canSubmit || isPending}>
        {isPending ? "Processando…" : "Continuar"}
      </Button>
    </form>
  );
}
