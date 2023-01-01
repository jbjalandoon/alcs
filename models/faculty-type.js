const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const FacultyTypeSchema = new Schema({
  facultyType: {
    type: String,
    required: true,
    unique: true,
  },
  unitsCap: {
    type: Number,
    required: true,
  },
  hoursCap: {
    type: Number,
    required: true,
  },
  deleted: {
    type: Boolean,
    required: true,
    default: false,
  },
});

module.exports = mongoose.model("FacultyType", FacultyTypeSchema);