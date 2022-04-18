import express from 'express'
import { createPost, deletePost } from '../controllers/posts.controller'
import { verifyToken } from '../helpers/jwt.middleware'

export const postsRouter = express.Router()

postsRouter.post('/', verifyToken, createPost)
postsRouter.delete('/:postID', verifyToken, deletePost)
postsRouter.get('/:postID')
postsRouter.get('/:userID')