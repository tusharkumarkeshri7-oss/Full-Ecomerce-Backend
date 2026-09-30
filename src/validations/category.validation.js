import Joi from 'joi';

export const createCategorySchema = {
  body: Joi.object({
    name: Joi.string().trim().min(2).max(100).required(),
    description: Joi.string().trim().max(500).allow(''),
    parentCategory: Joi.string().hex().length(24).allow(null),
    image: Joi.string().uri().allow(''),
    isActive: Joi.boolean().default(true)
  })
};

export const updateCategorySchema = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required()
  }),
  body: Joi.object({
    name: Joi.string().trim().min(2).max(100),
    description: Joi.string().trim().max(500).allow(''),
    parentCategory: Joi.string().hex().length(24).allow(null),
    image: Joi.string().uri().allow(''),
    isActive: Joi.boolean()
  }).min(1)
};
