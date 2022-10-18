const Program = require("../../models/program");
const { validationResult } = require("express-validator");

const excelToJson = require("convert-excel-to-json");

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

exports.postSpreadsheet = (req, res, next) => {
  let filteredData, removedData;
  const data = excelToJson({
    sourceFile: req.file.path,
    columnToKey: {
      A: "program_code",
      B: "program_name",
    },
    header: {
      rows: 1,
    },
  });
  Program.find({
    program_code: { $in: data.sheet1.map((element) => element.program_code) },
  })
    .then((result) => {
      filteredData = data.sheet1.filter((element) => {
        return !result.some((program) => {
          return program.program_code === element.program_code;
        });
      });

      removedData = data.sheet1.filter((element) => {
        return result.some((program) => {
          return program.program_code === element.program_code;
        });
      });
      return Program.insertMany(filteredData);
    })
    .then((result) => {
      res.json({ ok: true, removedData: removedData, addedData: result });
    })
    .catch((error) => {
      res.json({ ok: false});
      console.log(error);
    });
};
