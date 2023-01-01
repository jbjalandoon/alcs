const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const ProgramSchema = new Schema({
  programName: {
    type: String,
    required: true,
  },
  programCode: {
    type: String,
    unique:true,
    required: true,
  },
  deleted: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model("Program", ProgramSchema);
