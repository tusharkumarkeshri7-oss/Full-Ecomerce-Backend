import Joi from 'joi';

export const createReviewSchema = {
  params: Joi.object({
    productId: Joi.string().hex().length(24).required()
  }),
  body: Joi.object({
    rating: Joi.number().min(1).max(5).required(),
    title: Joi.string().trim().max(100).allow(''),
    comment: Joi.string().trim().min(3).max(1000).required()
  })
};

export const updateReviewSchema = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required()
  }),
  body: Joi.object({
    rating: Joi.number().min(1).max(5),
    title: Joi.string().trim().max(100).allow(''),
    comment: Joi.string().trim().min(3).max(1000)
  }).min(1)
};
