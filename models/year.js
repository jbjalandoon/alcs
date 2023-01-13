const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const YearSchema = new Schema({
  year: {
    type: String,
    required: true,
  },
  deleted: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model("Year", YearSchema);
