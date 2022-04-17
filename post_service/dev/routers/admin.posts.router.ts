import express from 'express'
import { deletePost, updatePost } from '../controllers/admin.posts.controller'
import { isAdmin } from '../helpers/admin-check.middleware.'
import { verifyToken } from '../helpers/jwt.middleware'

export const adminPostRouter = express.Router()

adminPostRouter.patch('/:postID', verifyToken, isAdmin, updatePost)
adminPostRouter.delete('/:postID', verifyToken, isAdmin, deletePost)