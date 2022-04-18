import express from 'express'
import { verifyToken } from '../helpers/jwt.middleware'

export const friendsRouter = express.Router()

friendsRouter.post('/:userID', verifyToken)
friendsRouter.get('/', verifyToken)
friendsRouter.delete('/:userID', verifyToken)
