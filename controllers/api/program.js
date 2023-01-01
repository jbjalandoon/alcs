const Program = require("../../models/program");
const { validationResult } = require("express-validator");

const excelToJson = require("convert-excel-to-json");

exports.get = (req, res, next) => {
  Program.find({ deleted: false })
    .then((program) => {
      res.status(200).json({
        status: 200,
        data: program,
      });
    })
    .catch((error) => {
      res.json({
        status: 500,
        data: error,
      });
    });
};

exports.getOne = (req, res, next) => {
  Program.findOne({ _id: req.params.id })
    .then((program) => {
      res.status(200).json({
        status: 200,
        data: program,
      });
    })
    .catch((error) => {
      res.json({
        status: 500,
        data: error,
      });
    });
};

exports.post = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ status: 400, errors: errors.mapped() });
  }
  Program.findOne({ programCode: req.body.programCode })
    .then((result) => {
      if (result) {
        result.programCode = req.body.programCode;
        result.programName = req.body.programName;
        return result.save();
      }
      return new Program({
        programCode: req.body.programCode,
        programName: req.body.programName,
      }).save();
    })
    .then((result) => {
      console.log(result);
      res.json({
        data: result,
        status: 201,
      });
    })
    .catch((error) => {
      console.log(error);
      res.json({ status: 500, data: error });
    });
};

exports.edit = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ status: 400, errors: errors.mapped() });
  }
  Program.findOneAndUpdate(
    { _id: req.params.id },
    {
      programCode: req.body.programCode,
      programName: req.body.programName,
    },
    { new: true }
  )
    .then((result) => {
      res.json({ status: 201, data: result });
    })
    .catch((error) => {
      res.json({ status: 500, data: error });
    });
};

exports.delete = (req, res, next) => {
  Program.findOneAndUpdate({ _id: req.params.id }, { deleted: true })
    .then((result) => {
      res.json({ status: 202, data: result });
    })
    .catch((error) => {
      res.json({ status: 500, data: error });
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
      res.json({ ok: false });
      console.log(error);
    });
};
