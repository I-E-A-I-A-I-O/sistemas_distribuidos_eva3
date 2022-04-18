import { Request, Response } from 'express'
import { sql } from 'slonik'
import { z } from 'zod'
import { pool } from '../helpers/database'
import { log } from '../helpers/logger'
import { Post, zPostBody } from '../helpers/types/posts'

export const createPost = async (request: Request, reply: Response) => {
    const body = await zPostBody.spa(request.body)

    if (!body.success) return reply.status(400).json({ message: 'Malformed request body' })

    const user = request.user!
    try {
        await pool.connect(async (conn) => {
            const result = await conn.query<Post>(sql`
                INSERT
                INTO posts.posts(post_body, post_date, post_owner_id, comment_to_post_id)
                VALUES (${body.data.body}, ${(new Date()).toISOString()}, ${user.id}, NULL)
                RETURNING *
            `)

            const post = result.rows[0]
            log('info', 'post-created', { reason: `user ${user.id} created a new post ${post.post_id}` }, request)
            reply.status(201).json({ message: 'Post created', post })
        })
    } catch(err) {
        log('error', 'exception-caught', { reason: JSON.stringify(err) }, request)
        reply.status(500).json({ message: 'Error creating post' })
    }
}

export const deletePost = async (request: Request, reply: Response) => {
    const { postID } = request.params
    const verify = await z.string().uuid().spa(postID)

    if (!verify.success) return reply.status(400).json({ message: 'Invalid post id' })

    const user = request.user!
    
    try {
        await pool.connect(async (conn) => {
            const result = await conn.query(sql`
                DELETE FROM posts.posts
                WHERE post_id = ${postID}
                AND post_owner_id = ${user.id}
                RETURNING *
            `)

            if (result.rowCount < 1) return reply.status(400).json({ message: 'Could not delete the post' })

            log('info', 'post-deleted', { reason: `user ${user.id} deleted a post` }, request)
            reply.status(200).json({ message: 'Post deleted' })
        })
    } catch(err) {
        log('error', 'exception-caught', { reason: err }, request)
        reply.status(500).json({ message: 'Error deleting post' })
    }
}

export const getPost = async (request: Request, reply: Response) => {
    const { postID } = request.params
    const verify = await z.string().uuid().spa(postID)

    if (!verify.success) return reply.status(400).json({ message: 'Invalid post ID' })

    try {
        await pool.connect(async (conn) => {
            const result = await conn.maybeOne<Post>(sql`
                SELECT
                    po.post_id,
                    po.post_body,
                    po.post_date,
                    us.user_name,
                    likes
                FROM posts.posts po
                INNER JOIN users.users us
                    ON us.user_id = po.post_owner_id
                JOIN (
                    SELECT 
                        COUNT(*) as likes
                    FROM posts.likes
                    WHERE liked_post_id = ${postID}
                ) likes
                WHERE po.post_id = ${postID}
            `)

            if (!result) return reply.status(404).json({ message: 'Post not found' })

            reply.status(200).json(result)
        })
    } catch(err) {
        log('error', 'exception-caught', { reason: err }, request)
        reply.status(500).json({ message: 'Error fetching post' })
    }
}

export const getUserPosts = async (request: Request, reply: Response) => {

}
