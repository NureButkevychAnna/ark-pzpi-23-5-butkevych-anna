const Joi = require("joi");

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: "Validation error",
        details: error.details.map((detail) => detail.message),
      });
    }
    next();
  };
};

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  name: Joi.string().min(2).max(100).optional(),
  role: Joi.string().valid("user", "admin").optional(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const deviceSchema = Joi.object({
  name: Joi.string().min(1).max(255).required(),
  location_id: Joi.string().uuid().optional().allow(null),
});

const readingSchema = Joi.object({
  measured_at: Joi.date().iso().required(),
  value: Joi.number().required(),
  unit: Joi.string().required(),
  metadata: Joi.object().optional(),
});

const subscriptionSchema = Joi.object({
  channel: Joi.string().valid("email", "sms", "push").required(),
  criteria: Joi.object().required(),
  active: Joi.boolean().optional(),
});

module.exports = {
  validate,
  registerSchema,
  loginSchema,
  deviceSchema,
  readingSchema,
  subscriptionSchema,
};
