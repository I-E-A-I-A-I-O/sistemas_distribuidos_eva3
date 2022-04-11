import { Request, Response } from 'express'
import { zBasicUser, DBUser } from '../helpers/types/User'
import { log } from '../helpers/logger'
import { pool } from '../helpers/database'
import { sql } from 'slonik'
import bcrypt from 'bcrypt'

export const createAcc = async (request: Request, reply: Response) => {
    const body = await zBasicUser.spa(request.body)

    if (!body.success) {
        log('error', 'malformed-body', body.error, request)
        return reply.status(400).json({ message: 'Malformed JSON body' })
    }

    const password = await bcrypt.hash(body.data.user_password, 12)

    try {
        await pool.connect(async (conn) => {
            const insertedUser = await conn.query<DBUser>(sql`
                INSERT 
                INTO users.users(user_name, user_email, user_password, user_role)
                VALUES(${body.data.user_name}, ${body.data.user_email}, ${password}, 'regular')
                RETURNING *
            `)
            log('info', 'user-registered', { message: `New user registered with ID ${insertedUser.rows[0].user_id}` }, request)
            reply.status(201).json({ message: 'User created.' })
        })
    } catch (err) {
        log('error', 'exception-caught', err, request)
        reply.status(500).json({ message: 'Error creating account' })
    }
}