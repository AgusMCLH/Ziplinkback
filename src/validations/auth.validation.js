import { z } from 'zod';

export const registerSchema = z.object({
  email: z.email('Invalid email format').trim().toLowerCase(),
  name: z.string().trim().min(1, 'Name is required'),
  //Password must be at least 6 characters, contain at least one uppercase letter, one lowercase letter, and one number
  password: z
    .string()
    .trim()
    .min(6, 'Password must be at least 6 characters')
    .refine((val) => {
      const hasUpper = /[A-Z]/.test(val);
      return hasUpper;
    }, 'Password must contain at least one uppercase letter')
    .refine((val) => {
      const hasLower = /[a-z]/.test(val);
      return hasLower;
    }, 'Password must contain at least one lowercase letter')
    .refine((val) => {
      const hasNumber = /[0-9]/.test(val);
      return hasNumber;
    }, 'Password must contain at least one number'),
});

export const loginSchema = z.object({
  email: z.email('Invalid email format').trim().toLowerCase(),
  password: z.string().trim().min(1, 'Password is required'),
});
