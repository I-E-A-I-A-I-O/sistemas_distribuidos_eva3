import { z } from 'zod'

export const zBasicUser = z.object({
    user_name: z.string().min(2).max(25),
    user_email: z.string().email(),
    user_password: z.string().min(3).max(30)
})

export const zDBUser = z.object({
    user_id: z.string().uuid(),
    user_name: z.string().min(2).max(25),
    user_email: z.string().email(),
    user_password: z.string().min(3).max(30),
    user_role: z.enum(['regular', 'admin'])
})

export type DBUser = z.infer<typeof zDBUser>