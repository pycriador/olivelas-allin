import { Link } from 'react-router-dom';
import {
  Sun, Moon, Shirt, Dog, Baby, CalendarDays, Timer, Sparkles,
  ArrowRight, Check, ShieldCheck, LogIn,
} from 'lucide-react';
import { lovable } from '@/integrations/lovable/index';
import heroImage from '@/assets/home-hero.jpg';
import laundryImage from '@/assets/landing-laundry.jpg';
import kitchenImage from '@/assets/landing-kitchen.jpg';
import routineImage from '@/assets/landing-routine.jpg';

const pillars = [
  {
    icon: Timer,
    title: 'Microtarefas de 15 minutos',
    text: 'Cada tarefa é pensada para caber em poucos minutos. Nada de listas intermináveis que ninguém termina.',
  },
  {
    icon: Sparkles,
    title: 'Sem acúmulo',
    text: 'O que não foi feito hoje não pesa amanhã. Cada dia começa limpo, com a rotina certa para o momento.',
  },
  {
    icon: CalendarDays,
    title: 'Ritmo semanal',
    text: 'Cada dia tem sua área da casa e seu ciclo de lavanderia, distribuídos com equilíbrio ao longo da semana.',
  },
];

const modules = [
  { icon: Sun, title: 'Rotina da manhã', text: 'Comece o dia com a casa em ordem em poucos gestos.' },
  { icon: Moon, title: 'Rotina da noite', text: 'Prepare o dia seguinte antes de dormir, sem esforço.' },
  { icon: Shirt, title: 'Ciclo de lavanderia', text: 'Roupa de cama, toalhas e peças do dia em fluxo contínuo.' },
  { icon: Dog, title: 'Módulo pets', text: 'Alimentação, passeios e cuidados semanais dos seus bichos.' },
  { icon: Baby, title: 'Módulo bebê', text: 'Mamadeiras, banho, roupinhas e a rotina do pequeno.' },
  { icon: ShieldCheck, title: 'Perfis e permissões', text: 'Administradores, editores e visualizadores no mesmo lar.' },
];

const steps = [
  { n: '01', title: 'Crie sua conta', text: 'E-mail e senha ou entrada direta com o Google.' },
  { n: '02', title: 'Ative seus módulos', text: 'Pets, bebê e lavanderia conforme a sua casa realmente é.' },
  { n: '03', title: 'Siga o dia', text: 'Marque, ajuste, apague. A rotina se molda a você.' },
];

