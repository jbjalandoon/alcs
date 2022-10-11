const Level = require("../../models/level");
const { validationResult } = require("express-validator");

exports.get = (req, res, next) => {
  Level.find({ deleted_at: null })
    .then((level) => {
      if (level.length == 0) {
        res.json({ ok: false });
      }
      res.json({ ok: true, data: level });
    })
    .catch((error) => {
      res.json({ ok: false });
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
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.json({ ok: false, errors: errors.mapped() });
  }
  new Level({
    level: req.body.year_level,
  })
    .save()
    .then((result) => {
      console.log(result);
      if (!result) {
        return res.json({ ok: false });
      }
      res.json({ ok: true, data: result });
    })
    .catch((error) => {
      res.json({ ok: false });
    });
};

exports.edit = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.json({ ok: false, errors: errors.mapped() });
  }
  Level.findOneAndUpdate({ _id: req.params.id }, { level: req.body.year_level })
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
  Level.findOneAndUpdate({ _id: req.params.id }, { deleted_at: new Date() })
    .then((result) => {
      console.log(result);
      res.json({ ok: true });
    })
    .catch((error) => {
      res.json({ ok: false });
    });
};
