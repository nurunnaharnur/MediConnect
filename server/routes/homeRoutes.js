import  Router from 'express'
import express from 'express'
import homeController from '../controllers/homeController.js'  
const router = express.Router()
router.get('/greeting',homeController)

export default router;