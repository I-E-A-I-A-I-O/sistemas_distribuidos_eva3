import { Request, Response } from "express";
import { sql } from "slonik";
import { z } from "zod";
import { pool } from "../helpers/database";
import { log } from "../helpers/logger";

export const getFriends = async (request: Request, reply: Response) => {
    const user = request.user!

    try {
        await pool.connect(async (conn) => {
            const result = await conn.query(sql`
            SELECT
                f.friend_id,
                us.user_name
            FROM friends.friendships f
            INNER JOIN users.users us
                ON us.user_id = f.friend_id
            WHERE f.user_id = ${user.id}
            `)

            reply.status(200).json({ friends: result.rows })
        })
    } catch(err) {
        log('error', 'exception-caught', { reason: err }, request)
        reply.status(500).json({ message: 'Error fetching friend list' })
    }
}

export const deleteFriend = async (request: Request, reply: Response) => {
    const { userID } = request.params
    const verify = await z.string().uuid().spa(userID)

    if (!verify.success) return reply.status(400).json({ message: 'Invalid user id' })

    const user = request.user!

    try {
        await pool.connect(async (conn) => {
            const result = await conn.query(sql`
            DELETE FROM friends.friendships
            WHERE (user_id = ${user.id} AND friend_id = ${userID}) OR (user_id = ${userID} AND friend_id = ${user.id})
            RETURNING *
            `)

            if (result.rowCount < 1) return reply.status(404).json({ message: 'Friendship not found' })

            log('info', 'friendship-deleted', { reason: `user ${user.id} removed user ${userID} from friend list` }, request)
            reply.status(200).json({ message: 'Friend removed' })
        })
    } catch(err) {
        log('error', 'exception-caught', { reason: err }, request)
        reply.status(500).json({ message: 'Error deleting friendship' })
    }
}
