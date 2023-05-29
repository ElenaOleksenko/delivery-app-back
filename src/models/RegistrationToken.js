const mongoose = require('mongoose');

const RegistrationToken = mongoose.model('RegistrationToken', {
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'user',
  },
  token: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 3600,
  },
});

module.exports = {
  RegistrationToken,
};
