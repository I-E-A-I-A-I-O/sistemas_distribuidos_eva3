import express from 'express'
import { login } from '../controllers/session.controller'

export const sessionRouter = express.Router()

sessionRouter.post('/', login)