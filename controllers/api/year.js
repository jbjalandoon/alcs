const Year = require("../../models/year");
const { validationResult } = require("express-validator");

exports.get = (req, res, next) => {
  Year.find({ deleted_at: null })
    .then((year) => {
      // console.log(year);
      res.json({ ok: true, data: year });
    })
    .catch((error) => {
      return res.json({ ok: false });
    });
};

exports.getOne = (req, res, next) => {
  Year.findOne({ _id: req.params.id })
    .then((year) => {
      res.json({ ok: true, data: year });
    })
    .catch((error) => {
      res.json({ ok: false });
    });
};

exports.post = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors.mapped());
    return res.json({ ok: false, errors: errors.mapped() });
  }
  new Year({
    year: req.body.year,
  })
    .save()
    .then((result) => {
      if (!result) {
        res.json({ ok: false });
      }
      res.json({ ok: true, data: result });
    })
    .catch((error) => {
      console.log(error);
      res.json({ ok: false });
    });
};

exports.edit = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.json({ ok: false, errors: errors.mapped() });
  }
  Year.findOneAndUpdate({ _id: req.params.id }, { year: req.body.year })
    .then((result) => {
      res.json({ ok: true, data: result });
    })
    .catch((error) => {
      res.json({ ok: false });
    });
};

exports.delete = (req, res, next) => {
  Year.findOneAndUpdate({ _id: req.params.id }, { deleted_at: new Date() })
    .then((result) => {
      res.json({ ok: true, data: result });
    })
    .catch((error) => {
      console.log(error);
      res.json({ ok: false });
    });
};
