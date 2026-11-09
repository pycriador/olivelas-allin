import { Link } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { signupSchema, type SignupFormValues } from "@/schemas/auth";
import { useSignup } from "@/features/auth/hooks/use-signup";
import { GoogleIcon } from "@/components/icons/google";
import { useLogin } from "@/features/auth/hooks/use-login";

export function SignupForm() {
  const { signup, isLoading } = useSignup();
  const { loginWithGoogle, googleLoading } = useLogin();

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
    },
  });

  const onSubmit = async (values: SignupFormValues) => {
    await signup(values.fullName, values.email, values.password);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Criar conta</h1>
        <p className="text-sm text-muted-foreground">
          Comece gratuitamente e monte seu primeiro projeto.
        </p>
      </div>

      <Button
        type="button"
        variant="outline"
        size="lg"
        className="w-full"
        onClick={() => loginWithGoogle()}
        disabled={googleLoading}
      >
        {googleLoading ? (
          <Loader2 className="mr-2 size-4 animate-spin" />
        ) : (
          <GoogleIcon className="mr-2 size-4" />
        )}
        Criar com Google
      </Button>

      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">ou crie com email</span>
        <Separator className="flex-1" />
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <Label htmlFor="fullName">Nome completo</Label>
                <FormControl>
                  <Input id="fullName" placeholder="Maria Silva" autoComplete="name" {...field} />
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
                <Label htmlFor="signup-email">Email</Label>
                <FormControl>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="voce@empresa.com"
                    autoComplete="email"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <Label htmlFor="signup-password">Senha</Label>
                <FormControl>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="Mínimo de 8 caracteres"
                    autoComplete="new-password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <Label htmlFor="confirm-password">Confirmar senha</Label>
                <FormControl>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Repita a senha"
                    autoComplete="new-password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="acceptTerms"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-start gap-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      id="accept-terms"
                    />
                  </FormControl>
                  <Label htmlFor="accept-terms" className="text-sm font-normal leading-tight">
                    Li e aceito os{" "}
                    <Link to="/terms" className="text-primary hover:underline">
                      termos de uso
                    </Link>{" "}
                    e a{" "}
                    <Link to="/privacy" className="text-primary hover:underline">
                      política de privacidade
                    </Link>
                  </Label>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
            Criar conta
          </Button>
        </form>
      </Form>

      <Separator />

      <p className="text-center text-sm text-muted-foreground">
        Já tem uma conta?{" "}
        <Link
          to="/login"
          search={{ view: "login" }}
          className="font-medium text-primary hover:underline"
        >
          Entrar
        </Link>
      </p>
    </div>
  );
}
