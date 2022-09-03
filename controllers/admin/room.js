const Room = require("../../models/room");
const { validationResult } = require("express-validator");

exports.getRooms = (req, res, next) => {
  Room.find()
    .then((rooms) => {
      res.render("admin/room/index", {
        title: "ALCS | Room",
        rooms: rooms,
      });
    })
    .catch((error) => {
      throw new Error(error);
    });
};

exports.addRoom = (req, res, next) => {
  if (req.method === "GET") {
    res.render("admin/room/form", {
      title: "ALCS | Adding Room",
      edit: false,
      room: [],
      errors: [],
    });
  } else {
    const room_name = req.body.room_name;
    const laboratory = req.body.laboratory === "on" ? true : false;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.render("admin/room/form", {
        title: "ALCS | Adding Room",
        edit: false,
        room: {
          room_name: room_name,
          laboratory: laboratory,
        },
        errors: errors.array(),
      });
    }
    new Room({
      room_name: room_name,
      laboratory: laboratory,
    })
      .save()
      .then((result) => {
        req.flash(
          "input_success_message",
          "You have successfully created new room"
        );
        return res.redirect("/admin/rooms");
      })
      .catch((error) => {
        throw new Error(error);
      });
  }
};

exports.editRoom = (req, res, next) => {
  Room.findOne({ _id: req.params.id })
    .then((room) => {
      if (req.method === "GET") {
        res.render("admin/room/form", {
          title: "ALCS | Adding Room",
          edit: true,
          room: room,
          errors: [],
        });
      } else {
        room.room_name = req.body.room_name;
        room.laboratory = req.body.laboratory === "on" ? true : false;
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.render("admin/room/form", {
            title: "ALCS | Adding Room",
            edit: true,
            room: room,
            errors: errors.array(),
          });
        }
        return room.save().then((result) => {
          req.flash(
            "input_success_message",
            "You have successfully edited a room"
          );
          res.redirect("/admin/rooms");
        });
      }
    })
    .catch((error) => {
      throw new Error(error);
    });
};

exports.deleteRoom = (req, res, next) => {
  const id = req.body.id;
  Room.findByIdAndDelete(id)
    .then((result) => {
      req.flash(
        "input_success_message",
        "You have successfully deleted a room"
      );
      res.redirect("/admin/rooms");
    })
    .catch((error) => {
      throw new Error(error);
    });
};
