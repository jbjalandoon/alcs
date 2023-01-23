const Year = require("../../models/year");
const Curriculum = require("../../models/curriculum");
const { validationResult } = require("express-validator");

exports.get = (req, res, next) => {
  Year.find({ deleted: false })
    .then((year) => {
      res.json({ status: 200, data: year });
    })
    .catch((error) => {
      return res.json({ ok: false });
    });
};

exports.getOne = (req, res, next) => {
  Year.findOne({ _id: req.params.id })
    .then((year) => {
      res.json({ status: 201, data: year });
    })
    .catch((error) => {
      res.json({ status: 500, data: error });
    });
};

exports.post = (req, res, next) => {
  console.log(req.body);
  let year;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ status: 400, errors: errors.mapped() });
  }
  new Year({
    year: req.body.year,
  })
    .save()
    .then((result) => {
      year = result;
      return new Curriculum({
        schoolYear: result._id,
        semesters: [
          { sem: "first", isActive: false, activeFaculties: [] },
          { sem: "second", isActive: false, activeFaculties: [] },
          { sem: "summer", isActive: false, activeFaculties: [] },
        ],
      }).save();
    })
    .then((result) => {
      res.json({ status: 201, data: year });
    })
    .catch((error) => {
      res.json({ status: 500, data: error });
    });
};

exports.edit = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ status: 400, errors: errors.mapped() });
  }
  Year.findOneAndUpdate({ _id: req.params.id }, { year: req.body.year })
    .then((result) => {
      res.status(201).json({ status: 201, data: result });
    })
    .catch((error) => {
      res.status(500).json({ status: 500, data: error });
    });
};

exports.delete = (req, res, next) => {
  Year.findOneAndUpdate({ _id: req.params.id }, { deleted: true })
    .then((result) => {
      res.json({ status: 202, data: result });
    })
    .catch((error) => {
      res.json({ status: 500, data: error });
    });
};
