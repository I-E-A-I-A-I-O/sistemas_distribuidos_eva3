import { Request, Response } from 'express'
import { DBUser, zCredentials } from '../helpers/types/User'
import { log } from '../helpers/logger'
import { pool } from '../helpers/database'
import { sql } from 'slonik'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

export const login = async (request: Request, reply: Response) => {
    const body = await zCredentials.spa(request.body)

    if (!body.success) {
        log('error', 'malformed-body', body.error, request)
        return reply.status(400).json({ message: 'Malformed JSON body' })
    }

    try {
        await pool.connect(async (conn) => {
            const users = await conn.query<DBUser>(sql`
                SELECT * 
                FROM users.users
                WHERE user_email=${body.data.user_email}
            `)
            
            if (users.rowCount < 1) {
                return reply.status(404).json({ message: 'Email not registered' })
            }

            const user = users.rows[0]
            const same = await bcrypt.compare(body.data.user_password, user.user_password)

            if (!same) {
                log('warn', 'incorrect-password', { reason: 'Login attemp with incorrect password' }, request)
                return reply.status(403).json({ message: 'Incorrect password' })
            }

            const token = jwt.sign({ user_id: user.user_id, user_role: user.user_role }, process.env.JWT_SECRET!)
            reply.status(201).json({ message: 'Login successful', token })
        })
    } catch (err) {
        log('error', 'exception-caught', err, request)
        reply.status(500).json({ message: 'Error logging in' })
    }
}
