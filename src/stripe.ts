import { logIt, LogType, NotFoundError } from '@nielsendigital/ms-common';
import Stripe from 'stripe';
import dotenv from 'dotenv';

// Check for STRIPE_KEY presenece (k8s) if not there, then
// grab it from the .env file.
if (!process.env.STRIPE_KEY) {
  const pathToEnv = '../.env';
  dotenv.config({ path: pathToEnv });

  // throw new NotFoundError('STRIPE_KEY k8s secret must be defined.');
}
logIt.out(LogType.INFO, 'STRIPE_KEY ENV Vars verified as defined');

export const stripe = new Stripe(process.env.STRIPE_KEY!, {
  apiVersion: '2020-08-27',
});
