const fs = require('fs');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const { userId } = req.user;
    const uploadPath = path.join(__dirname, '../', 'public', 'photos', userId);
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const { userId } = req.user;
    const uploadPath = path.join(__dirname, '../', 'public', 'photos', userId);
    const filename = file.originalname;
    const filePath = path.join(uploadPath, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    cb(null, filename);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype !== 'image/jpeg' && file.mimetype !== 'image/png') {
    req.fileValidationError = 'Invalid file type';
    return cb(new Error('Invalid file type'), false);
  }

  cb(null, true);
};
const upload = multer({
  storage,
  fileFilter,
});

module.exports = upload;
