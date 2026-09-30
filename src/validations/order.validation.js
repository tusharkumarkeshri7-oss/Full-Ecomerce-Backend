import Joi from 'joi';
import { ORDER_STATUS, PAYMENT_METHODS } from '../constants/orderStatus.js';

export const createOrderSchema = {
  body: Joi.object({
    shippingAddress: Joi.object({
      fullName: Joi.string().trim().required(),
      phone: Joi.string().trim().required(),
      street: Joi.string().trim().required(),
      city: Joi.string().trim().required(),
      state: Joi.string().trim().required(),
      postalCode: Joi.string().trim().required(),
      country: Joi.string().trim().default('US')
    }).required(),
    paymentMethod: Joi.string()
      .valid(...Object.values(PAYMENT_METHODS))
      .default(PAYMENT_METHODS.MOCK)
  })
};

export const updateOrderStatusSchema = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required()
  }),
  body: Joi.object({
    status: Joi.string()
      .valid(...Object.values(ORDER_STATUS))
      .required(),
    note: Joi.string().trim().allow(''),
    trackingNumber: Joi.string().trim().allow('')
  })
};

export const cancelOrderSchema = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required()
  }),
  body: Joi.object({
    reason: Joi.string().trim().min(3).required()
  })
};
