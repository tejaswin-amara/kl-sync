import { z } from 'zod';

export const semesterOptionSchema = z.object({
  value: z.string(),
  label: z.string(),
});

export const loginRequestSchema = z.object({
  username: z.string().trim().min(1, 'Username is required').max(128),
  password: z.string().min(1, 'Password is required').max(1024),
  captcha: z
    .string()
    .regex(/^[a-z]{4,7}$/, 'Captcha must contain 4–7 lowercase ASCII letters'),
  captchaToken: z.string().max(4096).optional(),
  deviceId: z.string().max(128).optional(),
  rememberMe: z.boolean().optional(),
});

export const loginResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  academicYears: z.array(semesterOptionSchema).optional(),
  semesters: z.array(semesterOptionSchema).optional(),
  deviceId: z.string().optional(),
  needsCaptchaRetry: z.boolean().optional(),
  error: z.string().optional(),
  isOffline: z.boolean().optional(),
});

export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type LoginResponse = z.infer<typeof loginResponseSchema>;
