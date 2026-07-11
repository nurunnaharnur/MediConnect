import  Router from 'express'
import express from 'express'
import homeController from '../controllers/homeController.js'  
import authController from '../controllers/authController.js'
const router = express.Router()
router.get('/login',authController)

export default router;