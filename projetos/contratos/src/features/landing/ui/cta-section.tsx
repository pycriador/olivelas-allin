import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CtaSection() {
  return (
    <section id="contato" className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-3xl border border-primary/30 bg-primary/10 px-8 py-16 text-center sm:px-16"
        >
          <div className="pointer-events-none absolute inset-0" aria-hidden>
            <div className="absolute -top-24 left-1/2 h-64 w-[80%] -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
          </div>
          <div className="relative">
            <h2 className="mx-auto max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
              Pronto para automatizar sua operação documental?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
              Crie sua conta e monte seu primeiro projeto em minutos. Sem cartão de crédito.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link to="/login">
                <Button size="lg" className="w-full px-8 sm:w-auto">
                  Começar agora
                  <ArrowRight className="ml-2 size-4" />
                </Button>
              </Link>
              <Link to="/contact">
                <Button variant="outline" size="lg" className="w-full px-8 sm:w-auto">
                  <Mail className="mr-2 size-4" />
                  Falar com vendas
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
