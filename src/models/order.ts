import { OrderStatus } from '@nielsendigital/ms-common';
import mongoose from 'mongoose';
import { updateIfCurrentPlugin } from 'mongoose-update-if-current';

/**
 * We only list id in OrderAdders for when we create an Order it
 * must have an id. OrderDoc on the other hand assumes an `id` because the
 * mongoDB creates it.
 */
interface OrderAttrs {
  id: string;
  version: number;
  userId: string;
  price: number;
  status: OrderStatus;
}

/**
 * Remember this is the description of the document that Mongoose will return
 * when making an Order via the Mongoose.Model method. OrderModel must return
 * OrderDoc as it's defined here.
 */
interface OrderDoc extends mongoose.Document {
  version: number;
  userId: string;
  price: number;
  status: OrderStatus;
}

interface OrderModel extends mongoose.Model<OrderDoc> {
  build(attrs: OrderAttrs): OrderDoc;
}

/**
 * We don't include the version here in the Schema, because it is managed
 * automatically.
 */

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: Object.values(OrderStatus),
      default: OrderStatus.Created, // << should this be awaitingPaymnent???
    },
  },
  {
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
      },
    },
  }
);

orderSchema.set('versionKey', 'version');
orderSchema.plugin(updateIfCurrentPlugin);

orderSchema.statics.build = (attrs: OrderAttrs): OrderDoc => {
  return new Order({
    _id: attrs.id,
    userId: attrs.userId,
    version: attrs.version,
    price: attrs.price,
    status: attrs.status,
  });
};

const Order = mongoose.model<OrderDoc, OrderModel>('Order', orderSchema);

export { Order };
