const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const UserSChema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    required: true,
    enum: ["user", "admin", "superadmin"],
    default: "user",
  },
  userInformation: {
    facultyCode: {
      type: String,
    },
    firstName: {
      type: String,
    },
    lastName: {
      type: String,
    },
    middleName: {
      type: String,
    },
    facultyType: {
      type: mongoose.Types.ObjectId,
      ref: "FacultyType",
    },
    schedulePreference: [
      {
        type: String,
        default: ["m", "t", "w", "th", "f", "s"],
      },
    ],
    academicQualifications: [
      {
        academicQualification: {
          type: mongoose.Types.ObjectId,
          ref: "Qualification",
        },
        degree: {
          type: Number,
          default: 0,
        },
        licenseIndustry: [
          {
            type: mongoose.Types.ObjectId,
            ref: "Tag",
          },
        ],
        experience: {
          type: Number,
          default: 0,
        },
      },
    ],
    courseTaken: [
      {
        type: mongoose.Types.ObjectId,
        ref: "Course",
      },
    ],
  },
  deleted: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model("User", UserSChema);
