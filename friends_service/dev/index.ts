import dotenv from 'dotenv'
import path from 'path'
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') })
import express from 'express'
import { log } from './helpers/logger'
import { friendsRouter } from './routers/friends.router'
import { friendRequestRouter } from './routers/friends.requests.router'

const PORT = process.env.FRIENDS_SERVICE_PORT || 3002
const server = express()

server.use(express.json())

server.use(async (request, reply, next) => {
    log('info', 'request-incoming', {}, request)
    next()
})

server.use('/friends', friendsRouter)
server.use('/friends/requests', friendRequestRouter)

server.get('/health', async (request, reply) => {
    reply.sendStatus(200)
})

server.listen(PORT, () => {
    log('info', 'server-started', { message: `Server running on port ${PORT}` })
})