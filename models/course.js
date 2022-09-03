const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const CourseSchema = new Schema({
  course_code: {
    type: String,
    required: true,
    unique: true,
  },
  course_description: {
    type: String,
    required: true,
  },
  units: {
    type: Number,
    required: true,
  },
  qualifications: [{ type: mongoose.Types.ObjectId, ref: "Qualification" }],
});

module.exports = mongoose.model("Course", CourseSchema);
