import { Request, Response } from 'express'
import { sql } from 'slonik'
import { z } from 'zod'
import { pool } from '../helpers/database'
import { log } from '../helpers/logger'

export const sendRequest = async (request: Request, reply: Response) => {
    const { userID } = request.params
    const verify = await z.string().uuid().spa(userID)

    if (!verify.success) return reply.status(400).json({ message: 'Invalid user id' })

    const user = request.user!

    try {
        await pool.connect(async (conn) => {
            await conn.query(sql`
            INSERT
            INTO friends.requests(request_owner_id, requested_to_id, request_status)
            VALUES(${user.id}, ${userID}, 'PENDING')
            `)

            log('info', 'friend-request-created', { reason: `user ${user.id} sent friend request to ${userID}` }, request)
            reply.status(201).json({ message: 'Friend request sent' })
        })
    } catch(err) {
        log('error', 'exception-caught', { reason: err }, request)
        reply.status(500).json({ message: 'Error sending friend request' })
    }
}
