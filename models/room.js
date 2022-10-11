const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const RoomSchema = new Schema({
  room_name: {
    type: String,
    required: true,
  },
  laboratory: {
    type: Boolean,
    default: false,
    required: true,
  },
  deleted_at: {
    type: Date,
    default: null,
  },
});

module.exports = mongoose.model("Room", RoomSchema);
