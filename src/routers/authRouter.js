const express = require('express');

const router = express.Router();
const {
  registerUser, loginUser, userForgotPassword, restorePassword,
} = require('../controllers/authController');

router.post('/register', registerUser);

router.post('/login', loginUser);

router.post('/password-reset', userForgotPassword);

router.patch('/password-change', restorePassword);

module.exports = {
  authRouter: router,
};
