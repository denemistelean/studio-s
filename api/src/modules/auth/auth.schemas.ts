import { z } from 'zod';
import type { LoginBody } from './auth.types';

export const loginBodySchema = z.object({
  email: z.string().trim().min(1).email().max(150),
  password: z.string().min(6).max(128),
});

export type { LoginBody };
