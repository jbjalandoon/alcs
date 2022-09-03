const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const ProgramSchema = new Schema({
  program_name: {
    type: String,
    required: true,
  },
  program_code: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("Program", ProgramSchema);
