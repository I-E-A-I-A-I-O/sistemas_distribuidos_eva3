import express from 'express'

export const postsRouter = express.Router()

postsRouter.post('/')
postsRouter.delete('/:postID')