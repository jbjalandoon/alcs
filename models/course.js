const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const CourseSchema = new Schema({
  course_code: {
    type: String,
    require: true,
    unique: true,
  },
  course_description: {
    type: String,
    require: true,
  },
  units: {
    type: Number,
    require: true,
  },
  qualifications: [{ type: mongoose.Types.ObjectId, ref: "Qualification" }],
});

module.exports = mongoose.model("Course", CourseSchema);
