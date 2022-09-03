const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const FacultySchema = new Schema({
  faculty_code: {
    type: String,
    required: true,
  },
  first_name: {
    type: String,
    required: true,
  },
  middle_name: {
    type: String,
    default: null,
  },
  last_name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  faculty_type: {
    type: String,
    required: true,
    enum: ["regular", "full-time", "part-time"],
  },
  degree: [
    {
      level: { type: String },
      description: { type: String },
    },
  ],
  qualifications: [
    {
      type: mongoose.Types.ObjectId,
      ref: "Qualification",
    },
  ],
});

module.exports = mongoose.model("Faculty", FacultySchema);
