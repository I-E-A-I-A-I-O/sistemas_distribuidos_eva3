import express from 'express'
import { createComment } from '../controllers/comments.controller'
import { verifyToken } from '../helpers/jwt.middleware'

export const commentsRouter = express.Router()

commentsRouter.post('/:postID/comments', verifyToken, createComment)
