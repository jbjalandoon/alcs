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
    select: false,
  },
  role: {
    type: String,
    required: true,
    enum: ["user", "admin", "superadmin"],
    default: "user",
  },
  userInformation: {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    middleName: {
      type: String,
      default: '',
    },
  },
  facultyInformation: {
    facultyCode: {
      type: String,
    },
    facultyType: {
      type: mongoose.Types.ObjectId,
      ref: "FacultyType",
    },
    schedulePreference: [
      {
        day: {
          type: Number,
        },
        startTime: {
          type: String,
        },
        endTime: {
          type: String,
        },
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
  resetToken: {
    type: String,
  },
  resetTokenExpiration: {
    type: Date,
  },
});

module.exports = mongoose.model("User", UserSChema);
