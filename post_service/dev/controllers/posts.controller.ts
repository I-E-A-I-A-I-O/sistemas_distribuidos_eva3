import { Request, Response } from 'express'
import { zPostBody } from '../helpers/types/posts'

export const createPost = async (request: Request, reply: Response) => {
    const body = await zPostBody.spa(request.body)

    if (!body.success) return reply.status(400).json({ message: 'Malformed request body' })

    
}