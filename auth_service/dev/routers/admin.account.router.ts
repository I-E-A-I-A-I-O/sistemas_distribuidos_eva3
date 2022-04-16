import express from 'express'
import { deleteAcc, editAcc } from '../controllers/admin.account.controller'
import { isAdmin } from '../helpers/admin-check.middleware.'
import { verifyToken } from '../helpers/jwt.middleware'

export const adminAccRouter = express.Router()

adminAccRouter.patch('/:userID', verifyToken, isAdmin, editAcc)
adminAccRouter.delete('/:userID', verifyToken, isAdmin, deleteAcc)