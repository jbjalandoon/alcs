const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const AcademicQualificationSchema = new Schema({
  academicQualification: {
    type: String,
    required: true,
    unique: true,
  },
  licenseIndustry: {
    type: [String],
    default: [],
  },
  deleted: {
    type: Boolean,
    default: false,
    required: true,
  },
});

module.exports = mongoose.model("Qualification", AcademicQualificationSchema);
