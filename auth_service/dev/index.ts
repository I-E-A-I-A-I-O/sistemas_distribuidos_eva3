import dotenv from 'dotenv'
import path from 'path'
dotenv.config({ path: path.join('..', '..', '.env') })
import express from 'express'
import { log } from './helpers/logger'
import { accountRouter } from './routers/account.router'
import { adminAccRouter } from './routers/admin.account.router'
import { sessionRouter } from './routers/session.router'

const PORT = process.env.AUTH_SERVICE_PORT || 3000
const server = express()

server.use(express.json())

server.use(async (request, reply, next) => {
    log('info', 'request-incoming', {}, request)
    next()
})

server.use('/auth/session', sessionRouter)
server.use('/auth/users', accountRouter)
server.use('/auth/admin/users', adminAccRouter)

server.get('/health', async (request, reply) => {
    reply.sendStatus(200)
})

server.listen(PORT, () => {
    log('info', 'server-started', { message: `Server running on port ${PORT}` })
})