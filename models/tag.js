const { default: mongoose } = require("mongoose");

const Schema = mongoose.Schema;

const TagSchema = new Schema({
  tag: {
    type: String,
    require:true,
    unique: true,
  }
});

module.exports = mongoose.model("Tag", TagSchema);
