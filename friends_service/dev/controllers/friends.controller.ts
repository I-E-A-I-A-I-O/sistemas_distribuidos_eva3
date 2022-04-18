import { Request, Response } from "express";
import { z } from "zod";


export const sendRequest = async (request: Request, reply: Response) => {
    const { userID } = request.params
    const verify = await z.string().uuid().spa(userID)

    if (!verify.success) return reply.status(400).json({ message: 'Invalid user id' })

    
}
