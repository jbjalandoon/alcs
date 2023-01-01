const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const LevelSchema = new Schema({
  yearLevel: {
    type: String,
    required: true,
    unique:true
  },
  display: {
    type: String,
    required: true,
    unique:true,
  },
  deleted: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model("Level", LevelSchema);
