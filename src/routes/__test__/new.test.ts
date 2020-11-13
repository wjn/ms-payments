import { OrderStatus } from '@nielsendigital/ms-common';
import request from 'supertest';
import { app } from '../../app';
import { Order } from '../../models/order';

it('should return 404 when order does not exist for purchase', async () => {
  await request(app)
    .post('/api/payments')
    .set('Cookie', global.getAuthCookie())
    .send({
      token: 'aasdfasfasfas',
      orderId: global.generatedOrderId,
    })
    .expect(404);
});
it('should return 401 when order does not belong to user', async () => {
  const order = Order.build({
    id: global.generatedOrderId,
    userId: global.generatedUserId,
    version: 0,
    price: global.validTicketPrice,
    status: OrderStatus.Created,
  });

  await order.save();

  await request(app)
    .post('/api/payments')
    .set('Cookie', global.getAuthCookie())
    .send({
      token: 'aasdfasfasfas',
      orderId: order.id,
    })
    .expect(401);
});
it('should return 400 when order has been canceled', async () => {
  const userId_1 = global.generatedUserId;

  const order = Order.build({
    id: global.generatedOrderId,
    userId: userId_1,
    version: 0,
    price: global.validTicketPrice,
    status: OrderStatus.CanceledGeneric,
  });

  await order.save();

  await request(app)
    .post('/api/payments')
    .set('Cookie', global.getAuthCookie(userId_1))
    .send({
      token: 'aasdfasfasfas',
      orderId: order.id,
    })
    .expect(400);
});
