import Joi from 'joi';

export const addToCartSchema = {
  body: Joi.object({
    productId: Joi.string().hex().length(24).required(),
    quantity: Joi.number().integer().min(1).default(1),
    selectedAttributes: Joi.object().pattern(Joi.string(), Joi.string()).default({})
  })
};

export const updateCartItemSchema = {
  params: Joi.object({
    itemId: Joi.string().hex().length(24).required()
  }),
  body: Joi.object({
    quantity: Joi.number().integer().min(1).required()
  })
};

export const removeCartItemSchema = {
  params: Joi.object({
    itemId: Joi.string().hex().length(24).required()
  })
};
