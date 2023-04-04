const Program = require("../../models/program");
const { validationResult } = require("express-validator");

const excelToJson = require("convert-excel-to-json");

exports.get = async (req, res, next) => {
  try {
    const programs = await Program.find({ deleted: false });

    if (programs.length === 0)
      return res.status(404).json({ msg: "No program available" });

    res.status(200).json({ msg: "Successfully retrieved programs", programs });
  } catch (error) {
    res.status(500).json({ msg: "Something went wrong", error });
  }
};

exports.getOne = async (req, res, next) => {
  try {
    const program = await Program.findOne({ _id: req.params.id });

    if (!program) return res.status(404).json({ msg: "Program not found" });

    res.status(200).json({ msg: "Successfully retrieved program", program });
  } catch (error) {
    res.status(500).json({ msg: "Something went wrong" });
  }
};

exports.post = async (req, res, next) => {
  try {
    const { programCode, programName } = req.body;
    const existingProgram = await Program.findOne({ programCode });
    let newProgram;
    if (existingProgram) {
      existingProgram = { programName, deleted: false };
      newProgram = await existingProgram.save();
    } else {
      newProgram = await new Program({ programCode, programName }).save();
    }

    res.status(201).json({ msg: "Successfully added", program: newProgram });
  } catch (error) {
    res.status(500).json({ msg: "Something went wrong" });
  }
};

exports.edit = async (req, res, next) => {
  try {
    const { programCode, programName } = req.params;
    const { id } = req.params;
    const program = await Program.findOneAndUpdate(
      { _id: id },
      { programCode, programName },
      { new: true }
    );

    res.status(200).json({ msg: "Program successfully edited", program });
  } catch (error) {
    res.status(500).json({ msg: "Something went wrong" });
  }
};

exports.delete = async (req, res, next) => {
  try {
    const { id } = req.params;
    const program = await Program.findOneAndUpdate(
      { _id: id },
      { deleted: true }
    );

    res.status(200).json({ msg: "Successfully Deleted" });
  } catch (error) {
    res.status(500).json({ msg: "Something went wrong" });
  }
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
