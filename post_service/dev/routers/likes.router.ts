import express from 'express'
import { likePost, unlikePost } from '../controllers/likes.controller'
import { verifyToken } from '../helpers/jwt.middleware'

export const likesRouter = express.Router()

likesRouter.post('/:postID/likes', verifyToken, likePost)
likesRouter.delete('/:postID/likes', verifyToken, unlikePost)
