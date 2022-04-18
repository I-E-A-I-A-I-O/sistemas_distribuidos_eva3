import { Request, Response, NextFunction } from 'express'
import { log } from './logger'
import jwt from 'jsonwebtoken'
import { TokenPayload } from './types/token-payload'

export const verifyToken = async (request: Request, reply: Response, next: NextFunction) => {
    const token = request.headers['authorization']

    if (!token) {
        log('warn', 'token-missing', {
            reason: 'Received request without authorization token'
        }, request)
        return reply.status(401).json({ message: 'Access denied.' })
    }

    if (!process.env.JWT_SECRET) {
        log('warn', 'jwt-secret-missing', {
            reason: 'jwt missing not set. Can not decode tokens'
        }, request)
        return reply.status(500).json({ message: 'Server can not verify token.' })
    }

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET, { ignoreExpiration: false }) as TokenPayload
        log('info', 'token-verified', {
            reason: 'JWT Token verified successfully'
        }, request)
        request.user = payload
        next()
    } catch (err) {
        log('warn', 'invalid-token', {
            reason: err
        }, request)
        reply.status(401).json({ message: 'Invalid or expired token.' })
    }
}