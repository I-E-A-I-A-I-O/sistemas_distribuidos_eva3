import express from 'express'
import { deleteFriend, getFriends } from '../controllers/friends.controller'
import { verifyToken } from '../helpers/jwt.middleware'

export const friendsRouter = express.Router()

friendsRouter.get('/', verifyToken, getFriends)
friendsRouter.delete('/:userID', verifyToken, deleteFriend)
