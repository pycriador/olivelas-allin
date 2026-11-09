import { useState } from "react";
import { Navigate } from "@tanstack/react-router";
import { AuthLayout } from "@/layouts/auth-layout";
import { LoginForm } from "@/features/auth/ui/login-form";
import { SignupForm } from "@/features/auth/ui/signup-form";
import { ForgotPasswordForm } from "@/features/auth/ui/forgot-password-form";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export type LoginView = "login" | "signup" | "forgot";

export function LoginPage({ view }: { view: LoginView }) {
  const { isLoading, isAuthenticated } = useAuth();

  if (isAuthenticated && !isLoading) {
    return <Navigate to="/dashboard" />;
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <AuthLayout>
      {view === "signup" ? (
        <SignupForm />
      ) : view === "forgot" ? (
        <ForgotPasswordForm />
      ) : (
        <LoginForm />
      )}
    </AuthLayout>
  );
}
