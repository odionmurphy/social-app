import { z } from 'zod'

export const RegisterSchema = z.object({
  username:    z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),
  email:       z.string().email(),
  password:    z.string().min(8).max(72),
  displayName: z.string().min(1).max(50),
})

export const LoginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
})

export type RegisterInput = z.infer<typeof RegisterSchema>
export type LoginInput    = z.infer<typeof LoginSchema>
