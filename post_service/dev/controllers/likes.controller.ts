import { Request, Response } from "express";
import { sql } from "slonik";
import { z } from "zod";
import { CacheClient } from "../helpers/cache-client";
import { pool } from "../helpers/database";
import { log } from "../helpers/logger";

export const getLikes = async (request: Request, reply: Response) => {
    const { postID } = request.params
    const verify = await z.string().uuid().spa(postID)

    if (!verify.success) return reply.status(400).json({ message: 'Invalid post id' })

    const cachedData = await CacheClient.get(`${postID}-LIKES`)

    if (cachedData) {
        log('info', 'cache-read', { reason: `Cache key ${postID}-LIKES read` }, request)
        return reply.status(200).json(JSON.parse(cachedData))
    }

    try {
        await pool.connect(async (conn) => {
            const likes = await conn.query(sql`
                SELECT 
                    us.user_id,
                    us.user_name
                FROM posts.likes pl
                INNER JOIN users.users us
                ON us.user_id = pl.like_owner_id
                WHERE pl.liked_post_id = ${postID}
            `)

            await CacheClient.set(`${postID}-LIKES`, JSON.stringify(likes.rows))
            log('info', 'cache-updated', { reason: `Cache key ${postID}-LIKES updated` }, request)            
            reply.status(200).json({ likes: likes.rows })
        })
    } catch(err) {
        log('error', 'exception-caught', { reason: err }, request)
        reply.status(500).json({ message: 'Error fetching likes' })
    }
}

export const likePost = async (request: Request, reply: Response) => {
    const { postID } = request.params
    const verify = await z.string().uuid().spa(postID)

    if (!verify.success) return reply.status(400).json({ message: 'Invalid post id' })

    const user = request.user!

    try {
        await pool.connect(async (conn) => {
            const likes = await conn.query(sql`
                SELECT *
                FROM posts.likes
                WHERE like_owner_id = ${user.id}
                AND liked_post_id = ${postID}
            `)

            if (likes.rowCount > 0) return reply.status(400).json({ message: 'Post already liked' })

            await conn.query(sql`
                INSERT
                INTO posts.likes(like_owner_id, liked_post_id)
                VALUES(${user.id}, ${postID})
            `)

            await CacheClient.del(`${postID}-LIKES`)
            log('info', 'post-liked', { reason: `user ${user.id} liked post ${postID}` }, request)
            reply.status(201).json({ message: 'Post liked' })
        })
    } catch(err) {
        log('error', 'exception-caught', { reason: err }, request)
        reply.status(500).json({ message: 'Error liking post' })
    }
}

export const unlikePost = async (request: Request, reply: Response) => {
    const { postID } = request.params
    const verify = await z.string().uuid().spa(postID)

    if (!verify.success) return reply.status(400).json({ message: 'Invalid post id' })

    const user = request.user!

    try {
        await pool.connect(async (conn) => {
            const result = await conn.query(sql`
                DELETE FROM posts.likes
                WHERE
                    like_owner_id = ${user.id}
                AND
                    liked_post_id = ${postID}
                RETURNING *
            `)

            if (result.rowCount < 1) return reply.status(404).json({ message: 'User or post like not found' })

            await CacheClient.del(`${postID}-LIKES`)
            log('info', 'post-unliked', { reason: `user ${user.id} removed like from post ${postID}` }, request)
            reply.status(200).json({ message: 'Post like removed' })
        })
    } catch(err) {
        log('error', 'exception-caught', { reason: err }, request)
        reply.status(500).json({ message: 'Error unliking post' })
    }
}
