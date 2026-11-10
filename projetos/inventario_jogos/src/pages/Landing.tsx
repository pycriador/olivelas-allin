import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AuthModal } from '@/components/AuthModal';
import { useAuth } from '@/hooks/useAuth';
import {
  Gamepad2,
  Sparkles,
  Table2,
  Download,
  Upload,
  Search,
  ShieldCheck,
  Zap,
  ArrowRight,
  Check,
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const features = [
  {
    icon: Sparkles,
    title: 'Parser inteligente',
    description:
      'Cole o texto bruto do anúncio e o sistema extrai nome, mídia, descrição, preço e link automaticamente.',
  },
  {
    icon: Table2,
    title: 'Tabela organizada',
    description:
      'Todos os seus jogos em uma tabela limpa, com edição rápida e visual escuro confortável.',
  },
  {
    icon: Search,
    title: 'Busca instantânea',
    description: 'Encontre qualquer título da sua lista em segundos conforme você digita.',
  },
  {
    icon: Upload,
    title: 'Importar JSON',
    description: 'Traga listas antigas de uma vez só, sem retrabalho e sem copiar item por item.',
  },
  {
    icon: Download,
    title: 'Exportar quando quiser',
    description: 'Seus dados são seus: baixe a lista completa em JSON a qualquer momento.',
  },
  {
    icon: ShieldCheck,
    title: 'Conta protegida',
    description: 'Login por email e senha ou com o Google. Só você edita a sua lista.',
  },
];

const steps = [
  {
    title: 'Crie sua conta',
    description: 'Email e senha ou um clique com o Google. Leva menos de 30 segundos.',
  },
  {
    title: 'Cole ou importe',
    description: 'Use o parser com texto bruto, cadastre manualmente ou importe um JSON.',
  },
  {
    title: 'Gerencie e exporte',
    description: 'Busque, edite, remova e exporte sua lista sempre que precisar.',
  },
];

const Landing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  useEffect(() => {
    if (user && isAuthOpen) {
      setIsAuthOpen(false);
      navigate('/app');
    }
  }, [user, isAuthOpen, navigate]);

  const handleCta = () => {
    if (user) navigate('/app');
    else setIsAuthOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-20">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center glow-primary">
              <Gamepad2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <span className="text-xl font-bold text-gradient">Game List Manager</span>
              <p className="text-xs text-muted-foreground">Organize sua lista de downloads</p>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#recursos" className="hover:text-foreground transition-colors">Recursos</a>
            <a href="#como-funciona" className="hover:text-foreground transition-colors">Como funciona</a>
            <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
          </nav>
          <Button
            onClick={handleCta}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {user ? 'Abrir app' : 'Entrar'}
          </Button>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              background:
                'radial-gradient(600px circle at 20% 10%, hsl(var(--primary) / 0.5), transparent 60%), radial-gradient(500px circle at 80% 30%, hsl(var(--accent) / 0.4), transparent 60%)',
            }}
          />
          <div className="container mx-auto px-4 py-20 md:py-28 relative">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground animate-fade-in">
                <Zap className="w-3.5 h-3.5 text-primary" />
                Parser automático de anúncios de jogos
              </div>
              <h1 className="mt-6 text-4xl md:text-6xl font-bold leading-tight animate-fade-in">
                Sua lista de jogos, finalmente{' '}
                <span className="text-gradient">organizada</span>.
              </h1>
              <p className="mt-6 text-lg text-muted-foreground max-w-2xl animate-fade-in">
                Transforme textos bagunçados de anúncios em uma lista limpa e pesquisável.
                Cadastre, edite, importe e exporte tudo em um só lugar — com login seguro por
                email ou Google.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Button
                  size="lg"
                  onClick={handleCta}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 glow-primary"
                >
                  Começar agora
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-border hover:bg-secondary"
                  onClick={() => navigate('/app')}
                >
                  Ver a lista pública
                </Button>
              </div>
              <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                {['Grátis para usar', 'Sem instalação', 'Seus dados exportáveis'].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Mock preview */}
            <div className="mt-16 rounded-xl border border-border bg-card p-4 shadow-2xl animate-fade-in">
              <div className="flex items-center gap-2 pb-3 border-b border-border">
                <span className="w-3 h-3 rounded-full bg-destructive/70" />
                <span className="w-3 h-3 rounded-full bg-warning/70" />
                <span className="w-3 h-3 rounded-full bg-success/70" />
                <span className="ml-3 text-xs font-mono text-muted-foreground">
                  lista-jogos.json
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-4 text-sm">
                {[
                  { n: 'The Last Quest', m: 'Digital', p: 'R$ 49,90' },
                  { n: 'Neon Racers 2', m: 'Físico', p: 'R$ 129,00' },
                  { n: 'Pixel Dungeon X', m: 'Digital', p: 'R$ 19,90' },
                  { n: 'Star Frontier', m: 'Digital', p: 'R$ 89,90' },
                ].map((g) => (
                  <div key={g.n} className="rounded-lg bg-secondary/60 border border-border p-3">
                    <p className="font-medium truncate">{g.n}</p>
                    <p className="text-xs text-muted-foreground mt-1">{g.m}</p>
                    <p className="text-primary font-mono mt-2">{g.p}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="recursos" className="container mx-auto px-4 py-20">
          <div className="max-w-2xl">
            <h2 className="text-3xl md:text-4xl font-bold">Tudo que sua lista precisa</h2>
            <p className="mt-4 text-muted-foreground">
              Feito para quem cansou de planilhas improvisadas e blocos de notas perdidos.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, description }) => (
              <article
                key={title}
                className="rounded-xl border border-border bg-card p-6 hover:border-primary/50 transition-colors"
              >
                <div className="w-11 h-11 rounded-lg bg-primary/15 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="mt-4 font-semibold text-lg">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{description}</p>
              </article>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section id="como-funciona" className="border-y border-border bg-card/40">
          <div className="container mx-auto px-4 py-20">
            <h2 className="text-3xl md:text-4xl font-bold">Em três passos</h2>
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              {steps.map((step, i) => (
                <div key={step.title} className="relative">
                  <span className="font-mono text-5xl font-bold text-primary/20">
                    0{i + 1}
                  </span>
                  <h3 className="mt-2 text-xl font-semibold">{step.title}</h3>
                  <p className="mt-2 text-muted-foreground text-sm leading-relaxed">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="container mx-auto px-4 py-20">
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold">Perguntas frequentes</h2>
              <p className="mt-4 text-muted-foreground">
                Ainda com dúvida? Crie uma conta e teste — leva menos de um minuto.
              </p>
              <Button
                onClick={handleCta}
                className="mt-6 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Criar conta grátis
              </Button>
            </div>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="1">
                <AccordionTrigger>Preciso pagar alguma coisa?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Não. O gerenciador é gratuito e você pode exportar seus dados quando quiser.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="2">
                <AccordionTrigger>Como funciona o login com Google?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Basta clicar em "Continuar com Google" na tela de login. Nenhuma senha extra é
                  necessária e sua conta fica vinculada com segurança.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="3">
                <AccordionTrigger>O que o parser consegue reconhecer?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Nome do jogo, tipo de mídia, descrição, preço e URL a partir do texto colado do
                  anúncio.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="4">
                <AccordionTrigger>Posso importar minha lista antiga?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Sim. Importe um arquivo JSON com os campos nome, tipo_midia, descricao, preco e
                  url.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </section>

        {/* CTA */}
        <section className="container mx-auto px-4 pb-24">
          <div className="rounded-2xl border border-border bg-card p-10 md:p-16 text-center relative overflow-hidden">
            <div
              className="absolute inset-0 opacity-25 pointer-events-none"
              style={{
                background:
                  'radial-gradient(500px circle at 50% 0%, hsl(var(--primary) / 0.6), transparent 65%)',
              }}
            />
            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-bold">
                Pronto para organizar sua coleção?
              </h2>
              <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
                Entre com email e senha ou continue com o Google e comece a montar sua lista agora
                mesmo.
              </p>
              <Button
                size="lg"
                onClick={handleCta}
                className="mt-8 bg-primary text-primary-foreground hover:bg-primary/90 glow-primary"
              >
                Entrar ou criar conta
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Gamepad2 className="w-4 h-4 text-primary" />
            <span>Game List Manager</span>
          </div>
          <p>© {new Date().getFullYear()} — Feito para gamers organizados.</p>
        </div>
      </footer>

      <AuthModal open={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </div>
  );
};

export default Landing;
