const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

const app = express();
const mongoose = require('mongoose');

require('dotenv').config();

mongoose.connect(process.env.DB_HOST);

const { authRouter } = require('./routers/authRouter');
const { userRouter } = require('./routers/userRouter');
const { truckRouter } = require('./routers/truckRouter');
const { loadRouter } = require('./routers/loadRouter');

const { authMiddleware } = require('./middlewares/authMiddleware');

app.use(express.json());
app.use(morgan('tiny'));
app.use(cors());

app.use('/public/photos', express.static(path.resolve(__dirname, 'public', 'photos')));
app.use('/api/auth', authRouter);
app.use('/api/users/me', authMiddleware, userRouter);
app.use('/api/trucks', authMiddleware, truckRouter);
app.use('/api/loads', authMiddleware, loadRouter);

const start = async () => {
  try {
    app.listen(process.env.PORT || 8080, () => {
      console.log(`Server started on ${process.env.PORT}`);
    });
  } catch (err) {
    console.error(`Error on server startup: ${err.message}`);
  }
};

start();

// ERROR HANDLER
app.use(errorHandler);

function errorHandler(err, req, res, next) {
  res.status(err.statusCode || 500).json({ message: err.message });
}
