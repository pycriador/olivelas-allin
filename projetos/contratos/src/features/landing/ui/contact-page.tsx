import { useState } from "react";
import { CheckCircle2, Loader2, Mail, MapPin, MessageSquare } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PublicLayout } from "@/layouts/public-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";

const contactSchema = z.object({
  name: z.string().min(2, "Informe seu nome"),
  email: z.string().email("Email inválido"),
  subject: z.string().min(4, "Informe o assunto"),
  message: z.string().min(10, "Descreva sua mensagem com mais detalhes"),
});

type ContactFormValues = z.infer<typeof contactSchema>;

export function ContactPage() {
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", email: "", subject: "", message: "" },
  });

  const onSubmit = async (values: ContactFormValues) => {
    setSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 600));
      console.info("Contact submission (placeholder):", values);
      setSent(true);
      toast.success("Mensagem enviada! Retornaremos em breve.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PublicLayout>
      <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-semibold tracking-tight">Fale conosco</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Dúvidas, demonstrações ou parcerias. Nossa equipe responde em até 1 dia útil.
          </p>
        </div>

        <div className="mt-12 grid gap-10 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-2">
            {[
              {
                icon: Mail,
                title: "Email",
                value: "contato@clauseforge.app",
              },
              {
                icon: MessageSquare,
                title: "Suporte",
                value: "Suporte prioritário para planos Business e Enterprise",
              },
              {
                icon: MapPin,
                title: "Escritório",
                value: "São Paulo, Brasil · Atendimento global",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="flex gap-4 rounded-xl border border-border/60 bg-muted/30 p-5"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <item.icon className="size-5" aria-hidden />
                </div>
                <div>
                  <h3 className="font-medium">{item.title}</h3>
                  <p className="mt-0.5 text-sm text-muted-foreground">{item.value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-3">
            {sent ? (
              <div className="flex flex-col items-center gap-4 rounded-xl border border-border/60 p-12 text-center">
                <CheckCircle2 className="size-12 text-primary" />
                <h2 className="text-xl font-semibold">Mensagem enviada!</h2>
                <p className="text-sm text-muted-foreground">
                  Retornaremos pelo email informado em até 1 dia útil.
                </p>
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome</FormLabel>
                          <FormControl>
                            <Input placeholder="Seu nome" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="voce@empresa.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assunto</FormLabel>
                        <FormControl>
                          <Input placeholder="Demonstração, dúvida, parceria..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mensagem</FormLabel>
                        <FormControl>
                          <Textarea rows={5} placeholder="Como podemos ajudar?" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full sm:w-auto"
                    disabled={submitting}
                  >
                    {submitting && <Loader2 className="mr-2 size-4 animate-spin" />}
                    Enviar mensagem
                  </Button>
                </form>
              </Form>
            )}
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
