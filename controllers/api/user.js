const User = require("../../models/user");
const Crypto = require("crypto");
const bcrypt = require("bcrypt");
const { sendMail } = require("../../helper/email");
const { validationResult } = require("express-validator");

exports.get = async (req, res, next) => {
  try {
    const user = await User.find({ deleted: false, role: { $ne: "user" } });

    if (user.length === 0)
      return res.status(404).json({ msg: "User is empty" });

    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ msg: "Something went wrong", error });
  }
};

exports.getOne = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findOne({ _id: id });

    if (!user) return res.status(404).json({ msg: "User not found" });

    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ msg: "Something went wrong" });
  }
};

exports.post = async (req, res, next) => {
  try {
    const { email, firstName, lastName, middleName, role } = req.body;
    const password = Crypto.randomBytes(8).toString("base64").slice(0, 9);
    const hashedPassword = await bcrypt.hash(password, 12);

    const userInformation = {
      firstName: firstName,
      middleName: middleName,
      lastName: lastName,
    };

    let user;
    const existingUser = await User.findOne({ email: email, deleted: true });

    if (existingUser) {
      existingUser = { password: hashedPassword, role, email, userInformation };
      user = await existingUser.save();
    } else {
      user = await new User({
        password: hashedPassword,
        role,
        email,
        userInformation,
      }).save();
    }

    const sendMailData = await sendMail(
      email,
      "Schedula - Random Password",
      password
    );

    res.status(201).json({ user, sendMailData });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Something went wrong", error });
  }
};

exports.edit = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { firstName, middleName, lastName, email } = req.body;
    const user = await User.findOneAndUpdate(
      { _id: id },
      {
        email,
        userInformation: {
          firstName,
          middleName,
          lastName,
        },
      },
      { new: true }
    );

    res.status(200).json({ user });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Something went wrong" });
  }
};

exports.delete = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findOneAndUpdate({ _id: id }, { deleted: true });

    res.status(204).json({ msg: "User Successfully Deleted", user });
  } catch (error) {
    res.status(500).json({ msg: "Something went wrong" });
  }
};
