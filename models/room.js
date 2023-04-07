const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const RoomSchema = new Schema({
  roomName: {
    type: String,
    required: true,
  },
  isLaboratory: {
    type: Boolean,
    default: false,
    required: true,
  },
  deleted: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model("Room", RoomSchema);
