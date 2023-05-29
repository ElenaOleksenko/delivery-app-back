const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const { User } = require('../models/User');
const { UserToken } = require('../models/UserToken');
const { Load } = require('../models/Load');
const { Truck } = require('../models/Truck');

const getUserProfile = async (req, res, next) => {
  try {
    const {
      _id, email, role, createdDate,
    } = await User.findOne({ _id: req.user.userId });
    res.status(200).json({
      user: {
        _id,
        email,
        role,
        createdDate,
      },
    });
  } catch (error) {
    res.status(400).json({
      message: 'This user does not exist',
    });
  }
};

async function editPasswordUser(req, res, next) {
  try {
    const { oldPassword } = req.body;
    const { newPassword } = req.body;
    const { userId, email } = req.user;
    const user = await User.findOne({ email });

    if (oldPassword && newPassword && await bcrypt.compare(
      String(oldPassword),
      String(user.password),
    )) {
      const newPasswordHash = await bcrypt.hash(newPassword, 10);
      await User.findByIdAndUpdate(userId, { $set: { password: newPasswordHash } });
      res.status(200).json({
        message: 'Password changed successfully',
      });
    } else {
      res.status(400).json({ message: 'Wrong old password entered. The password has not been changed.' });
    }
  } catch (error) {
    res.status(500).json({
      message: 'Password was not changed. Server error',
    });
  }
}

const postImageProfile = async (req, res, next) => {
  try {
    if (req.fileValidationError) {
      const error = new Error(req.fileValidationError);
      error.statusCode = 400;
      next(error);
    }
    const uploadedFile = req.file.filename;
    await User.findByIdAndUpdate({ _id: req.user.userId }, {
      $set: {
        userPhoto: {
          fileName: uploadedFile,
          filePath: `/photos/${req.user.userId}/${uploadedFile}`,
        },
      },
    });
    const updateUser = await User.findOne({ _id: req.user.userId });

    res.status(200).json({
      updateUser,
      message: 'Profile photo has been successfully changed',
    });
  } catch (err) {
    res.status(500).json({
      message: 'Server error',
    });
  }
};

const deleteImageProfile = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const user = await User.findByIdAndUpdate({ _id: req.user.userId });
    const uploadPath = path.join(__dirname, '../', 'public', 'photos', userId, user.userPhoto.fileName);

    fs.unlink(uploadPath, async (err) => {
      if (err) {
        res.status(400).json({ message: 'Error deleting profile picture' });
      } else {
        await User.findByIdAndUpdate({ _id: req.user.userId }, {
          $set: {
            userPhoto: { fileName: '', filePath: '' },
          },
        });
        const updateUser = await User.findOne({ _id: req.user.userId });
        res.status(200).json({
          updateUser,
        });
      }
    });
  } catch (err) {
    res.status(500).json({
      message: 'Server error',
    });
  }
};

const updateUserCredentials = async (req, res, next) => {
  try {
    const { username, email } = req.body;
    if (!username || !email) {
      res.status(400).json({ message: 'The fields must not be empty' });
    }
    const currentUser = await User.findOne({ _id: req.user.userId });

    if (currentUser) {
      await User.findByIdAndUpdate({ _id: req.user.userId }, {
        $set: {
          username, email,
        },
      });
    } else {
      res.status(400).json({ message: 'Something went wrong. Personal data has not been changed' });
    }
    const updateUser = await User.findOne({ _id: req.user.userId });
    res.status(200).json({
      updateUser,
      message: 'Personal data has been successfully changed',
    });
  } catch (error) {
    res.status(500).json({
      message: 'Server error. No changes have been made',
    });
  }
};

async function logoutUser(req, res, next) {
  try {
    const [, token] = req.headers.authorization.split(' ');
    if (!token) {
      res.status(400).json({ message: 'Please, provide authorization header' });
    }
    await UserToken.deleteOne({ token });

    res.status(200).json({
      message: 'Logout Success',
    });
  } catch (err) {
    res.status(500).json({
      message: 'Server error',
    });
  }
}

async function deleteUserProfile(req, res, next) {
  try {
    const userID = req.user.userId;
    const user = await User.findByIdAndDelete(userID);
    if (!user) {
      return res.status(400).json({
        message: 'User not found',
      });
    }
    return res.status(200).json({
      message: 'Profile deleted successfully',
    });
  } catch (err) {
    res.status(500).json({
      message: 'Server error',
    });
  }
}

module.exports = {
  getUserProfile,
  postImageProfile,
  editPasswordUser,
  deleteImageProfile,
  updateUserCredentials,
  logoutUser,
  deleteUserProfile,
};
