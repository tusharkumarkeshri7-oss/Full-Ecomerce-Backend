import Joi from 'joi';

export const createProductSchema = {
  body: Joi.object({
    name: Joi.string().trim().min(2).max(200).required(),
    description: Joi.string().trim().min(5).required(),
    price: Joi.number().positive().precision(2).required(),
    discountPrice: Joi.number().min(0).precision(2).default(0),
    sku: Joi.string().trim().uppercase().required(),
    category: Joi.string().hex().length(24).required(),
    brand: Joi.string().trim().default('Generic'),
    images: Joi.array().items(Joi.string().uri()).default([]),
    stock: Joi.number().integer().min(0).default(0),
    isActive: Joi.boolean().default(true),
    tags: Joi.array().items(Joi.string().trim()).default([]),
    attributes: Joi.object().pattern(Joi.string(), Joi.string()).default({})
  })
};

export const updateProductSchema = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required()
  }),
  body: Joi.object({
    name: Joi.string().trim().min(2).max(200),
    description: Joi.string().trim().min(5),
    price: Joi.number().positive().precision(2),
    discountPrice: Joi.number().min(0).precision(2),
    sku: Joi.string().trim().uppercase(),
    category: Joi.string().hex().length(24),
    brand: Joi.string().trim(),
    images: Joi.array().items(Joi.string().uri()),
    stock: Joi.number().integer().min(0),
    isActive: Joi.boolean(),
    tags: Joi.array().items(Joi.string().trim()),
    attributes: Joi.object().pattern(Joi.string(), Joi.string())
  }).min(1)
};

export const queryProductSchema = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sort: Joi.string(),
    fields: Joi.string(),
    search: Joi.string().trim().allow(''),
    category: Joi.string().hex().length(24),
    brand: Joi.string().trim(),
    price: Joi.object({
      gte: Joi.number().min(0),
      lte: Joi.number().min(0),
      gt: Joi.number().min(0),
      lt: Joi.number().min(0)
    }),
    inStock: Joi.boolean()
  }).unknown(true)
};
