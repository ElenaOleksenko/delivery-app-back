const mongoose = require('mongoose');
const Joi = require('joi');

const userJoiSchema = Joi.object({
  username: Joi.string().min(3).required(),
  email: Joi.string()
    .email({ minDomainSegments: 2, tlds: { allow: ['com', 'net', 'yahoo'] } }),

  password: Joi.string()
    .pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')),

  role: Joi.string()
    .pattern(new RegExp('^SHIPPER|DRIVER$')).required(),
});

const User = mongoose.model('User', {
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
    unique: true,
  },
  role: {
    type: String,
    require: true,
  },
  createdDate: {
    type: String,
    default: new Date().toLocaleDateString('en-GB'),
  },
  userPhoto: {
    type: Object,
    default: {},
  },
});

module.exports = {
  User,
  userJoiSchema,
};
