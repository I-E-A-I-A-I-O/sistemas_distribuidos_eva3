import express from 'express'
import { getLikes, likePost, unlikePost } from '../controllers/likes.controller'
import { verifyToken } from '../helpers/jwt.middleware'

export const likesRouter = express.Router()

likesRouter.get('/:postID/likes', getLikes)
likesRouter.post('/:postID/likes', verifyToken, likePost)
likesRouter.delete('/:postID/likes', verifyToken, unlikePost)
