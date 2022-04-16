import { Request, Response } from 'express'
import { zBasicUser, DBUser, zCredentials } from '../helpers/types/User'
import { log } from '../helpers/logger'
import { pool } from '../helpers/database'
import { sql } from 'slonik'
import z from 'zod'

export const deleteAcc = async (request: Request, reply: Response) => {
    const { userID } = request.params
    const verify = await z.string().spa(userID)

    if (!verify.success) return reply.status(400).json({ message: 'Invalid user id' })

    const user = request.user!

    if (user.role !== 'admin') {
        log('warn', 'role-not-permitted', { reason: `non-admin user ${user.id} tried delete account ${userID}` }, request)
        return reply.status(403).json({ message: 'You do not have permission to do that' })
    }

    try {
        await pool.connect(async (conn) => {
            const result = await conn.query(sql`
                DELETE FROM users.users
                WHERE user_id = ${userID}
                RETURNING *
            `)

            if (result.rowCount < 1) return reply.status(404).json({ message: 'user not found' })

            log('info', 'admin-deleted-account', {}, request)
            reply.status(200).json({ message: 'account deleted' })
        })
    } catch (err) {
        log('error', 'exception-caught', { reason: err }, request)
        reply.status(500).json({ message: 'Error deleting the account' })
    }
}

export const editAcc = async (request: Request, reply: Response) => {
    
}