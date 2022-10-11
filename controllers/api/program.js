const Program = require("../../models/program");
const { validationResult } = require("express-validator");

exports.get = (req, res, next) => {
  Program.find({ deleted_at: null })
    .then((program) => {
      res.status(200).json({
        ok: true,
        data: program,
        length: program.length,
      });
    })
    .catch((error) => {
      res.json({
        ok: false,
      });
    });
};

exports.getOne = (req, res, next) => {
  Program.findOne({ _id: req.params.id, deleted_at: null })
    .then((program) => {
      res.status(200).json({
        ok: true,
        data: program,
        length: program.length,
      });
    })
    .catch((error) => {
      res.json({
        ok: false,
      });
    });
};

exports.post = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.json({ ok: false, errors: errors.mapped() });
  }
  new Program({
    program_code: req.body.program_code,
    program_name: req.body.program_name,
  })
    .save()
    .then((result) => {
      console.log(result);
      res.json({
        ok: true,
        data: result,
      });
    })
    .catch((error) => {
      res.json({ ok: false });
    });
};

exports.edit = (req, res, next) => {
  const errors = validationResult(req);
  console.log(errors);
  if (!errors.isEmpty()) {
    return res.json({ ok: false, errors: errors.mapped() });
  }
  Program.findOneAndUpdate(
    { _id: req.params.id },
    { program_code: req.body.program_code, program_name: req.body.program_name }
  )
    .then((result) => {
      res.json({ ok: true, data: result });
    })
    .catch((error) => {
      res.json({ ok: false });
    });
};

exports.delete = (req, res, next) => {
  Program.findOneAndUpdate({ _id: req.params.id }, { deleted_at: new Date() })
    .then((result) => {
      res.json({ ok: true });
    })
    .catch((error) => {
      res.json({ ok: false });
    });
};
