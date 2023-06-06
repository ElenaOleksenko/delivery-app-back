const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const randtoken = require('rand-token');
const { RegistrationToken } = require('../models/RegistrationToken');
const { User, userJoiSchema } = require('../models/User');
const { UserToken } = require('../models/UserToken');
const sendEmail = require('../nodeMailer');
const mailer = require('../nodeMailer');
const { saveUser } = require('../services/userService');

const registerUser = async (req, res, next) => {
  const {
    username, email, password, role,
  } = req.body;
  if (!username || !email || !password || !role) {
    res.status(400).json({ message: 'The field must not be empty' });
  }
  const candidate = await User.findOne({ email });
  if (candidate) {
    res.status(400).json({
      message: 'User with such email already exists',
    });
  } else {
    await userJoiSchema.validateAsync({
      username, email, password, role,
    });

    const user = await saveUser({
      username, email, password, role,
    });
    const newUser = await User.findOne({ email: req.body.email });
    return await res.status(200).json({
      message: 'Profile created successfully',
    });
  }
};

const loginUser = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (user && await bcryptjs.compare(String(req.body.password), String(user.password))) {
      const payload = {
        username: user.username,
        email: user.email,
        role: user.role,
        userId: user._id,
        createdDate: user.createdDate,
      };
      const jwtToken = jwt.sign(payload, process.env.SECRET_JWT_KEY);
      const userToken = new UserToken({
        userId: user._id,
        token: jwtToken,
        createdAt: Date.now(),

      });
      await userToken.save();
      return res.status(200).json({
        user: {
          username: user.username,
          email: user.email,
          role: user.role,
          userPhoto: user.userPhoto,
          jwt_token: jwtToken,
        },
      });
    }
    return res.status(403).json({ message: 'Not authorized' });
  } catch (err) {
    res.status(500).json({
      message: 'Server error',
    });
  }
};

const userForgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'The field must not be empty' });
    }
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(400).json({ message: 'User with this email was not found' });
    }
    const { id } = user;
    const passwordResetToken = await RegistrationToken.findOne({ userId: id });
    if (passwordResetToken) {
      await passwordResetToken.deleteOne();
    }
    const token = randtoken.generate(20);
    const hashToken = await bcryptjs.hash(token, 10);
    const newToken = new RegistrationToken({
      userId: id,
      token: hashToken,
      createdAt: Date.now(),
    });
    await newToken.save();
    let text;
    await sendEmail(email, 'Password reset', token, user._id, text);
    return res.status(200).json({ message: 'Congratulations!' });
  } catch (err) {
    res.status(500).json({
      message: 'Server error',
    });
  }
};

const restorePassword = async (req, res, next) => {
  try {
    const { id, token, password } = req.body;
    if (!id || !token || !password) {
      res.status(400).json({ message: 'The field must not be empty' });
    }
    const passwordResetToken = await RegistrationToken.findOne({ userId: id });
    if (!passwordResetToken) {
      res.status(400).json({ message: 'Invalid or expired password reset token' });
      throw new Error('Invalid or expired password reset token');
    }
    const isValid = await bcryptjs.compare(String(token), String(passwordResetToken.token));
    if (!isValid) {
      res.status(400).json({ message: 'Invalid or expired password reset token' });
      throw new Error('Invalid or expired password reset token');
    }
    await passwordResetToken.deleteOne();
    const hash = await bcryptjs.hash(password, 10);
    await User.updateOne(
      { _id: id },
      { $set: { password: hash } },
      { new: true },
    );
    const user = await User.findById({ _id: id });
    sendEmail(
      user.email,
      'Password Reset Successfully',
      {
        email: user.email,
      },
      './template/resetPassword.handlebars',
    );
    return res.status(200).json({ message: 'Password Reset Successfully' });
  } catch (err) {
    res.status(500).json({
      message: 'Server error',
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  userForgotPassword,
  restorePassword,
};
