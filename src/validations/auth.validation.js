import Joi from 'joi';
import { ALL_ROLES } from '../constants/roles.js';

export const registerSchema = {
  body: Joi.object({
    name: Joi.string().trim().min(2).max(100).required(),
    email: Joi.string().trim().email().required(),
    password: Joi.string().min(6).required(),
    phone: Joi.string().trim().allow(''),
    role: Joi.string().valid(...ALL_ROLES)
  })
};

export const loginSchema = {
  body: Joi.object({
    email: Joi.string().trim().email().required(),
    password: Joi.string().required()
  })
};

export const refreshTokenSchema = {
  body: Joi.object({
    refreshToken: Joi.string().required()
  })
};

export const forgotPasswordSchema = {
  body: Joi.object({
    email: Joi.string().trim().email().required()
  })
};

export const resetPasswordSchema = {
  body: Joi.object({
    token: Joi.string().required(),
    password: Joi.string().min(6).required()
  })
};

export const updatePasswordSchema = {
  body: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(6).required()
  })
};

export const updateProfileSchema = {
  body: Joi.object({
    name: Joi.string().trim().min(2).max(100),
    phone: Joi.string().trim().allow('')
  }).min(1)
};

export const addAddressSchema = {
  body: Joi.object({
    fullName: Joi.string().trim().required(),
    phone: Joi.string().trim().required(),
    street: Joi.string().trim().required(),
    city: Joi.string().trim().required(),
    state: Joi.string().trim().required(),
    postalCode: Joi.string().trim().required(),
    country: Joi.string().trim().default('US'),
    isDefault: Joi.boolean().default(false)
  })
};
