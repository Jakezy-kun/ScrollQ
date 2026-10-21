import { z } from 'zod';

export const emailSchema = z
  .string()
  .trim()
  .min(1, 'Enter your email.')
  .max(254, 'That email is too long.')
  .email('Enter a valid email address.');

/** For new passwords. Login only checks that something was typed. */
export const newPasswordSchema = z
  .string()
  .min(8, 'Use at least 8 characters.')
  .max(72, 'Use 72 characters or fewer.')
  .refine((v) => /[A-Za-z]/.test(v) && /\d/.test(v), 'Mix letters and numbers.');

export const displayNameSchema = z
  .string()
  .trim()
  .min(2, 'Use at least 2 characters.')
  .max(24, 'Use 24 characters or fewer.')
  .regex(/^[\p{L}\p{N} ._-]+$/u, 'Use letters, numbers, spaces, dots, dashes or underscores.');

export const signUpSchema = z
  .object({
    displayName: displayNameSchema,
    email: emailSchema,
    password: newPasswordSchema,
    confirmPassword: z.string().min(1, 'Type your password again.'),
    privacy: z.boolean().refine((v) => v, "Please confirm you've read the Privacy notice."),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ['confirmPassword'],
    message: "Passwords don't match.",
  });
export type SignUpValues = z.infer<typeof signUpSchema>;

export const logInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Enter your password.'),
});
export type LogInValues = z.infer<typeof logInSchema>;

export const emailOnlySchema = z.object({ email: emailSchema });
export type EmailOnlyValues = z.infer<typeof emailOnlySchema>;

export const newPasswordFormSchema = z
  .object({
    password: newPasswordSchema,
    confirmPassword: z.string().min(1, 'Type your password again.'),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ['confirmPassword'],
    message: "Passwords don't match.",
  });
export type NewPasswordValues = z.infer<typeof newPasswordFormSchema>;

export const profileSchema = z.object({
  displayName: displayNameSchema,
  avatar: z.string().nullable(),
});
export type ProfileValues = z.infer<typeof profileSchema>;

export type Strength = { score: 0 | 1 | 2 | 3; label: string };

/** Rough strength hint shown while typing. Guidance only; the schema enforces the minimum. */
export function passwordStrength(password: string): Strength {
  if (password.length === 0) return { score: 0, label: '' };
  let points = 0;
  if (password.length >= 8) points += 1;
  if (password.length >= 12) points += 1;
  if (/[A-Za-z]/.test(password) && /\d/.test(password)) points += 1;
  if (/[^A-Za-z0-9]/.test(password) || (/[a-z]/.test(password) && /[A-Z]/.test(password))) {
    points += 1;
  }
  if (points <= 1) return { score: 1, label: 'Weak' };
  if (points <= 2) return { score: 2, label: 'Okay' };
  return { score: 3, label: 'Strong' };
}
