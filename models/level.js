const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const LevelSchema = new Schema({
  level: {
    type: String,
    required: true,
  },
  deleted_at: {
    type: Date,
    default: null,
  },
});

module.exports = mongoose.model("Level", LevelSchema);
