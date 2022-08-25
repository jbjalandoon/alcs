const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const FacultySchema = new Schema({
  faculty_code: {
    type: String,
    require: true,
  },
  first_name: {
    type: String,
    require: true,
  },
  middle_name: {
    type: String,
    default: null,
  },
  last_name: {
    type: String,
    require: true,
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

module.exports = mongoose("Faculty", FacultySchema);
