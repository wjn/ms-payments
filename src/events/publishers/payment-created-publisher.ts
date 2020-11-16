import { Topics, PaymentCreatedEvent, Publisher } from '@nielsendigital/ms-common';

export class PaymentCreatedPublisher extends Publisher<PaymentCreatedEvent> {
  readonly topic = Topics.PaymentCreated;
}
