import { Request, Response } from 'express'
import { sql } from 'slonik'
import { z } from 'zod'
import { CacheClient } from '../helpers/cache-client'
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
                INTO posts.posts(post_body, post_date, post_owner_id, parent_post_id)
                VALUES (${body.data.body}, ${(new Date()).toISOString()}, ${user.id}, NULL)
                RETURNING *
            `)

            const post = result.rows[0]
            const cachedData = await CacheClient.get(`${user.id}-POSTS`)

            if (cachedData) {
                const obj: Post[] = JSON.parse(cachedData)
                obj.push(post)
                await CacheClient.set(`${user.id}-POSTS`, JSON.stringify(obj))
            }

            log('info', 'post-created', { reason: `user ${user.id} created a new post ${post.post_id}` }, request)
            reply.status(201).json({ message: 'Post created', post })
        })
    } catch(err) {
        console.log(err)
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

            await CacheClient.del(`${postID}-SINGLE`)
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

    const cachedData = await CacheClient.get(`${postID}-SINGLE`)

    if (cachedData) {
        log('info', 'cache-read', { reason: `Cache key ${postID}-SINGLE read` }, request)
        return reply.status(200).json(JSON.parse(cachedData))
    }

    try {
        await pool.connect(async (conn) => {
            const result = await conn.maybeOne<Post>(sql`
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
            WHERE po.post_id = ${postID}
            `)

            if (!result) return reply.status(404).json({ message: 'Post not found' })

            await CacheClient.set(`${postID}-SINGLE`, JSON.stringify(result), { EX: 300 })
            log('info', 'cache-updated', { reason: `Cache key ${postID}-SINGLE updated` }, request)
            reply.status(200).json(result)
        })
    } catch(err) {
        log('error', 'exception-caught', { reason: err }, request)
        reply.status(500).json({ message: 'Error fetching post' })
    }
}

export const getUserPosts = async (request: Request, reply: Response) => {
    const { userID } = request.params
    const verify = await z.string().uuid().spa(userID)

    if (!verify.success) return reply.status(400).json({ message: 'Invalid user ID' })

    const cachedData = await CacheClient.get(`${userID}-POSTS`)

    if (cachedData) {
        log('info', 'cache-read', { reason: `Cache key ${userID}-POSTS read` }, request)
        return reply.status(200).json(JSON.parse(cachedData))
    }

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
            WHERE
                us.user_id = ${userID}
            `)

            if (result.rowCount < 1) return reply.status(200).json({ message: 'User not found or does not have any posts' })

            await CacheClient.set(`${userID}-POSTS`, JSON.stringify(result.rows), { EX: 300 })
            log('info', 'cache-updated', { reason: `Cache key ${userID}-POSTS updated` }, request)
            reply.status(200).json(result.rows)
        })
    } catch(err) {
        log('error', 'exception-caught', { reason: err }, request)
        reply.status(500).json({ message: 'Error fetching posts' })
    }
}
