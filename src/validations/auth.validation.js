import { z } from 'zod';

export const registerSchema = z.object({
  email: z.email('Invalid email format').trim().toLowerCase(),
  password: z.string().trim().min(6, 'Password must be at least 6 characters'),
});

export const loginSchema = z.object({
  email: z.email('Invalid email format').trim().toLowerCase(),
  password: z.string().trim().min(1, 'Password is required'),
});
