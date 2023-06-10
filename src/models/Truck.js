const mongoose = require('mongoose');
const Joi = require('joi');

const Truck = mongoose.model('Truck', {
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  assigned_to: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
  },
  type: {
    type: String,
    enum: ['sprinter', 'small stright', 'large stright'],
  },
  status: {
    type: String,
    enum: ['IS', 'OL'],
  },
  createdDate: {
    type: String,
    default:
    new Date().toLocaleDateString('en-GB'),
  },
});

module.exports = {
  Truck,
};
