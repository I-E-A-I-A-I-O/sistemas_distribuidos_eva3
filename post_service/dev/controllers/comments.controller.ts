import { Request, Response } from "express";
import { sql } from "slonik";
import { z } from "zod";
import { pool } from "../helpers/database";
import { log } from "../helpers/logger";
import { Post, zPostBody } from "../helpers/types/posts";

export const getComments = async (request: Request, reply: Response) => {
    const { postID } = request.params
    const verify = await z.string().uuid().spa(postID)

    if (!verify.success) return reply.status(400).json({ message: 'Invalid post id' })

    try {
        await pool.connect(async (conn) => {
            const result = await conn.query<Post>(sql`
            SELECT 
                po.post_id,
                po.post_body,
                po.post_date,
                us.user_id as poster_id,
                us.user_name as poster,
                pl.post_likes,
                pc.post_comments
            FROM posts.posts po 
            INNER JOIN users.users us 
                ON us.user_id = po.post_owner_id
            LEFT JOIN (
                SELECT
                    liked_post_id,
                    COUNT(*) AS post_likes
                FROM posts.likes
                GROUP BY liked_post_id
            ) pl ON pl.liked_post_id = po.post_id
            LEFT JOIN (
                SELECT
                    parent_post_id,
                    COUNT(*) AS post_comments
                FROM posts.posts
                GROUP BY parent_post_id
            ) pc ON pc.parent_post_id = po.post_id
            WHERE po.parent_post_id = ${postID}
            `)

            reply.status(200).json({ comments: result.rows })
        })
    } catch(err) {
        log('error', 'exception-caught', { reason: err }, request)
        reply.status(500).json({ message: 'Error fetching comments' })
    }
}

export const createComment = async (request: Request, reply: Response) => {
    const { postID } = request.params
    const verify = await z.string().uuid().spa(postID)
    const body = await zPostBody.spa(request.body)

    if (!body.success) return reply.status(400).json({ message: 'Malformed request body' })
    else if (!verify.success) return reply.status(400).json({ message: 'Invalid post id' })

    const user = request.user!

    try {
        await pool.connect(async (conn) => {
            const result = await conn.one<Post>(sql`
            INSERT
                INTO posts.posts(post_body, post_date, post_owner_id, parent_post_id)
                VALUES (${body.data.body}, ${(new Date()).toISOString()}, ${user.id}, ${postID})
            RETURNING *
            `)

            log('info', 'comment-created', { reason: `user ${user.id} created comment ${result.post_id} on post ${postID}` }, request)
            reply.status(201).json({ message: 'Comment created', comment: result })
        })
    } catch(err) {
        log('error', 'exception-caught', { reason: err }, request)
        reply.status(500).json({ message: 'Error creating comment' })
    }
}
