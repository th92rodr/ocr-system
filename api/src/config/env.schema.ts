import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.url(),
  PORT: z.string().transform((value) => Number(value)),
  CORS_ORIGIN: z.string(),

  JWT_SECRET: z.string().min(32),
  JWT_EXPIRATION_TIME: z.string().default('1d'),

  PASSWORD_PEPPER: z.string(),

  CLOUD_STORAGE_URL: z.url(),
  CLOUD_STORAGE_KEY: z.string(),
  CLOUD_STORAGE_BUCKET_NAME: z.string(),

  LLM_API_KEY: z.string(),
  LLM_MODEL: z.string(),
});

export type Env = z.infer<typeof envSchema>;
