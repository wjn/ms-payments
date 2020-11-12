import {
  OrderCanceledEvent,
  Topics,
  Listener,
  queueGroupNames,
  NotFoundError,
  OrderStatus,
} from '@nielsendigital/ms-common';
import { Message } from 'node-nats-streaming';
import { Order } from '../../models/order';

export class OrderCanceledListener extends Listener<OrderCanceledEvent> {
  readonly topic = Topics.OrderCanceled;
  queueGroupName = queueGroupNames.PAYMENTS_SERVICE;

  async onMessage(data: OrderCanceledEvent['data'], msg: Message) {
    const order = await Order.findOne({
      _id: data.id,
      version: data.version - 1,
    });

    if (!order) {
      throw new NotFoundError(`Order not found.`);
    }

    order.set({ status: OrderStatus.CanceledGeneric });
    await order.save();

    msg.ack();
  }
}
