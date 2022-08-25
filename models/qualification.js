const mongoose = require("mongoose");

const Schema = new mongoose.Schema;

const QualificationSchema = new Schema({
  tite: {
    type: String,
    require: true,
  },
  description: {
    type: String,
    require: true,
  },
  field: [
    {
      type: mongoose.Types.ObjectId,
      ref: "Field",
    },
  ],
});

module.exports = mongoose.model("Qualification", QualificationSchema);
