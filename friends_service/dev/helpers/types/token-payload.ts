import { z } from 'zod'

const tokenPayload = z.object({
    role: z.enum(['admin', 'regular']),
    id: z.string().uuid()
})

export type TokenPayload = z.infer<typeof tokenPayload>