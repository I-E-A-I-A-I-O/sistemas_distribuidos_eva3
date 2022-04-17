import { Request, Response, NextFunction } from 'express'
import { log } from './logger'

export const isAdmin = async (request: Request, reply: Response, next: NextFunction) => {
    const user = request.user!

    if (user.role !== 'admin') {
        log('warn', 'role-not-permitted', { reason: `non-admin user ${user.id} tried to access admins-only resource` }, request)
        return reply.status(403).json({ message: 'You do not have permission to do that' })
    }

    next()
}