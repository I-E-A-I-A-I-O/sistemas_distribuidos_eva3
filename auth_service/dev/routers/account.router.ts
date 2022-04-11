import express from 'express'
import { createAcc } from '../controllers/account.controller'

export const accountRouter = express.Router()

accountRouter.post('/', createAcc)
accountRouter.patch('/:userID')
accountRouter.delete('/:userID')