import { OrderStatus } from '@nielsendigital/ms-common';
import request from 'supertest';
import { app } from '../../app';
import { Order } from '../../models/order';
import { stripe } from '../../stripe';

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

it('should return a 201 with valid inputs', async () => {
  const userId = global.generatedUserId;

  const price = Math.floor(Math.random() * 100000);

  const order = Order.build({
    id: global.generatedOrderId,
    userId,
    version: 0,
    price,
    status: OrderStatus.Created,
  });

  await order.save();

  const response = await request(app)
    .post('/api/payments')
    .set('Cookie', global.getAuthCookie(userId))
    .send({
      token: 'tok_visa',
      orderId: order.id,
      description: 'Test Suite Transaction from new.test.ts',
    })
    .expect(201);

  const stripeCharges = await stripe.charges.list({ limit: 50 });

  const stripeCharge = stripeCharges.data.find((charge) => {
    return charge.amount === price * 100;
  });

  expect(stripeCharge).toBeDefined();

  expect(stripeCharge!.currency).toEqual('usd');
  expect(stripeCharge!.amount).toEqual(price * 100);
});
