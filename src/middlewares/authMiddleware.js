const jwt = require('jsonwebtoken');
const { User } = require('../models/User');

const authMiddleware = async (req, res, next) => {
  const {
    authorization,
  } = req.headers;

  if (!authorization) {
    res.status(400).json({
      message: 'Please, provide authorization header',
    });
  }

  const [, token] = authorization.split(' ');

  if (!token) {
    res.status(400).json({
      message: 'Please, include token to request',
    });
  }

  try {
    const tokenPayload = jwt.verify(token, process.env.SECRET_JWT_KEY);
    const userRecord = await User.findOne({ _id: tokenPayload.userId });
    req.user = userRecord;

    req.user = {
      userId: tokenPayload.userId,
      username: tokenPayload.username,
      email: tokenPayload.email,
      role: tokenPayload.role,
      createdDate: tokenPayload.createdDate,
    };
    next();
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

module.exports = {
  authMiddleware,
};
