const Level = require("../../models/level");
const { validationResult } = require("express-validator");

exports.get = (req, res, next) => {
  Level.find({ deleted: false })
    .then((level) => {
      res.json({ ok: true, status: 200, data: level });
    })
    .catch((error) => {
      res.json({ status: 500, data: error });
    });
};

exports.getOne = (req, res, next) => {
  Level.findOne({ _id: req.params.id })
    .then((level) => {
      if (level.length == 0) {
        return res.json({ ok: false });
      }
      res.json({ ok: true, data: level });
    })
    .catch((error) => {
      res.json({ ok: false });
    });
};

exports.post = (req, res, next) => {
  console.log(req.body);
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res
      .status(400)
      .json({ ok: false, status: 400, errors: errors.mapped() });
  }
  Level.findOne({
    $or: [{ yearLevel: req.body.yearLevel }, { display: req.body.display }],
  })
    .then((result) => {
      if (result) {
        result.yearLevel = req.body.yearLevel;
        dispaly = req.body.display;
        return result.save();
      }
      return new Level({
        yearLevel: req.body.yearLevel,
        display: req.body.display,
      }).save();
    })
    .then((result) => {
      res.json({ ok: true, status: 201, data: result });
    })
    .catch((error) => {
      console.log(error);
      res.json({ status: 500, ok: false, data: error });
    });
};

exports.edit = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res
      .status(400)
      .json({ ok: false, status: 400, errors: errors.mapped() });
  }
  Level.findOneAndUpdate(
    { _id: req.params.id },
    { yearLevel: req.body.yearLevel, display: req.body.display },
    { new: true }
  )
    .then((result) => {
      res.status(201).json({ ok: true, status: 201, data: result });
    })
    .catch((error) => {
      console.log(error);
      res.status(500).json({ ok: false, status: 500, data: error });
    });
};

exports.delete = (req, res, next) => {
  Level.findOneAndUpdate({ _id: req.params.id }, { deleted: true })
    .then((result) => {
      res.status(202).json({ status: 202, ok: true, data: result });
    })
    .catch((error) => {
      res.status(500).json({ status: 500, ok: false, data: error });
    });
};
