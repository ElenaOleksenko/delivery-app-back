const mongoose = require('mongoose');
const Joi = require('joi');

const loadJoiSchema = Joi.object({
  name: Joi.string().min(4).required(),
  payload: Joi.number().required(),
  pickup_address: Joi.string().min(15).required(),
  delivery_address: Joi.string().min(15).required(),
  dimensions: {
    width: Joi.number().required(),
    length: Joi.number().required(),
    height: Joi.number().required(),
  },
});

const Load = mongoose.model('Load', {
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
  },
  assigned_to: {
    type: mongoose.Schema.Types.ObjectId,
  },
  status: {
    type: String,
    default: 'NEW',
    enum: ['NEW', 'POSTED', 'ASSIGNED', 'SHIPPED', 'ARCHIVE'],
    required: true,
  },
  state: {
    type: String,
    enum: ['En route to Pick Up', 'Arrived to Pick Up', 'En route to delivery', 'Arrived to delivery', 'Received'],
  },
  name: {
    type: String,
    required: true,
  },
  payload: {
    type: Number,
    required: true,
  },
  pickup_address: {
    type: String,
    required: true,
  },
  delivery_address: {
    type: String,
    required: true,
  },
  dimensions: {
    width:	{
      type: Number,
      required: true,
    },
    length: {
      type: Number,
      required: true,
    },
    height: {
      type: Number,
      required: true,
    },
  },
  logs: [{
    message: {
      type: String,
      required: true,
    },
    time: {
      type: String,
      required: true,
    },
  },
  ],
  createdDate: {
    type: String,
    default: new Date().toLocaleDateString('en-GB'),
  },
  readByDriver: {
    type: Boolean,
    default: false,
  },
  readByShipper: {
    type: Boolean,
    default: false,
  },
});

module.exports = {
  Load,
  loadJoiSchema,
};
