import { Request, Response } from "express";
import { sql } from "slonik";
import { z } from "zod";
import { pool } from "../helpers/database";
import { log } from "../helpers/logger";
import { zPostBody } from "../helpers/types/posts";


export const updatePost = async (request: Request, reply: Response) => {
    const { postID } = request.params
    const verify = await z.string().uuid().spa(postID)
    const body = await zPostBody.spa(request.body)

    if (!body.success) return reply.status(400).json({ message: 'Malformed request body' })
    else if (!verify.success) return reply.status(400).json({ message: 'Invalid post id' })

    try {
        await pool.connect(async (conn) => {
            const result = await conn.query(sql`
                UPDATE posts.posts
                SET post_body = ${body.data.body}
                WHERE post_id = ${postID}
                RETURNING *
            `)
            
            if (result.rowCount < 1) return reply.status(404).json({ message: 'Post not found' })

            log('info', 'admin-updated-post', { reason: `admin ${request.user?.id} updated the post ${postID}` })
            reply.status(200).json({ message: 'Post updated' })
        })
    } catch(err) {
        log('error', 'exception-caught', { reason: err }, request)
        reply.status(500).json({ message: 'Error updating post' })
    }
}

export const deletePost = async (request: Request, reply: Response) => {
    const { postID } = request.params
    const verify = await z.string().uuid().spa(postID)

    if (!verify.success) return reply.status(400).json({ message: 'Invalid post id' })
    
    try {
        await pool.connect(async (conn) => {
            const result = await conn.query(sql`
                DELETE FROM posts.posts
                WHERE post_id = ${postID}
                RETURNING *
            `)

            if (result.rowCount < 1) return reply.status(404).json({ message: 'Post not found' })

            log('info', 'admin-deleted-post', { reason: `admin ${request.user?.id} deleted a post` }, request)
            reply.status(200).json({ message: 'Post deleted' })
        })
    } catch(err) {
        log('error', 'exception-caught', { reason: err }, request)
        reply.status(500).json({ message: 'Error deleting post' })
    }
}