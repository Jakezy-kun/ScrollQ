import { createContext, useContext } from 'react';
import type { AuthResult } from './errors';
import { fail } from './errors';

export type AuthStatus = 'loading' | 'guest' | 'signedIn';

export interface AuthUser {
  id: string;
  email: string;
}

export interface SignUpInput {
  email: string;
  password: string;
  displayName: string;
}

export type SignUpResult = AuthResult & { needsConfirmation?: boolean };

export interface AuthApi {
  /** False in guest-only mode (Supabase not configured). */
  accountsEnabled: boolean;
  googleEnabled: boolean;
  user: AuthUser | null;
  status: AuthStatus;
  /** True when a session ended on its own (expired or revoked) until the next sign-in. */
  sessionExpired: boolean;
  /** True while a password-reset link's session is active. */
  recovering: boolean;
  signUp: (input: SignUpInput) => Promise<SignUpResult>;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signInWithGoogle: () => Promise<AuthResult>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<AuthResult>;
  updatePassword: (password: string) => Promise<AuthResult>;
  resendConfirmation: (email: string) => Promise<AuthResult>;
  deleteAccount: () => Promise<AuthResult>;
}

const disabled = async () => fail('disabled');

/** Guest-only defaults, used when no provider is mounted (and in guest-only mode). */
export const GUEST_AUTH: AuthApi = {
  accountsEnabled: false,
  googleEnabled: false,
  user: null,
  status: 'guest',
  sessionExpired: false,
  recovering: false,
  signUp: disabled,
  signIn: disabled,
  signInWithGoogle: disabled,
  signOut: async () => {},
  resetPassword: disabled,
  updatePassword: disabled,
  resendConfirmation: disabled,
  deleteAccount: disabled,
};

export const AuthContext = createContext<AuthApi>(GUEST_AUTH);

export function useAuth(): AuthApi {
  return useContext(AuthContext);
}
