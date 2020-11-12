import { natsWrapper, OrderCanceledEvent, OrderStatus } from '@nielsendigital/ms-common';
import { Order } from '../../../models/order';
import { OrderCanceledListener } from '../order-canceled-listener';

const setup = async () => {
  const listener = new OrderCanceledListener(natsWrapper.client);

  const order = Order.build({
    id: global.generatedOrderId,
    userId: 'asfasfasf',
    version: 0,
    price: global.validTicketPrice,
    status: OrderStatus.Created,
  });

  await order.save();

  const data: OrderCanceledEvent['data'] = {
    id: order.id,
    version: order.version + 1,
    status: order.status,
    userId: '8qwerqw',
    expiresAt: 'asdfaf',
    ticket: global.ticketBodyValid,
  };

  // @ts-ignore
  const msg: Message = {
    ack: jest.fn(),
  };

  return { listener, data, msg, order };
};

it('should update status of the order', async () => {
  const { listener, data, msg, order } = await setup();

  await listener.onMessage(data, msg);

  const updatedOrder = await Order.findById(order.id);

  expect(updatedOrder!.status).toEqual(OrderStatus.CanceledGeneric);
});

it('should ack the message', async () => {
  const { listener, data, msg, order } = await setup();

  await listener.onMessage(data, msg);

  expect(msg.ack).toHaveBeenCalledTimes(1);
});
