import { Request, Response } from 'express'
import { zBasicUser, DBUser, zCredentials } from '../helpers/types/User'
import { log } from '../helpers/logger'
import { pool } from '../helpers/database'
import { sql } from 'slonik'
import z from 'zod'

export const listUsers = async (request: Request, reply: Response) => {
    try {
        await pool.connect(async (conn) => {
            const result = await conn.query(sql`
                SELECT 
                    user_id,
                    user_name,
                    user_email,
                    user_role
                FROM users.users
            `)

            log('info', 'admin-user-list-request', { reasonL: `Admin ${request.user?.id} requested the list of users` }, request)
            reply.status(200).json({ result })
        })
    } catch (err) {
        log('error', 'exception-caught', { reason: err }, request)
        reply.status(500).json({ message: 'Error fetching users list' })
    }
}

export const deleteAcc = async (request: Request, reply: Response) => {
    const { userID } = request.params
    const verify = await z.string().spa(userID)

    if (!verify.success) return reply.status(400).json({ message: 'Invalid user id' })

    try {
        await pool.connect(async (conn) => {
            const result = await conn.query(sql`
                DELETE FROM users.users
                WHERE user_id = ${userID}
                RETURNING *
            `)

            if (result.rowCount < 1) return reply.status(404).json({ message: 'user not found' })

            log('info', 'admin-deleted-account', { reasonL: `Admin ${request.user?.id} deleted an account` }, request)
            reply.status(200).json({ message: 'account deleted' })
        })
    } catch (err) {
        log('error', 'exception-caught', { reason: err }, request)
        reply.status(500).json({ message: 'Error deleting the account' })
    }
}

export const editAcc = async (request: Request, reply: Response) => {
    const { userID } = request.params
    const body = await zBasicUser.spa(request.body)
    const verify = await z.string().spa(userID)

    if (!verify.success) return reply.status(400).json({ message: 'Invalid user id' })
    else if (!body.success) return reply.status(400).json({ message: 'Malformed request body' })

    try {
        await pool.connect(async (conn) => {
            const result = await conn.query(sql`
                UPDATE users.users
                SET 
                user_email = ${body.data.user_email},
                user_name = ${body.data.user_name},
                user_password = ${body.data.user_password}
                WHERE user_id = ${userID}
                RETURNING *
            `)

            if (result.rowCount < 1) return reply.status(404).json({ message: 'user not found' })

            log('info', 'admin-updated-account', { reason: `admin ${request.user?.id} updated account data for user ${userID}` }, request)
            reply.status(200).json({ message: 'Account updated' })
        })
    } catch(err) {
        log('error', 'exception-caught', { reason: err }, request)
        reply.status(500).json({ message: 'Error updating the account' })
    } 
}