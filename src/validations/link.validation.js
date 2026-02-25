import { z } from 'zod';

export const createLinkSchema = z.object({
  linkURL: z
    .string()
    .trim()
    .min(4, 'URL must be at least 4 characters long')
    .refine((val) => {
      try {
        const url = new URL(val);
        return url.protocol === 'http:' || url.protocol === 'https:';
      } catch {
        return false;
      }
    }, 'Invalid URL format')
    .transform((val) => new URL(val).href),
});
