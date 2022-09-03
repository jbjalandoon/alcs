const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const LevelSchema = new Schema({
  level: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("Level", LevelSchema);
