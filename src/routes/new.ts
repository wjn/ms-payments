import express, { Request, Response } from 'express';
import { body } from 'express-validator';
import {
  requireAuth,
  validateRequest,
  BadRequestError,
  NotAuthorizedError,
  NotFoundError,
  OrderStatus,
} from '@nielsendigital/ms-common';
import { Order } from '../models/order';

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

    const order = await Order.findById(orderId);

    if (!order) {
      throw new NotFoundError('An order was not found for payment to be applied.');
    }

    // NOTE: requireAuth has stringent check for `currentUser`. Bypassing the
    // TypeScript concerns here because of that.
    if (order.userId !== req.currentUser!.id) {
      throw new NotAuthorizedError('You are not authorized to make payment for this order.');
    }

    if (
      order.status === OrderStatus.CanceledGeneric ||
      order.status === OrderStatus.CanceledByUser ||
      order.status === OrderStatus.CanceledExpired ||
      order.status === OrderStatus.CanceledUnavailable
    ) {
      throw new BadRequestError('Order has been canceled, payment cannot be accepted.');
    }

    res.send({ success: true });
  }
);

export { router as createChargeRouter };
