import express from 'express'
import { createComment, getComments } from '../controllers/comments.controller'
import { verifyToken } from '../helpers/jwt.middleware'

export const commentsRouter = express.Router()

commentsRouter.get('/:postID/comments', getComments)
commentsRouter.post('/:postID/comments', verifyToken, createComment)
