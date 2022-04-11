import express from 'express'

export const adminAccRouter = express.Router()

adminAccRouter.patch('/:userID')
adminAccRouter.delete('/:userID')