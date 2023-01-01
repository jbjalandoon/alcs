const Room = require("../../models/room");
const { validationResult } = require("express-validator");

exports.get = (req, res, next) => {
  Room.find({ deleted: false })
    .then((room) => {
      res.json({ ok: true, status: 200, data: room });
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
    return res
      .status(400)
      .json({ ok: false, status: 400, errors: errors.mapped() });
  }
  Room.findOne({
    roomName: req.body.roomName,
    deleted: true,
  })
    .then((result) => {
      if (result) {
        result.roomName = req.body.roomName;
        result.laboratory = req.body.laborator;
        return result.save();
      }
      return new Room({
        roomName: req.body.roomName,
        laboratory: req.body.laboratory,
      }).save();
    })
    .then((result) => {
      return res.status(201).json({ ok: false, status: 201, data: result });
    })
    .catch((error) => {
      return res.status(500).json({ ok: false, status: 500, data: error });
    });
};

exports.edit = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(401).json({ ok: false, errors: errors.mapped() });
  }
  Room.findOneAndUpdate(
    { _id: req.params.id },
    { roomName: req.body.roomName, laboratory: req.body.laboratory },
    { new: true }
  )
    .then((result) => {
      console.log(result);
      res.status(201).json({ ok: true, status: 201, data: result });
    })
    .catch((error) => {
      console.log(error);
      res.status(500).json({ ok: false, status: 500, data: result });
    });
};

exports.delete = (req, res, next) => {
  Room.findOneAndUpdate({ _id: req.params.id }, { deleted: true })
    .then((result) => {
      return res.json({ ok: true, status: 202, data: result });
    })
    .catch((error) => {
      console.log(error);
      res.json({ ok: false, status: 500, data: error });
    });
};
