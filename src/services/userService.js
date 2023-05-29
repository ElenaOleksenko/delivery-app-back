const bcryptjs = require('bcryptjs');
const { User } = require('../models/User');

const saveUser = async ({
  username, email, password, role,
}) => {
  const user = new User({
    username,
    email,
    password: await bcryptjs.hash(password, 10),
    role,
  });
  await user.save();
};

module.exports = {
  saveUser,
};
