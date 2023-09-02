
import express from 'express'
import { memeController } from '../controllers/memeController.js'

export const router = express.Router()

const controller = new memeController()

router.get('/', (req, res, next) => controller.getMeme(req, res, next))