const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const DegreeSchema = new Schema({
  degree: {
    type: String,
    unique: true,
    require: true,
  },
  abbreviation: {
    type: String,
    require: true,
    default: null,
  },
  tags: [
    {
      type: mongoose.Types.ObjectId,
      require: true,
      ref: "Tag",
    },
  ],
});

module.exports = mongoose.model("Degree", DegreeSchema);
