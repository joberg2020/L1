
import express from 'express';
import {router as memeRouter} from './memeRouter.js';

export const router = new express.Router();


router.use('/memes', memeRouter);

router.use('*', (req, res, next) => {
  const error = new Error('Route not found');
  error.status = 404;
  next(error);
});
