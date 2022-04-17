import z from 'zod'

export const zPostBody = z.object({
    body: z.string().min(1).max(300)
})

export const zPost = z.object({
    post_id: z.string().uuid(),
    post_body: z.string().min(1).max(300),
    post_date: z.date(),
    post_owner_id: z.string().uuid(),
    comment_to_post_id: z.string().uuid()
})

export type Post = z.infer<typeof zPost>