import z from 'zod'

export const zCommentBody = z.object({
    body: z.string().min(1).max(300),
    parent: z.string().uuid()
})

export const zPostBody = z.object({
    body: z.string().min(1).max(300)
})

export const zPost = z.object({
    post_id: z.string().uuid(),
    post_body: z.string().min(1).max(300),
    post_date: z.date(),
    post_owner_id: z.string().uuid(),
    parent_post_id: z.string().uuid()
})

export const zLikes = z.object({
    like_id: z.string().uuid(),
    like_owner_id: z.string().uuid(),
    like_post_id: z.string().uuid()
})

export type Post = z.infer<typeof zPost>