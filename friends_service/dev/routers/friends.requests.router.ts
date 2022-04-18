import express from 'express'
import { sendRequest } from '../controllers/friends.requests.controller'
import { verifyToken } from '../helpers/jwt.middleware'

export const friendRequestRouter = express.Router()

friendRequestRouter.post('/:userID', verifyToken, sendRequest)