export default function LandingPage() {
  const handleGoogle = async () => {
    await lovable.auth.signInWithOAuth('google', { redirect_uri: window.location.origin });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <span className="font-heading text-sm font-semibold uppercase tracking-[0.22em] text-foreground">
            Rotina da Casa
          </span>
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="px-3 py-2 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-foreground"
            >
              Entrar
            </Link>
            <Link
              to="/login?mode=signup"
              className="border border-foreground bg-foreground px-4 py-2 text-xs font-medium uppercase tracking-[0.14em] text-background transition-opacity hover:opacity-85"
            >
              Criar conta
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <header className="relative">
        <img
          src={heroImage}
          alt="Sala de estar clara em tons de areia, com sofá de linho, madeira e cerâmica"
          width={1536}
          height={1024}
          className="h-[78vh] min-h-[520px] w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/25" />
        <div className="absolute inset-0 flex items-end">
          <div className="mx-auto w-full max-w-5xl px-6 pb-16">
            <p className="text-[11px] font-medium uppercase tracking-[0.32em] text-muted-foreground">
              Organização doméstica · Sem culpa
            </p>
            <h1 className="mt-5 max-w-2xl font-heading text-[2.6rem] font-light leading-[1.05] tracking-tight text-foreground sm:text-6xl">
              A casa em ordem,
              <br />
              <span className="font-medium">quinze minutos por vez.</span>
            </h1>
            <p className="mt-5 max-w-lg text-base font-light leading-relaxed text-muted-foreground">
              Uma rotina inteligente que distribui as tarefas da casa ao longo da semana,
              respeita o seu tempo e nunca acumula pendências.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/login?mode=signup"
                className="inline-flex items-center justify-center gap-2 border border-foreground bg-foreground px-7 py-3.5 text-xs font-medium uppercase tracking-[0.16em] text-background transition-opacity hover:opacity-85"
              >
                Criar minha conta <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <button
                type="button"
                onClick={handleGoogle}
                className="inline-flex items-center justify-center gap-2.5 border border-border bg-card px-7 py-3.5 text-xs font-medium uppercase tracking-[0.16em] text-foreground transition-colors hover:bg-secondary"
              >
                <GoogleMark /> Entrar com Google
              </button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Já tem conta?{' '}
              <Link to="/login" className="text-foreground underline underline-offset-4">
                Fazer login
              </Link>
            </p>
          </div>
        </div>
      </header>

      {/* Pillars */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-muted-foreground">O método</p>
        <h2 className="mt-4 max-w-2xl font-heading text-3xl font-light leading-tight tracking-tight text-foreground sm:text-4xl">
          Menos esforço, mais constância.
        </h2>
        <div className="mt-12 grid gap-px border border-border bg-border sm:grid-cols-3">
          {pillars.map(({ icon: Icon, title, text }) => (
            <article key={title} className="bg-card p-7">
              <Icon className="h-5 w-5 text-primary" />
              <h3 className="mt-5 font-heading text-base font-semibold text-foreground">{title}</h3>
              <p className="mt-2.5 text-sm font-light leading-relaxed text-muted-foreground">{text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Editorial split */}
      <section className="border-y border-border bg-secondary/40">
        <div className="mx-auto grid max-w-5xl items-center gap-10 px-6 py-20 md:grid-cols-2">
          <img
            src={routineImage}
            alt="Mãos anotando a rotina em um caderno sobre mesa de madeira clara"
            width={1024}
            height={1024}
            loading="lazy"
            className="aspect-[4/5] w-full object-cover"
          />
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-muted-foreground">
              Feito para o dia real
            </p>
            <h2 className="mt-4 font-heading text-3xl font-light leading-tight tracking-tight text-foreground sm:text-4xl">
              A rotina se adapta à sua casa — não o contrário.
            </h2>
            <ul className="mt-8 space-y-4">
              {[
                'Edite, apague ou crie qualquer tarefa do seu dia.',
                'Ative apenas os módulos que fazem sentido para você.',
                'Acompanhe progresso diário e sequência de dias concluídos.',
                'Exporte sua rotina e mantenha tudo sob controle.',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                  <span className="text-sm font-light leading-relaxed text-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Modules */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-muted-foreground">Módulos</p>
        <h2 className="mt-4 font-heading text-3xl font-light leading-tight tracking-tight text-foreground sm:text-4xl">
          Tudo o que uma casa pede.
        </h2>
        <div className="mt-12 grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {modules.map(({ icon: Icon, title, text }) => (
            <article key={title} className="bg-card p-7">
              <Icon className="h-5 w-5 text-primary" />
              <h3 className="mt-5 font-heading text-sm font-semibold uppercase tracking-[0.12em] text-foreground">
                {title}
              </h3>
              <p className="mt-2.5 text-sm font-light leading-relaxed text-muted-foreground">{text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Gallery + steps */}
      <section className="border-y border-border bg-secondary/40">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <div className="grid gap-4 sm:grid-cols-2">
            <img
              src={laundryImage}
              alt="Pilha de roupa de linho dobrada ao lado de cesto de palha"
              width={1024}
              height={1024}
              loading="lazy"
              className="aspect-[4/3] w-full object-cover"
            />
            <img
              src={kitchenImage}
              alt="Bancada de cozinha organizada em tons bege com louças de cerâmica"
              width={1024}
              height={1024}
              loading="lazy"
              className="aspect-[4/3] w-full object-cover"
            />
          </div>
          <div className="mt-14 grid gap-px border border-border bg-border sm:grid-cols-3">
            {steps.map(({ n, title, text }) => (
              <article key={n} className="bg-card p-7">
                <span className="font-heading text-xs font-medium tracking-[0.2em] text-primary">{n}</span>
                <h3 className="mt-4 font-heading text-base font-semibold text-foreground">{title}</h3>
                <p className="mt-2 text-sm font-light leading-relaxed text-muted-foreground">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-3xl px-6 py-24 text-center">
        <h2 className="font-heading text-3xl font-light leading-tight tracking-tight text-foreground sm:text-5xl">
          Comece hoje o seu primeiro
          <br className="hidden sm:block" /> <span className="font-medium">ciclo de quinze minutos.</span>
        </h2>
        <p className="mx-auto mt-5 max-w-md text-sm font-light leading-relaxed text-muted-foreground">
          Crie sua conta com e-mail e senha ou entre direto com o Google. Sua rotina fica pronta em segundos.
        </p>
        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            to="/login?mode=signup"
            className="inline-flex items-center justify-center gap-2 border border-foreground bg-foreground px-7 py-3.5 text-xs font-medium uppercase tracking-[0.16em] text-background transition-opacity hover:opacity-85"
          >
            Criar conta grátis <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <button
            type="button"
            onClick={handleGoogle}
            className="inline-flex items-center justify-center gap-2.5 border border-border bg-card px-7 py-3.5 text-xs font-medium uppercase tracking-[0.16em] text-foreground transition-colors hover:bg-secondary"
          >
            <GoogleMark /> Continuar com Google
          </button>
          <Link
            to="/login"
            className="inline-flex items-center justify-center gap-2 px-7 py-3.5 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:text-foreground"
          >
            <LogIn className="h-3.5 w-3.5" /> Entrar
          </Link>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-6 py-8 text-xs text-muted-foreground sm:flex-row">
          <span className="font-heading uppercase tracking-[0.22em]">Rotina da Casa</span>
          <span className="font-light">Organização doméstica em microtarefas de 15 minutos</span>
        </div>
      </footer>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M23.5 12.27c0-.85-.08-1.67-.22-2.45H12v4.63h6.45a5.5 5.5 0 0 1-2.39 3.62v3h3.86c2.26-2.08 3.58-5.15 3.58-8.8Z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.08 7.94-2.93l-3.86-3c-1.08.72-2.45 1.15-4.08 1.15-3.13 0-5.78-2.11-6.73-4.96H1.28v3.09A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.27 14.26a7.2 7.2 0 0 1 0-4.52V6.65H1.28a12 12 0 0 0 0 10.7l3.99-3.09Z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.28 6.65l3.99 3.09C6.22 6.86 8.87 4.75 12 4.75Z" />
    </svg>
  );
}
