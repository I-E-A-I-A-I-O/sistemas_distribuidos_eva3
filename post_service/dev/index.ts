import dotenv from 'dotenv'
import path from 'path'
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') })
import express from 'express'
import { log } from './helpers/logger'
import { postsRouter } from './routers/posts.router'
import { adminPostRouter } from './routers/admin.posts.router'
import { likesRouter } from './routers/likes.router'
import { commentsRouter } from './routers/comments.router'

const PORT = process.env.POST_SERVICE_PORT || 3001
const server = express()

server.use(express.json())

server.use(async (request, reply, next) => {
    log('info', 'request-incoming', {}, request)
    next()
})

server.use('/posts', postsRouter)
server.use('/posts', likesRouter)
server.use('/posts', commentsRouter)
server.use('/posts/admin', adminPostRouter)

server.get('/health', async (request, reply) => {
    reply.sendStatus(200)
})

server.listen(PORT, () => {
    log('info', 'server-started', { message: `Server running on port ${PORT}` })
})