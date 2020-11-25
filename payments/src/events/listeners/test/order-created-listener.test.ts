import { natsWrapper, OrderCreatedEvent, OrderStatus } from '@nielsendigital/ms-common';
import { Message } from 'node-nats-streaming';
import { Order } from '../../../models/order';
import { OrderCreatedListener } from '../order-created-listener';

const setup = async () => {
  const listener = new OrderCreatedListener(natsWrapper.client);

  const data: OrderCreatedEvent['data'] = {
    id: global.generatedOrderId,
    userId: 'qwerqwerqwr',
    version: 0,
    expiresAt: 'asdfasf',
    status: OrderStatus.Created,
    ticket: global.ticketBodyValid,
  };

  // @ts-ignore
  const msg: Message = {
    ack: jest.fn(),
  };

  return { listener, data, msg };
};

it('should replicate the order info', async () => {
  const { listener, data, msg } = await setup();

  await listener.onMessage(data, msg);

  const order = await Order.findById(data.id);
  expect(order!.price).toEqual(data.ticket.price);
});

it('should ack the message', async () => {
  const { listener, data, msg } = await setup();

  await listener.onMessage(data, msg);

  expect(msg.ack).toHaveBeenCalledTimes(1);
});
