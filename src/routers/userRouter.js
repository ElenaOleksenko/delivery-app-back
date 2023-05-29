const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const upload = require('../middlewares/fileMiddleware');

const router = express.Router();
const {
  getUserProfile, logoutUser, editPasswordUser, postImageProfile,
  getImageProfile, deleteImageProfile,
  updateUserCredentials, deleteUserProfile,
} = require('../controllers/userController');

router.get('/', getUserProfile);
router.post('/profile-picture', upload.single('photo'), postImageProfile);
router.delete('/delete-photo', deleteImageProfile);
router.put('/update-user', updateUserCredentials);
router.patch('/password', editPasswordUser);
router.delete('/logout', logoutUser);
router.delete('/delete-user', deleteUserProfile);

module.exports = {
  userRouter: router,
};
