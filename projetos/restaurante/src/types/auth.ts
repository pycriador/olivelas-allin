export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  createdAt?: string;
}

export interface AuthState {
  user: UserProfile | null;
  loading: boolean;
  isMockAuth: boolean;
}

export interface AuthContextType extends AuthState {
  signInWithEmail: (email: string, password: string) => Promise<{ error?: string }>;
  signUpWithEmail: (email: string, password: string, name?: string) => Promise<{ error?: string }>;
  signInWithGoogle: () => Promise<{ error?: string }>;
  resetPassword: (email: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}
