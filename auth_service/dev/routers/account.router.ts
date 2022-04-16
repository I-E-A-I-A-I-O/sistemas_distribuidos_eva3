import express from 'express'
import { createAcc, deleteAcc } from '../controllers/account.controller'
import { verifyToken } from '../helpers/jwt.middleware'

export const accountRouter = express.Router()

accountRouter.post('/', createAcc)
accountRouter.delete('/', verifyToken, deleteAcc)