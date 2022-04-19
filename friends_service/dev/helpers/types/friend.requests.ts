import { z } from 'zod'

export const zFriendRequest = z.object({
    request_id: z.string().uuid(),
    request_owner_id: z.string().uuid(),
    requested_to_id: z.string().uuid(),
    request_status: z.enum(['PENDING', 'ACCEPTED', 'REJECTED'])
})

export const zFriendship = z.object({
    friendship_id: z.string().uuid(),
    user_id: z.string().uuid(),
    friend_id: z.string().uuid()
})

export type FriendRequest = z.infer<typeof zFriendRequest>
export type Friendship = z.infer<typeof zFriendship>
