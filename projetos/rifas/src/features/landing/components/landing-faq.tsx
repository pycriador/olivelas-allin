import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function LandingFaq() {
  const faqs = [
    {
      q: "O que é o RaffleHub e como ele funciona?",
      a: "O RaffleHub é uma plataforma SaaS profissional para criar, divulgar, gerenciar e auditar rifas digitais e ações entre amigos. A plataforma oferece grade visual em tempo real, links públicos de alta conversão, gestão completa de pedidos e fluxo nativo integrado ao WhatsApp.",
    },
    {
      q: "Como os participantes compram e reservam números?",
      a: "O participante acessa a página pública da sua rifa (/r/sua-campanha), seleciona os números desejados diretamente na grade interativa e preenche seu nome e WhatsApp. O sistema cria o pedido, bloqueia temporariamente os números para evitar compras duplicadas e abre o WhatsApp com os dados preenchidos para que o organizador receba o pagamento via Pix ou transferência.",
    },
    {
      q: "Como o sistema garante que dois participantes não comprem o mesmo número?",
      a: "O RaffleHub utiliza bloqueios transacionais no nível do banco de dados (PostgreSQL Advisory Locks). Quando uma cota é reservada ou comprada, o sistema trava o registro instantaneamente, impedindo qualquer conflito de concorrência mesmo com milhares de usuários acessando ao mesmo tempo.",
    },
    {
      q: "Posso vender números no balcão ou manualmente?",
      a: "Sim! O organizador conta com a ferramenta de 'Venda Manual' e 'Importação em Lote'. Você pode registrar compras feitas em dinheiro, Pix presencial ou cadernos antigos com 1 clique, digitando intervalos como 1-50 ou listas como 10,20,30.",
    },
    {
      q: "Como funciona o CRM de clientes e compradores?",
      a: "Cada pedido registra os dados do comprador (nome, WhatsApp, e-mail). Ao realizar uma nova venda ou receber contato, basta digitar parte do telefone que o RaffleHub identifica o cliente, mostrando quantas cotas ele já comprou, valor gasto e status de fidelidade.",
    },
    {
      q: "Posso anexar comprovantes de pagamento aos pedidos?",
      a: "Sim. O RaffleHub possui armazenamento em nuvem seguro para você anexar fotos de comprovantes Pix, recibos ou PDFs em cada pedido, mantendo o histórico 100% auditável.",
    },
    {
      q: "O sistema funciona bem no celular?",
      a: "Totalmente. A plataforma foi construída no conceito Mobile-First, oferecendo carregamento ultrarrápido, grade de cotas intuitiva e botões ergonômicos para compradores e organizadores no smartphone.",
    },
  ];

  return (
    <div className="w-full max-w-3xl mx-auto">
      <Accordion type="single" collapsible className="w-full space-y-3">
        {faqs.map((faq, index) => (
          <AccordionItem
            key={index}
            value={`item-${index}`}
            className="border border-border/80 bg-card/60 rounded-xl px-4 backdrop-blur transition-all duration-200 data-[state=open]:border-primary/40 data-[state=open]:bg-card"
          >
            <AccordionTrigger className="text-left font-semibold text-sm sm:text-base py-4 hover:no-underline hover:text-primary">
              {faq.q}
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4">
              {faq.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
