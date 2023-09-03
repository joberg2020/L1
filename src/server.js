import { } from 'dotenv/config';
import express from 'express';
import logger from 'morgan';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {router} from './routes/router.js';


try {
  // Get the path of the current modules directory (src)
  const directoryFullName = dirname(fileURLToPath(import.meta.url));

  const app = express();

  app.use(logger('dev'));

  app.use(express.json());
  app.use(express.urlencoded({extended: false}));
  app.use(express.static(join(directoryFullName, './public')));

  app.use('/', router);

  // Error handler
  app.use((err, req, res, next) => {
    res
        .status(err.status || 500)
        .send(err.message || 'Internal Server Error');
  });

  app.listen(3000, () => {
    console.log('Server is running on port 3000');
  });
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}

