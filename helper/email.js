const nodemail = require("nodemailer");

const mailTransporter = nodemail.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASSWORD,
  },
});

exports.sendMail = async (to, subject, text) => {
  try {
    const emailDetails = {
      from: process.env.MAIL_USER,
      to,
      subject,
      text,
    };
    return await mailTransporter.sendMail(emailDetails);
  } catch (error) {
    console.log(error);
  }
};
