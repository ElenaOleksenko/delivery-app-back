const nodemailer = require('nodemailer');

const sendEmail = async (email, subject, token, id, text) => {
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.ukr.net',
      port: 465,
      secure: true,
      auth: {
        user: 'oleksenko.elenka@ukr.net',
        pass: '44pLsvcdMbZdC3Qf',
      },
    });
    await transporter.sendMail({
      from: 'oleksenko.elenka@ukr.net',
      to: email,
      subject,
      html: `<p>You requested for reset password, kindly use this <a href="http://localhost:3000/reset-password/${token}/${id}">link</a> to reset your password</p>`,
    });
    console.log('email sent sucessfully');
  } catch (error) {
    console.log(error, 'email not sent');
  }
};

module.exports = sendEmail;
