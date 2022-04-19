import { Request, Response } from 'express'
import { sql } from 'slonik'
import { z } from 'zod'
import { pool } from '../helpers/database'
import { log } from '../helpers/logger'
import { FriendRequest } from '../helpers/types/friend.requests'

export const sendRequest = async (request: Request, reply: Response) => {
    const { userID } = request.params
    const verify = await z.string().uuid().spa(userID)

    if (!verify.success) return reply.status(400).json({ message: 'Invalid user id' })

    const user = request.user!

    try {
        await pool.connect(async (conn) => {
            const result = await conn.maybeOne(sql`
            SELECT *
            FROM friends.friendships
            WHERE user_id = ${user.id}
            AND friend_id = ${userID}
            `)

            if (result) return reply.status(400).json({ message: 'Can not send friend request. User is already a friend' })

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

export const getRequests = async (request: Request, reply: Response) => {
    const user = request.user!

    try {
        await pool.connect(async (conn) => {
            const sentRequests = await conn.query(sql`
            SELECT
                fr.request_id,
                us.user_id,
                us.user_name,
                fr.request_status
            FROM friends.requests fr
            INNER JOIN users.users us
                ON us.user_id = fr.requested_to_id
            WHERE 
                request_owner_id = ${user.id}
            AND
                request_status = 'PENDING'
            `)

            const receivedRequests = await conn.query(sql`
            SELECT 
                fr.request_id,
                us.user_id,
                us.user_name,
                fr.request_status
            FROM friend.requests fr
            INNER JOIN user.users us
                ON us.user_id = fr.request_owner_id
            WHERE
                requested_to_id = ${user.id}
            AND
                request_status = 'PENDING'
            `)

            reply.status(200).json({ sentRequests, receivedRequests })
        })
    } catch(err) {
        log('error', 'exception-caught', { reason: err }, request)
        reply.status(500).json({ message: 'Error sending fetching requests' })
    }
}

export const deleteRequest = async (request: Request, reply: Response) => {
    const { requestID } = request.params
    const verify = await z.string().uuid().spa(requestID)

    if (!verify.success) return reply.status(400).json({ message: 'Invalid request id' })

    const user = request.user!

    try {
        await pool.connect(async (conn) => {
            const deleted = await conn.query<FriendRequest>(sql`
            DELETE FROM friends.requests
            WHERE
                request_owner_id = ${user.id}
            AND
                request_id = ${requestID}
            AND
                request_status = 'PENDING'
            RETURNING *
            `)

            if (deleted.rowCount < 1) return reply.status(404).json({ message: 'Request not found' })

            log('info', 'friend-request-deleted', { reason: `user ${user.id} deleted friend request to user ${deleted.rows[0].requested_to_id}` })
            reply.status(200).json({ message: 'Friend request deleted' })
        })
    } catch(err) {
        log('error', 'exception-caught', { reason: err }, request)
        reply.status(500).json({ message: 'Error sending fetching requests' })
    }
}

export const acceptRequest = async (request: Request, reply: Response) => {
    const { requestID } = request.params
    const verify = await z.string().uuid().spa(requestID)

    if (!verify.success) return reply.status(400).json({ message: 'Invalid request id' })

    const user = request.user!

    try {
        await pool.transaction(async (conn) => {
            const request = await conn.query<FriendRequest>(sql`
            UPDATE friends.requests
            SET request_status = 'ACCEPTED'
            WHERE request_id = ${requestID}
            AND request_status = 'PENDING'
            RETURNING *
            `)

            if (request.rowCount < 1) return reply.status(404).json({ message: 'Request not found' })

            const userID = request.rows[0].requested_to_id

            await conn.query(sql`
            INSERT
            INTO friends.friendships(user_id, friend_id)
            VALUES(${user.id}, ${userID})
            `)

            await conn.query(sql`
            INSERT
            INTO friends.friendships(user_id, friend_id)
            VALUES(${userID}, ${user.id})
            `)

            log('info', 'friend-request-accepted', { reason: `user ${user.id} befriended user ${userID}` })
        })

        reply.status(200).json({ message: 'Friend request accepted' })
    } catch(err) {
        log('error', 'exception-caught', { reason: err }, request)
        reply.status(500).json({ message: 'Error accepting friend request' })
    }
}

export const rejectRequest = async (request: Request, reply: Response) => {
    const { requestID } = request.params
    const verify = await z.string().uuid().spa(requestID)

    if (!verify.success) return reply.status(400).json({ message: 'Invalid request id' })

    const user = request.user!

    try {
        await pool.transaction(async (conn) => {
            const request = await conn.query<FriendRequest>(sql`
            UPDATE friends.requests
            SET request_status = 'REJECTED'
            WHERE request_id = ${requestID}
            AND request_status = 'PENDING'
            RETURNING *
            `)

            if (request.rowCount < 1) return reply.status(404).json({ message: 'Request not found' })

            const userID = request.rows[0].requested_to_id

            log('info', 'friend-request-rejected', { reason: `user ${user.id} rejected friend request from user ${userID}` })
            reply.status(200).json({ message: 'Friend request rejected' })
        })
    } catch(err) {
        log('error', 'exception-caught', { reason: err }, request)
        reply.status(500).json({ message: 'Error rejecting friend request' })
    }
}
