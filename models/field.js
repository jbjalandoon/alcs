const mongoose = require("mongoose");

const Schema = new mongoose.Schema;

const FieldSchema = new Schema({
  name: {
    type: String,
    require: true,
  },
  description: {
    type: String,
    require: true,
  },
});

module.exports = mongoose.model("Field", FieldSchema);
