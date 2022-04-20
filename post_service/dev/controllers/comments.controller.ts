import { Request, Response } from "express";
import { sql } from "slonik";
import { z } from "zod";
import { pool } from "../helpers/database";
import { log } from "../helpers/logger";
import { Post, zPostBody } from "../helpers/types/posts";

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
