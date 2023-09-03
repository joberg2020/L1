
import express from 'express';
import {MemeController} from '../controllers/memeController.js';

export const router = new express.Router();

const controller = new MemeController();

router.post('/', (req, res, next) => controller.getMeme(req, res, next));
