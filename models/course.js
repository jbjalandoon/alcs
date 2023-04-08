const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const CourseSchema = new Schema({
  courseCode: {
    type: String,
    required: true,
    unique: true,
  },
  customTitle: {
    type: String,
    default: null,
  },
  courseDescription: {
    type: String,
    required: true,
  },
  lecture: {
    type: Number,
  },
  lab: {
    type: Number,
  },
  units: {
    type: Number,
  },
  deleted: {
    type: Boolean,
    default: false,
  },
  examination: {
    type: Boolean,
    default: false,
  },
  qualification: {
    academicQualification: [String],
    licenseIndustry: [String],
    degree: {
      type: Number,
      default: 0,
    },
    experience: {
      type: Number,
      default: 0,
    },
  },
});

module.exports = mongoose.model("Course", CourseSchema);
