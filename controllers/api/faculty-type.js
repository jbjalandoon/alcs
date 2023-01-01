const FacultyType = require("../../models/faculty-type");
const { validationResult } = require("express-validator");

exports.get = (req, res, next) => {
  FacultyType.find({ deleted: false })
    .then((result) => {
      res.json({ ok: true, data: result });
    })
    .catch((error) => {
      return res.json({ ok: false, data: error });
    });
};

exports.getOne = (req, res, next) => {
  FacultyType.findOne({ _id: req.params.id, deleted: false })
    .then((result) => {
      if (!result) {
        return res.status(404).json({ ok: false, status: 404 });
      }
      res.json({ ok: true, data: result, status: 200 });
    })
    .catch((error) => {
      res.status(500).json({ ok: false, data: result, status: 500 });
    });
};

exports.post = (req, res, next) => {
  errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res
      .status(400)
      .json({ ok: false, errors: errors.mapped(), status: 400 });
  }
  FacultyType.findOne({
    facultyType: req.body.facultyType,
  })
    .then((result) => {
      if (result) {
        result.deleted = false;
        result.unitsCap = req.body.unitsCap;
        result.hoursCap = req.body.hoursCap;
        return result.save();
      }
      return new FacultyType({
        facultyType: req.body.facultyType,
        unitsCap: req.body.unitsCap,
        hoursCap: req.body.hoursCap,
      }).save();
    })
    .then((result) => {
      res.json({ ok: true, data: result, status: 201 });
    })
    .catch((error) => {
      console.log(error);
      res.json({ ok: false, status: 500 });
    });
};

exports.put = (req, res, next) => {
  console.log(req.body.facultyType);
  errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res
      .status(400)
      .json({ ok: false, errors: errors.mapped(), status: 400 });
  }
  FacultyType.findOneAndUpdate(
    {
      _id: req.params.id,
    },
    {
      facultyType: req.body.facultyType,
      unitsCaps: req.body.unitsCaps,
      hoursCap: req.body.hoursCap,
    },
    { new: true }
  )
    .then((result) => {
      console.log(result);
      res.json({ ok: true, data: result, status: 201 });
    })
    .catch((error) => {
      console.log(error);
      res.json({ ok: false, status: 500 });
    });
};

exports.delete = (req, res, next) => {
  FacultyType.findOneAndUpdate(
    {
      _id: req.params.id,
    },
    {
      deleted: true,
    }
  ).then((result) => {
    res.status(202).json({ ok: true, status: 202 });
  });
};
