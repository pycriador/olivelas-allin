import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Shield,
  FileText,
  BarChart3,
  Globe,
  Check,
  Sparkles,
  Lock,
  Users,
  Workflow,
  Star,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Button } from "@/components/ui/button";
import { GoogleButton } from "@/components/google-button";
import { tObject } from "@/lib/i18n-utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "IAM Pro Forms — Identidade, acessos e formulários" },
      {
        name: "description",
        content:
          "Plataforma SaaS enterprise para gestão de identidade, grupos, permissões e formulários. Entre com e-mail e senha ou com o Google.",
      },
      { property: "og:title", content: "IAM Pro Forms — Identidade, acessos e formulários" },
      {
        property: "og:description",
        content:
          "Gestão de usuários, grupos e permissões com RBAC nativo, dashboards e suporte a três idiomas.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.5, delay },
});

function Landing() {
  const { t } = useTranslation();

  const features = [
    { key: "rbac", Icon: Shield },
    { key: "forms", Icon: FileText },
    { key: "analytics", Icon: BarChart3 },
    { key: "i18n", Icon: Globe },
  ] as const;

  const steps = [
    { key: "step1", Icon: Users },
    { key: "step2", Icon: Lock },
    { key: "step3", Icon: Workflow },
  ] as const;

  const plans = ["starter", "pro", "enterprise"] as const;
  const faqs = tObject<{ q: string; a: string }[]>(
    t("landing.faq.items", { returnObjects: true }),
    "landing.faq.items",
  );

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/70 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
          <Logo />
          <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground lg:flex">
            <a href="#features" className="transition hover:text-foreground">
              {t("landing.nav.features")}
            </a>
            <a href="#how" className="transition hover:text-foreground">
              {t("landing.nav.how")}
            </a>
            <a href="#pricing" className="transition hover:text-foreground">
              {t("landing.nav.pricing")}
            </a>
            <a href="#faq" className="transition hover:text-foreground">
              {t("landing.nav.faq")}
            </a>
          </nav>
          <div className="flex items-center gap-1">
            <LanguageSwitcher compact />
            <ThemeToggle />
            <Link to="/login">
              <Button variant="ghost" size="sm" className="ml-1">
                {t("common.signIn")}
              </Button>
            </Link>
            <Link to="/register">
              <Button size="sm">{t("common.signUp")}</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="hero-bg">
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-6 pb-24 pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:pt-24">
          <div>
            <motion.div
              {...fadeUp(0)}
              className="inline-flex items-center gap-2 rounded-full border bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {t("landing.badge")}
            </motion.div>

            <motion.h1
              {...fadeUp(0.05)}
              className="text-gradient mt-6 max-w-2xl text-4xl font-semibold leading-[1.08] tracking-tight md:text-6xl"
            >
              {t("landing.title")}
            </motion.h1>

            <motion.p
              {...fadeUp(0.1)}
              className="mt-6 max-w-xl text-base text-muted-foreground md:text-lg"
            >
              {t("landing.subtitle")}
            </motion.p>

            <motion.ul
              {...fadeUp(0.15)}
              className="mt-7 grid max-w-lg gap-2 text-sm sm:grid-cols-2"
            >
              {tObject<string[]>(
                t("landing.highlights", { returnObjects: true }),
                "landing.highlights",
              ).map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <Check className="h-4 w-4 shrink-0 text-success" />
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ),
              )}
            </motion.ul>

            <motion.div {...fadeUp(0.2)} className="mt-9 flex flex-wrap gap-3">
              <Link to="/register">
                <Button size="lg" className="group gap-2">
                  {t("landing.ctaPrimary")}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline">
                  {t("landing.ctaSecondary")}
                </Button>
              </Link>
            </motion.div>
          </div>

          {/* Access card */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mx-auto w-full max-w-md"
          >
            <div
              className="glass rounded-2xl p-6 md:p-7"
              style={{ boxShadow: "var(--shadow-glow)" }}
            >
              <h2 className="text-lg font-semibold tracking-tight">
                {t("landing.access.title")}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("landing.access.subtitle")}
              </p>

              <div className="mt-6 space-y-3">
                <GoogleButton />
                <div className="flex items-center gap-3">
                  <span className="h-px flex-1 bg-border" />
                  <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    {t("auth.or")}
                  </span>
                  <span className="h-px flex-1 bg-border" />
                </div>
                <Link to="/register" className="block">
                  <Button className="w-full gap-2">
                    {t("landing.access.createEmail")}
                  </Button>
                </Link>
                <Link to="/login" className="block">
                  <Button variant="secondary" className="w-full">
                    {t("landing.access.signInEmail")}
                  </Button>
                </Link>
              </div>

              <p className="mt-5 text-center text-xs text-muted-foreground">
                {t("landing.access.note")}
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y bg-card/40">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-6 py-10 md:grid-cols-4">
          {tObject<{ value: string; label: string }[]>(
            t("landing.stats", { returnObjects: true }),
            "landing.stats",
          ).map((s, i) => (
            <motion.div key={s.label} {...fadeUp(i * 0.05)} className="text-center">
              <div className="text-2xl font-semibold tracking-tight md:text-3xl">
                {s.value}
              </div>
              <div className="mt-1 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                {s.label}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="scroll-mt-20">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
              {t("landing.featuresTitle")}
            </h2>
            <p className="mt-3 text-muted-foreground">
              {t("landing.featuresSubtitle")}
            </p>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ key, Icon }, idx) => (
              <motion.div
                key={key}
                {...fadeUp(idx * 0.05)}
                className="group rounded-xl border bg-card p-6 transition hover:shadow-elegant"
              >
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-lg"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  <Icon className="h-4 w-4 text-primary-foreground" />
                </div>
                <h3 className="mt-4 text-base font-semibold">
                  {t(`landing.features.${key}.title`)}
                </h3>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  {t(`landing.features.${key}.desc`)}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="scroll-mt-20 border-t bg-card/30">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
              {t("landing.how.title")}
            </h2>
            <p className="mt-3 text-muted-foreground">{t("landing.how.subtitle")}</p>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {steps.map(({ key, Icon }, idx) => (
              <motion.div
                key={key}
                {...fadeUp(idx * 0.06)}
                className="relative rounded-xl border bg-background p-6"
              >
                <span className="absolute right-5 top-5 text-4xl font-semibold text-muted/80">
                  {idx + 1}
                </span>
                <Icon className="h-5 w-5 text-primary" />
                <h3 className="mt-4 text-base font-semibold">
                  {t(`landing.how.${key}.title`)}
                </h3>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  {t(`landing.how.${key}.desc`)}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="border-t">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="text-center text-3xl font-semibold tracking-tight md:text-4xl">
            {t("landing.testimonials.title")}
          </h2>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {tObject<{ quote: string; name: string; role: string }[]>(
              t("landing.testimonials.items", { returnObjects: true }),
              "landing.testimonials.items",
            ).map((item, idx) => (
              <motion.figure
                key={item.name}
                {...fadeUp(idx * 0.06)}
                className="rounded-xl border bg-card p-6"
              >
                <div className="flex gap-0.5 text-warning">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-current" />
                  ))}
                </div>
                <blockquote className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  “{item.quote}”
                </blockquote>
                <figcaption className="mt-5 text-sm">
                  <span className="font-medium">{item.name}</span>
                  <span className="block text-xs text-muted-foreground">
                    {item.role}
                  </span>
                </figcaption>
              </motion.figure>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="scroll-mt-20 border-t bg-card/30">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
              {t("landing.pricing.title")}
            </h2>
            <p className="mt-3 text-muted-foreground">
              {t("landing.pricing.subtitle")}
            </p>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {plans.map((plan, idx) => {
              const highlighted = plan === "pro";
              return (
                <motion.div
                  key={plan}
                  {...fadeUp(idx * 0.06)}
                  className={
                    highlighted
                      ? "relative rounded-2xl border bg-background p-7 shadow-elegant ring-1 ring-primary/30"
                      : "rounded-2xl border bg-background p-7"
                  }
                >
                  {highlighted && (
                    <span className="absolute -top-3 left-7 rounded-full bg-primary px-3 py-1 text-[11px] font-medium text-primary-foreground">
                      {t("landing.pricing.popular")}
                    </span>
                  )}
                  <h3 className="text-base font-semibold">
                    {t(`landing.pricing.plans.${plan}.name`)}
                  </h3>
                  <div className="mt-3 flex items-end gap-1">
                    <span className="text-3xl font-semibold tracking-tight">
                      {t(`landing.pricing.plans.${plan}.price`)}
                    </span>
                    <span className="pb-1 text-xs text-muted-foreground">
                      {t(`landing.pricing.plans.${plan}.period`)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {t(`landing.pricing.plans.${plan}.desc`)}
                  </p>
                  <ul className="mt-6 space-y-2 text-sm">
                    {tObject<string[]>(
                      t(`landing.pricing.plans.${plan}.features`, {
                        returnObjects: true,
                      }),
                      `landing.pricing.plans.${plan}.features`,
                    ).map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                        <span className="text-muted-foreground">{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link to="/register" className="mt-7 block">
                    <Button
                      className="w-full"
                      variant={highlighted ? "default" : "outline"}
                    >
                      {t("landing.ctaPrimary")}
                    </Button>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-20 border-t">
        <div className="mx-auto max-w-3xl px-6 py-20">
          <h2 className="text-center text-3xl font-semibold tracking-tight md:text-4xl">
            {t("landing.faq.title")}
          </h2>
          <Accordion type="single" collapsible className="mt-10">
            {faqs.map((item, i) => (
              <AccordionItem key={item.q} value={`item-${i}`}>
                <AccordionTrigger className="text-left text-sm font-medium">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t hero-bg">
        <div className="mx-auto max-w-4xl px-6 py-20 text-center">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            {t("landing.finalCta.title")}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            {t("landing.finalCta.subtitle")}
          </p>
          <div className="mx-auto mt-8 flex max-w-sm flex-col gap-3">
            <GoogleButton />
            <Link to="/register">
              <Button size="lg" className="w-full gap-2">
                {t("landing.access.createEmail")}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="ghost" className="w-full">
                {t("landing.access.signInEmail")}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-8 text-xs text-muted-foreground md:flex-row">
          <div className="flex items-center gap-2">
            <Logo size="sm" showText={false} />
            <span>© {new Date().getFullYear()} IAM Pro Forms</span>
          </div>
          <div className="flex gap-4">
            <a href="#features">{t("landing.nav.features")}</a>
            <a href="#pricing">{t("landing.nav.pricing")}</a>
            <Link to="/login">{t("common.signIn")}</Link>
            <Link to="/register">{t("common.signUp")}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
