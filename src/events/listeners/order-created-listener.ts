import { Listener, OrderCreatedEvent, Topics, queueGroupNames, OrderData } from '@nielsendigital/ms-common';
import { Message } from 'node-nats-streaming';
import { Order } from '../../models/order';

export class OrderCreatedListener extends Listener<OrderCreatedEvent> {
  readonly topic = Topics.OrderCreated;
  queueGroupName = queueGroupNames.PAYMENTS_SERVICE;

  async onMessage(data: OrderData, msg: Message) {
    const order = Order.build({
      id: data.id,
      userId: data.userId,
      price: data.ticket.price,
      status: data.status,
      version: data.version,
    });

    await order.save();

    msg.ack();
  }
}
