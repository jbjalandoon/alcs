const Room = require("../../models/room");
const { validationResult } = require("express-validator");

exports.get = (req, res, next) => {
  Room.find({ deleted_at: null })
    .then((room) => {
      if (room.length == 0) {
        return res.json({ ok: false });
      }
      res.json({ ok: true, data: room });
    })
    .catch((error) => {
      console.log(error);
      res.json({ ok: false });
    });
};

exports.getOne = (req, res, next) => {
  Room.findOne({ _id: req.params.id })
    .then((room) => {
      if (!room) {
        return res.json({ ok: false });
      }
      res.json({ ok: true, data: room });
    })
    .catch((error) => {
      console.log(error);
      res.json({ ok: false });
    });
};

exports.post = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.json({ ok: false, errors: errors.mapped() });
  }
  new Room({
    room_name: req.body.room_name,
    laboratory: req.body.laboratory,
  })
    .save()
    .then((result) => {
      if (!result) {
        return res.json({ ok: false });
      }
      return res.json({ ok: true, data: result });
    })
    .catch((error) => {
      console.log(error);
      return res.json({ ok: false });
    });
};

exports.edit = (req, res, next) => {
  console.log(req.body)
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.json({ ok: false, errors: errors.mapped() });
  }
  Room.findOneAndUpdate(
    { _id: req.params.id },
    { room_name: req.body.room_name, laboratory: req.body.laboratory }
  )
    .then((result) => {
      if (!result) {
        return res.json({ ok: false });
      }
      res.json({ ok: true, data: result });
    })
    .catch((error) => {
      console.log(error);
      res.json({ ok: false });
    });
};

exports.delete = (req, res, next) => {
  Room.findOneAndUpdate({ _id: req.params.id }, { deleted_at: new Date() })
    .then((result) => {
      if (!result) {
        return res.json({ ok: false });
      }
      return res.json({ ok: true, data: result });
    })
    .catch((error) => {
      console.log(error);
      res.json({ ok: false });
    });
};
