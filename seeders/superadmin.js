const Crypto = require("crypto");
const bcrypt = require("bcrypt");
const { sendMail } = require("../helper/email");
const User = require("../models/user");

const userSeeder = async () => {
  try {
    const userInformation = {
      firstName: "Jerome",
      lastName: "Jalandoon",
    };
    const password = Crypto.randomBytes(8).toString("base64").slice(0, 9);

    const hashedPassword = await bcrypt.hash(password, 12);
    const email = "sticaschedula@gmail.com";
    const user = await new User({
      email,
      password: hashedPassword,
      role: "superadmin",
      userInformation,
    }).save();

    const sendMailData = await sendMail(
      email,
      "Schedula - Random Password",
      password
    );

    return { user, sendMailData };
  } catch (error) {
    throw new Error(error);
  }
};

module.exports = userSeeder;
