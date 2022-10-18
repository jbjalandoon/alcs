const Course = require("../../models/course");
const { validationResult } = require("express-validator");
const excelToJson = require("convert-excel-to-json");
const fs = require("fs");

exports.get = (req, res, next) => {
  Course.find({ deleted_at: null })
    .then((course) => {
      if (course.length == 0) {
        return res.json({ ok: false });
      }
      res.json({ ok: true, data: course });
    })
    .catch((error) => {
      console.log(error);
      res.json({ ok: false });
    });
};

exports.getOne = (req, res, next) => {
  Course.findOne({ _id: req.params.id })
    .then((course) => {
      if (!course) {
        return res.json({ ok: false });
      }
      res.json({ ok: true, data: course });
    })
    .catch((error) => {
      console.log(error);
      res.json({ ok: false });
    });
};

exports.post = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.json({ ok: false, errors: errors.mapped() });
  }
  new Course({
    course_code: req.body.course_code,
    course_description: req.body.course_description,
    lecture: req.body.lecture,
    lab: req.body.lab,
    units: req.body.units,
  })
    .save()
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

exports.edit = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.json({ ok: false, errors: errors.mapped() });
  }
  Course.findOneAndUpdate(
    { _id: req.params.id },
    {
      course_code: req.body.course_code,
      course_description: req.body.course_description,
      lecture: req.body.lecture,
      lab: req.body.lab,
      units: req.body.units,
    }
  )
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
  Course.findOneAndUpdate({ _id: req.params.id }, { deleted_at: new Date() })
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

exports.postSpreadsheet = (req, res, next) => {
  let filteredData, removedData;
  const data = excelToJson({
    sourceFile: req.file.path,
    columnToKey: {
      A: "course_code",
      B: "course_description",
      C: "lecture",
      D: "lab",
      E: "units",
    },
    header: {
      rows: 1,
    },
  });
  Course.find({
    course_code: { $in: data.sheet1.map((element) => element.course_code) },
  })
    .then((result) => {
      filteredData = data.sheet1.filter((element) => {
        return !result.some((course) => {
          return course.course_code === element.course_code;
        });
      });

      removedData = data.sheet1.filter((element) => {
        return result.some((course) => {
          return course.course_code === element.course_code;
        });
      });
      return Course.insertMany(filteredData);
    })
    .then((result) => {
      res.json({ ok: true, removedData: removedData, addedData: result });
    })
    .catch((error) => {
      console.log(error);
    });
};
