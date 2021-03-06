import express from 'express';
import 'express-async-errors';
import { json } from 'body-parser';
import cookieSession from 'cookie-session';

import { currentUser, errorHandler, NotFoundError } from '@nielsendigital/ms-common';
import { createChargeRouter } from './routes/new';

// Routers

const app = express();
// allows for ingress-nginx proxy
app.set('trust proxy', true);
app.use(json());
app.use(
  cookieSession({
    signed: false,
    secure: process.env.NODE_ENV !== 'test',
  })
);
// currentUser must be used after the CookieSession creates req.cookie
app.use(currentUser);

// Routes
app.use(createChargeRouter);

app.all('*', async (req, res, next) => {
  throw new NotFoundError('Page not found.');
});

app.use(errorHandler);

export { app };
