import express, { Request, Response } from 'express';
import { body } from 'express-validator';
import {
  requireAuth,
  validateRequest,
  BadRequestError,
  NotAuthorizedError,
  NotFoundError,
  OrderStatus,
  logIt,
  LogType,
  natsWrapper,
} from '@nielsendigital/ms-common';
import { Order } from '../models/order';
import { Payment } from '../models/payment';
import { stripe } from '../stripe';
import { PaymentCreatedPublisher } from '../events/publishers/payment-created-publisher';

// instantiate router
const router = express.Router();

// Payments Endpoint
router.post(
  '/api/payments',
  // enforce auth
  requireAuth,
  // validation params
  [body('token').not().isEmpty(), body('orderId').not().isEmpty()],
  // enforce validation
  validateRequest,
  // handle request
  async (req: Request, res: Response) => {
    const { token, orderId } = req.body;

    // Description is used to describe to the purchaser in their credit card
    // statement what the Stripe charge is for.
    let description = req.body.description;

    if (!description) {
      description = 'Ticket Purchase';
    }

    const order = await Order.findById(orderId);

    // Require that an order be found
    if (!order) {
      throw new NotFoundError('An order was not found for payment to be applied.');
    }

    // NOTE: requireAuth has stringent check for `currentUser`. Bypassing the
    // TypeScript concerns here because of that.
    if (order.userId !== req.currentUser!.id) {
      throw new NotAuthorizedError('You are not authorized to make payment for this order.');
    }

    // Require that the order *NOT* be canceled
    // Currently CancledGeneric is the only status in use. Eventually, we'll
    // iterate to handling different kinds of cancelations to make
    // better business analytics.
    if (
      order.status === OrderStatus.CanceledGeneric ||
      order.status === OrderStatus.CanceledByUser ||
      order.status === OrderStatus.CanceledExpired ||
      order.status === OrderStatus.CanceledUnavailable
    ) {
      throw new BadRequestError('Order has been canceled, payment cannot be accepted.');
    }

    // create Stripe Charge
    const charge = await stripe.charges.create({
      currency: 'usd',
      // convert dollars into cents for stripe
      amount: order.price * 100,
      description,
      source: token,
    });

    logIt.out(LogType.SENT, `Charge for order (${order.id} for $ ${order.price}) with token ${token}`);

    const payment = Payment.build({
      orderId,
      stripeId: charge.id,
    });
    await payment.save();

    new PaymentCreatedPublisher(natsWrapper.client).publish({
      id: payment.id,
      orderId: payment.orderId,
      stripeId: payment.stripeId,
    });

    res.status(201).send({ id: payment.id });
  }
);

export { router as createChargeRouter };
