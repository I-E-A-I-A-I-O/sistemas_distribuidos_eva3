import express from 'express'
import { acceptRequest, deleteRequest, getRequests, rejectRequest, sendRequest } from '../controllers/friends.requests.controller'
import { verifyToken } from '../helpers/jwt.middleware'

export const friendRequestRouter = express.Router()

friendRequestRouter.post('/:userID', verifyToken, sendRequest)
friendRequestRouter.get('/', verifyToken, getRequests)
friendRequestRouter.delete('/:requestID', verifyToken, deleteRequest)
friendRequestRouter.post('/:requestID/accepted', verifyToken, acceptRequest)
friendRequestRouter.patch('/:requestID/rejected', verifyToken, rejectRequest)
