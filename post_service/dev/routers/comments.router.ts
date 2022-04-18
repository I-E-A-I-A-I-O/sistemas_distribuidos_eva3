import express from 'express'
import { verifyToken } from '../helpers/jwt.middleware'

export const commentsRouter = express.Router()

commentsRouter.post('/:postID/comments', verifyToken)
