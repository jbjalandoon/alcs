const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const UserSChema = new Schema({
  email: {
    type: "string",
    required: true,
    unique: true,
  },
  password: {
    type: "string",
    required: true,
  },
  role: {
    type: "string",
    required: true,
    enum: ["user", "admin"],
    default: "user",
  },
  userInformation: {
    faculty_code: {
      type: "string",
    },
    first_name: {
      type: "string",
    },
    last_name: {
      type: "string",
    },
    middle_name: {
      type: "string",
    },
    faculty_type: {
      type: "string",
    },
  },
  deleted_at: {
    type: Date,
    default: null,
  },
});

module.exports = mongoose.model("User", UserSChema);
